#!/usr/bin/env python3
"""Discover recent news and report page accessibility; never validate incidents.

Standard library only. This collector does not change incident-data.js, retain
article bodies/titles, classify consequences, or infer recovery.
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
import hashlib
from html.parser import HTMLParser
import ipaddress
import json
from pathlib import Path
import re
import sys
import time
from urllib import error, parse, request
import xml.etree.ElementTree as ET
from zoneinfo import ZoneInfo

UTC = timezone.utc
MOSCOW = ZoneInfo("Europe/Moscow")
ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "src/data/incident-monitor.json"
SCHEDULE = {"timezone": "Europe/Moscow", "localTime": "09:00", "cronUtc": "0 6 * * *"}
LIMITATIONS = [
    "Автоматический сбор ссылок не является проверкой происшествий или их последствий.",
    "Даты публикаций получены из RSS и требуют сверки с оригиналами; это не даты событий.",
    "Перепечатки и разные языки выдачи не устанавливают независимость первоисточников.",
    "Проверяется ограниченное число страниц. Доступная страница не означает проверенную статью.",
    "Отсутствие результатов и ошибки доступа не доказывают отсутствие происшествий или восстановление НПЗ.",
]


def iso(value: datetime) -> str:
    return value.astimezone(UTC).isoformat(timespec="seconds").replace("+00:00", "Z")


def public_https(value: str) -> str:
    """Reject unsafe protocols/credentials/local addresses, including redirects."""
    url = parse.urlsplit(value)
    host = (url.hostname or "").lower().rstrip(".")
    if url.scheme != "https" or url.username or url.password or url.port not in (None, 443):
        raise ValueError("invalid_https_url")
    if not host or "." not in host or host.endswith((".localhost", ".local", ".internal")):
        raise ValueError("non_public_url")
    try:
        address = ipaddress.ip_address(host)
    except ValueError:
        address = None
    if address is not None and not address.is_global:
        raise ValueError("non_public_url")
    return value


def canonical_url(value: str) -> str:
    public_https(value)
    url = parse.urlsplit(value)
    host = url.hostname.lower().removeprefix("www.")
    query = [(k, v) for k, v in parse.parse_qsl(url.query, keep_blank_values=True)
             if not k.lower().startswith("utm_") and k.lower() not in ("fbclid", "gclid", "oc")]
    return parse.urlunsplit(("https", host, url.path or "/", parse.urlencode(sorted(query)), ""))


def google_news(value: str) -> bool:
    return parse.urlsplit(value).hostname in ("news.google.com", "news.google.com.")


def response_limit(url: str) -> int:
    # Google's public resolver attributes follow a sizeable app shell. Keep this
    # allowance separate from the smaller limits for feeds and publisher pages.
    return 1048576 if google_news(url) and "/articles/" in parse.urlsplit(url).path else 524288


class SafeRedirect(request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        public_https(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


class FetchFailure(Exception):
    def __init__(self, reason: str, http_status: int | None = None):
        super().__init__(reason)
        self.reason = reason
        self.http_status = http_status


@dataclass
class Response:
    body: bytes
    url: str
    status: int = 200
    content_type: str = "text/html"
    truncated: bool = False


class HTTPClient:
    def __init__(self, timeout=10, delay=0.35, budget=240):
        self.timeout = timeout
        self.delay = delay
        self.deadline = time.monotonic() + budget
        self.last_request = 0.0
        self.opener = request.build_opener(SafeRedirect())

    def fetch(self, url: str, data: bytes | None = None) -> Response:
        try:
            public_https(url)
        except ValueError as exc:
            raise FetchFailure(str(exc)) from exc
        for attempt in range(2):
            remaining = self.deadline - time.monotonic()
            if remaining < self.delay + 0.1:
                raise FetchFailure("time_budget_exhausted")
            pause = max(0, self.delay - (time.monotonic() - self.last_request))
            if pause:
                time.sleep(pause)
            self.last_request = time.monotonic()
            headers = {"User-Agent": "NefteatlasIncidentMonitor/1.0 (+https://drus929.github.io/Work-Gpn-/)"}
            if data is not None:
                headers["Content-Type"] = "application/x-www-form-urlencoded;charset=UTF-8"
            req = request.Request(url, data=data, headers=headers)
            try:
                with self.opener.open(req, timeout=min(self.timeout, remaining - pause)) as reply:
                    limit = response_limit(url)
                    body = reply.read(limit + 1)
                    return Response(body[:limit], reply.geturl(), reply.status,
                                    reply.headers.get_content_type(), len(body) > limit)
            except error.HTTPError as exc:
                retry = exc.code in (408, 429) or 500 <= exc.code <= 599
                failure = FetchFailure("http_error", exc.code)
            except (error.URLError, TimeoutError, OSError):
                retry = True
                failure = FetchFailure("network_error")
            except ValueError:
                retry = False
                failure = FetchFailure("unsafe_redirect")
            if attempt or not retry:
                raise failure
            if self.deadline - time.monotonic() < 1.5:
                raise FetchFailure("time_budget_exhausted")
            time.sleep(1)
        raise FetchFailure("network_error")


class PageText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip = 0
        self.in_title = False
        self.title = []
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "svg"):
            self.skip += 1
        if tag == "title":
            self.in_title = True

    def handle_endtag(self, tag):
        if tag in ("script", "style", "svg"):
            self.skip = max(0, self.skip - 1)
        if tag == "title":
            self.in_title = False

    def handle_data(self, value):
        if not self.skip:
            self.parts.append(value)
            if self.in_title:
                self.title.append(value)


def feed_specs(now: datetime):
    start_date = (now - timedelta(hours=48)).astimezone(MOSCOW).date().isoformat()
    next_date = (now.astimezone(MOSCOW).date() + timedelta(days=1)).isoformat()
    specs = []
    for key, language, region, query in [
        ("google-news-ru", "ru", "RU", "НПЗ (пожар OR атака OR остановка)"),
        ("google-news-en", "en", "US", "Russia refinery (fire OR attack OR disruption)"),
    ]:
        params = {"q": f"{query} after:{start_date} before:{next_date}",
                  "hl": language, "gl": region, "ceid": f"{region}:{language}"}
        specs.append({"id": key, "label": f"Google News RSS · {language}", "language": language,
                      "url": "https://news.google.com/rss/search?" + parse.urlencode(params)})
    return specs


def parse_feed(body: bytes, feed_id: str, now: datetime):
    root = ET.fromstring(body)
    if root.tag != "rss" or root.find("channel") is None:
        raise ValueError("not_rss")
    items, excluded = [], 0
    raw_items = root.findall("./channel/item")
    start = now - timedelta(hours=48)
    for entry in raw_items:
        try:
            date = parsedate_to_datetime(entry.findtext("pubDate", ""))
            if date.tzinfo is None:
                raise ValueError("missing_timezone")
            date = date.astimezone(UTC)
            if not start <= date <= now:
                raise ValueError("outside_window")
            link = public_https(entry.findtext("link", "").strip())
            publisher = (entry.findtext("source", "") or "").strip()
            if not publisher or len(publisher) > 200:
                raise ValueError("missing_publisher")
            items.append({"publisher": publisher, "publishedAt": iso(date),
                          "publishedOnMoscow": date.astimezone(MOSCOW).date().isoformat(),
                          "publicationDateBasis": "rss_unverified", "discoveryUrl": link,
                          "feedIds": [feed_id]})
        except (ValueError, TypeError, OverflowError):
            excluded += 1
    return items, len(raw_items), excluded


def decode_google_result(body: bytes) -> str:
    for line in body.decode("utf-8", "replace").splitlines():
        if line.startswith('[["wrb.fr"'):
            outer = json.loads(line)
            for row in outer:
                if len(row) >= 3 and row[0] == "wrb.fr" and row[1] == "Fbv4je":
                    inner = json.loads(row[2])
                    if inner[0] == "garturlres":
                        url = public_https(inner[1])
                        if google_news(url):
                            raise ValueError("resolver_returned_aggregator")
                        return url
    raise ValueError("resolver_response_unrecognized")


def resolve_original(discovery_url: str, client) -> str:
    if not google_news(discovery_url):
        return public_https(discovery_url)
    response = client.fetch(discovery_url)
    if not google_news(response.url):
        return public_https(response.url)
    attrs = dict(re.findall(r'(data-n-a-[\w-]+)="([^"]+)"', response.body.decode("utf-8", "replace")))
    try:
        article_id, timestamp, signature = attrs["data-n-a-id"], int(attrs["data-n-a-ts"]), attrs["data-n-a-sg"]
    except (KeyError, ValueError) as exc:
        reason = "resolver_page_exceeds_size_limit" if response.truncated else "resolver_metadata_unavailable"
        raise FetchFailure(reason) from exc
    payload = ["garturlreq", [["en-US", "US", ["FINANCE_TOP_INDICES", "WEB_TEST_1_0_0"],
                None, None, 1, 1, "US:en", None, 180, None, None, None, None, None, 0,
                None, None, [1608992183, 723341000]], "en-US", "US", 1, [2, 3, 4, 8],
                1, 0, "655000234", 0, 0, None, 0], article_id, timestamp, signature]
    data = parse.urlencode({"f.req": json.dumps([[["Fbv4je", json.dumps(payload), None, "generic"]]])}).encode()
    response = client.fetch("https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je", data)
    try:
        return decode_google_result(response.body)
    except (ValueError, TypeError, IndexError, json.JSONDecodeError) as exc:
        raise FetchFailure("resolver_response_unrecognized") from exc


def probe_original(url: str, client, now: datetime):
    checked_at = iso(now)
    try:
        response = client.fetch(url)
        if not 200 <= response.status < 300:
            raise FetchFailure("http_error", response.status)
        page = PageText()
        page.feed(response.body.decode("utf-8", "replace"))
        title = " ".join(page.title).lower()
        visible = " ".join(page.parts).strip()
        challenge = re.search(r"captcha|access denied|just a moment|checking.{0,10}browser|verify.{0,15}human|"
                              r"проверяем браузер|доступ ограничен|robot check", title)
        paywall = re.search(r'"isAccessibleForFree"\s*:\s*false', response.body.decode("utf-8", "replace"), re.I)
        paywall = paywall or re.search(r"subscribe to (?:continue|read|unlock)|to continue reading|"
                                      r"только для подписчиков|подпишитесь.{0,40}(?:прочитать|читать)", visible[:6000], re.I)
        challenge = challenge or paywall
        status = "blocked" if challenge else "available"
        reason = "paywall" if paywall else "access_challenge" if challenge else None
        if not challenge and ("html" not in response.content_type or len(visible) < 300):
            status, reason = "unavailable", "article_text_not_established"
        return {"status": status, "checkedAt": checked_at, "httpStatus": response.status,
                "error": reason, "contentType": response.content_type,
                "truncated": response.truncated, "finalUrl": public_https(response.url)}
    except FetchFailure as exc:
        return {"status": "blocked" if exc.http_status in (401, 403, 429, 451) else "unavailable",
                "checkedAt": checked_at, "httpStatus": exc.http_status, "error": exc.reason}
    except (ValueError, UnicodeError):
        return {"status": "unavailable", "checkedAt": checked_at, "httpStatus": None,
                "error": "invalid_page"}


def empty_monitor():
    return {"schemaVersion": 1, "reviewStatus": "unreviewed", "schedule": SCHEDULE,
            "status": "never_run", "lastAttemptAt": None, "finishedAt": None,
            "lastSuccessfulRun": None, "window": None, "feeds": [],
            "counts": {"discovered": 0, "eligible": 0, "excluded": 0, "checked": 0,
                       "available": 0, "unresolved": 0, "omittedByLimit": 0},
            "items": [], "limitations": LIMITATIONS}


def collect(now: datetime, client, previous=None, max_articles=16, clock=None):
    now = now.astimezone(UTC)
    clock = clock or (lambda: datetime.now(UTC))
    result = empty_monitor()
    result["lastAttemptAt"] = iso(now)
    start = now - timedelta(hours=48)
    result["window"] = {"from": iso(start), "to": iso(now),
                        "fromMoscow": start.astimezone(MOSCOW).strftime("%Y-%m-%d %H:%M"),
                        "toMoscow": now.astimezone(MOSCOW).strftime("%Y-%m-%d %H:%M")}
    result["lastSuccessfulRun"] = (previous or {}).get("lastSuccessfulRun")
    candidates = {}
    for spec in feed_specs(now):
        feed = {**spec, "checkedAt": iso(clock()), "status": "ok", "httpStatus": None,
                "count": 0, "error": None}
        try:
            response = client.fetch(spec["url"])
            feed["httpStatus"] = response.status
            if response.truncated:
                raise ValueError("feed_exceeds_size_limit")
            parsed, count, excluded = parse_feed(response.body, spec["id"], now)
            feed["count"] = count
            result["counts"]["discovered"] += count
            result["counts"]["excluded"] += excluded
            for item in parsed:
                identity = canonical_url(item["discoveryUrl"])
                if identity in candidates:
                    candidates[identity]["feedIds"] = sorted(set(candidates[identity]["feedIds"] + item["feedIds"]))
                else:
                    candidates[identity] = item
        except FetchFailure as exc:
            feed.update(status="http_error" if exc.http_status else "network_error",
                        httpStatus=exc.http_status, error=exc.reason)
        except (ET.ParseError, ValueError):
            feed.update(status="parse_error", error="invalid_or_incomplete_rss")
        result["feeds"].append(feed)
    good_feeds = sum(feed["status"] == "ok" for feed in result["feeds"])
    result["status"] = "complete" if good_feeds == len(result["feeds"]) else "partial" if good_feeds else "failed"
    result["counts"]["eligible"] = len(candidates)
    ordered = sorted(candidates.values(), key=lambda item: (item["publishedAt"], item["discoveryUrl"]), reverse=True)
    result["counts"]["omittedByLimit"] = max(0, len(ordered) - max_articles)
    originals = {}
    for source in ordered[:max_articles]:
        item = {**source, "reviewStatus": "unreviewed", "url": source["discoveryUrl"]}
        try:
            item["url"] = resolve_original(item["discoveryUrl"], client)
            item["resolution"] = {"status": "resolved", "checkedAt": iso(clock()), "error": None}
            identity = canonical_url(item["url"])
            if identity in originals:
                old = originals[identity]
                old["feedIds"] = sorted(set(old["feedIds"] + item["feedIds"]))
                continue
            item["availability"] = probe_original(item["url"], client, clock())
        except FetchFailure as exc:
            item["resolution"] = {"status": "failed", "checkedAt": iso(clock()),
                                  "httpStatus": exc.http_status, "error": exc.reason}
            item["availability"] = {"status": "unresolved", "checkedAt": None,
                                    "httpStatus": None, "error": "original_url_not_resolved"}
            identity = canonical_url(item["discoveryUrl"])
        item["id"] = hashlib.sha256(identity.encode()).hexdigest()[:20]
        originals[identity] = item
    result["items"] = list(originals.values())
    result["counts"]["checked"] = sum(item["availability"]["checkedAt"] is not None for item in result["items"])
    result["counts"]["available"] = sum(item["availability"]["status"] == "available" for item in result["items"])
    result["counts"]["unresolved"] = sum(item["availability"]["status"] == "unresolved" for item in result["items"])
    result["finishedAt"] = iso(clock())
    if result["status"] == "complete":
        result["lastSuccessfulRun"] = {"finishedAt": result["finishedAt"],
                                       "window": result["window"], "counts": result["counts"].copy()}
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--max-articles", type=int, default=16)
    parser.add_argument("--timeout", type=float, default=10)
    parser.add_argument("--deadline-seconds", type=float, default=240)
    args = parser.parse_args()
    if not 1 <= args.max_articles <= 50 or not 1 <= args.timeout <= 30 or not 30 <= args.deadline_seconds <= 600:
        parser.error("limits: max-articles 1..50, timeout 1..30, deadline-seconds 30..600")
    previous = json.loads(args.output.read_text()) if args.output.exists() else None
    result = collect(datetime.now(UTC), HTTPClient(args.timeout, budget=args.deadline_seconds), previous, args.max_articles)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    temporary.replace(args.output)
    print(json.dumps({"status": result["status"], "counts": result["counts"], "finishedAt": result["finishedAt"]}))
    return 2 if result["status"] == "failed" else 0


if __name__ == "__main__":
    sys.exit(main())
