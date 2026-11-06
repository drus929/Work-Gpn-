"""Offline cases for discovery, time boundaries, access failures and provenance."""
import importlib.util
import json
from pathlib import Path
import sys
import unittest
from datetime import datetime, timezone
from html import escape

SCRIPT = Path(__file__).resolve().parents[1] / "scripts/update-incident-monitor.py"
SPEC = importlib.util.spec_from_file_location("incident_monitor", SCRIPT)
monitor = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = monitor
SPEC.loader.exec_module(monitor)
NOW = datetime(2026, 11, 6, 6, tzinfo=timezone.utc)


def feed(entries=()):
    items = "".join(f"<item><title>Not published</title><source>Fixture publisher</source>"
                    f"<pubDate>{escape(date)}</pubDate><link>{escape(url)}</link></item>"
                    for date, url in entries)
    return f"<rss><channel>{items}</channel></rss>".encode()


ARTICLE = monitor.Response(("<html><title>Fixture article</title><article>" + "Readable words. " * 40
                            + "</article></html>").encode(), "https://publisher.example/story")


class Client:
    def __init__(self, responses):
        self.responses = responses
        self.calls = []

    def fetch(self, url, data=None):
        self.calls.append((url, data))
        response = self.responses[url]
        if isinstance(response, Exception):
            raise response
        return response


def client_for(ru, en=None, articles=None):
    specs = monitor.feed_specs(NOW)
    responses = {specs[0]["url"]: ru, specs[1]["url"]: en or monitor.Response(feed(), specs[1]["url"])}
    responses.update(articles or {})
    return Client(responses)


class MonitorTests(unittest.TestCase):
    def test_exact_48_hour_window_excludes_future_and_wrong_year_and_uses_moscow_date(self):
        entries = [
            ("Wed, 04 Nov 2026 06:00:00 GMT", "https://publisher.example/boundary"),
            ("Wed, 04 Nov 2026 05:59:59 GMT", "https://publisher.example/old"),
            ("Fri, 06 Nov 2026 06:00:01 GMT", "https://publisher.example/future"),
            ("Thu, 06 Nov 2025 05:00:00 GMT", "https://publisher.example/wrongyear"),
            ("Thu, 05 Nov 2026 22:00:00 GMT", "https://publisher.example/moscow"),
            ("bad date", "https://publisher.example/date"),
        ]
        items, discovered, excluded = monitor.parse_feed(feed(entries), "ru", NOW)
        self.assertEqual((discovered, excluded), (6, 4))
        self.assertEqual([i["publishedOnMoscow"] for i in items], ["2026-11-04", "2026-11-06"])
        self.assertTrue(all("title" not in item for item in items))

    def test_all_feed_failures_preserve_success_summary_without_reusing_old_articles(self):
        prior = {"lastSuccessfulRun": {"finishedAt": "2026-11-05T06:01:00Z", "counts": {"eligible": 4}},
                 "items": [{"url": "https://old.example/story"}]}
        client = client_for(monitor.FetchFailure("http_error", 403), monitor.FetchFailure("network_error"))
        result = monitor.collect(NOW, client, prior, clock=lambda: NOW)
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["items"], [])
        self.assertEqual(result["lastSuccessfulRun"], prior["lastSuccessfulRun"])
        self.assertEqual([f["status"] for f in result["feeds"]], ["http_error", "network_error"])
        self.assertEqual(result["lastAttemptAt"], "2026-11-06T06:00:00Z")
        self.assertNotEqual(result["lastSuccessfulRun"]["finishedAt"], result["finishedAt"])

    def test_same_original_url_is_probed_once_across_feeds_and_tracking_parameters(self):
        a = "https://publisher.example/story?utm_source=ru#anchor"
        b = "https://www.publisher.example/story?utm_source=en"
        date = "Fri, 06 Nov 2026 05:00:00 GMT"
        client = client_for(monitor.Response(feed([(date, a)]), "https://news.google.com/rss"),
                            monitor.Response(feed([(date, b)]), "https://news.google.com/rss"), {a: ARTICLE, b: ARTICLE})
        result = monitor.collect(NOW, client, clock=lambda: NOW)
        self.assertEqual(result["status"], "complete")
        self.assertEqual(len(result["items"]), 1)
        self.assertEqual(result["counts"]["checked"], 1)
        self.assertEqual(len(client.calls), 3)
        self.assertEqual(result["items"][0]["feedIds"], ["google-news-en", "google-news-ru"])
        self.assertEqual(result["items"][0]["reviewStatus"], "unreviewed")
        self.assertNotIn("confirmsIncident", json.dumps(result))
        self.assertNotIn("Not published", json.dumps(result))

    def test_partial_feed_failure_reports_partial_and_does_not_advance_success(self):
        url = "https://publisher.example/story"
        prior = {"lastSuccessfulRun": {"finishedAt": "2026-11-05T06:00:00Z"}}
        client = client_for(monitor.Response(feed([("Fri, 06 Nov 2026 05:00:00 GMT", url)]), "https://news.google.com/rss"),
                            monitor.Response(b"<html>not RSS</html>", "https://news.google.com/rss"), {url: ARTICLE})
        result = monitor.collect(NOW, client, prior, clock=lambda: NOW)
        self.assertEqual(result["status"], "partial")
        self.assertEqual(result["feeds"][1]["status"], "parse_error")
        self.assertEqual(result["counts"]["available"], 1)
        self.assertEqual(result["lastSuccessfulRun"], prior["lastSuccessfulRun"])

    def test_google_resolver_failure_is_not_mislabeled_as_article_read(self):
        url = "https://news.google.com/rss/articles/fixture"
        client = client_for(monitor.Response(feed([("Fri, 06 Nov 2026 05:00:00 GMT", url)]), "https://news.google.com/rss"),
                            articles={url: monitor.Response(b"<html>Requires Javascript</html>", url)})
        result = monitor.collect(NOW, client, clock=lambda: NOW)
        self.assertEqual(result["items"][0]["availability"]["status"], "unresolved")
        self.assertIsNone(result["items"][0]["availability"]["checkedAt"])
        self.assertEqual(result["counts"]["checked"], 0)

    def test_http_200_challenge_and_paywall_are_not_reported_available(self):
        url = "https://publisher.example/story"
        for body in [b"<title>Checking your browser</title>",
                     b'<script type="application/ld+json">{"isAccessibleForFree":false}</script>' + ARTICLE.body]:
            client = Client({url: monitor.Response(body, url)})
            self.assertEqual(monitor.probe_original(url, client, NOW)["status"], "blocked")
        client = Client({url: monitor.Response(b"<html><script>loadApp()</script></html>", url)})
        self.assertEqual(monitor.probe_original(url, client, NOW)["status"], "unavailable")
        client = Client({url: monitor.FetchFailure("http_error", 403)})
        self.assertEqual(monitor.probe_original(url, client, NOW)["status"], "blocked")

    def test_batched_resolver_response_returns_only_a_public_original(self):
        inner = json.dumps(["garturlres", "https://publisher.example/story"])
        body = (")]}'\n\n123\n" + json.dumps([["wrb.fr", "Fbv4je", inner]])).encode()
        self.assertEqual(monitor.decode_google_result(body), "https://publisher.example/story")
        for url in ["http://publisher.example/story", "https://user:secret@publisher.example/story",
                    "https://127.0.0.1/story", "https://169.254.169.254/latest/", "https://example.local/story",
                    "https://publisher.example:8080/story", "https://localhost/story"]:
            with self.assertRaises(ValueError):
                monitor.public_https(url)

    def test_resolver_metadata_after_large_google_app_shell_is_not_discarded(self):
        discovery = "https://news.google.com/rss/articles/fixture"
        resolver = "https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je"
        shell = b" " * 600000 + b'<div data-n-a-id="fixture" data-n-a-ts="123" data-n-a-sg="signature"></div>'
        body = (json.dumps([["wrb.fr", "Fbv4je", json.dumps(["garturlres", "https://publisher.example/story"])]])).encode()
        client = Client({discovery: monitor.Response(shell, discovery), resolver: monitor.Response(body, resolver)})
        self.assertGreater(monitor.response_limit(discovery), len(shell))
        self.assertEqual(monitor.response_limit("https://publisher.example/story"), 524288)
        self.assertEqual(monitor.resolve_original(discovery, client), "https://publisher.example/story")

    def test_limits_are_visible_and_empty_feeds_do_not_claim_no_incidents(self):
        entries = [("Fri, 06 Nov 2026 05:00:00 GMT", f"https://publisher.example/{i}") for i in range(3)]
        client = client_for(monitor.Response(feed(entries), "https://news.google.com/rss"),
                            articles={entries[-1][1]: ARTICLE})
        result = monitor.collect(NOW, client, max_articles=1, clock=lambda: NOW)
        self.assertEqual(result["counts"]["omittedByLimit"], 2)
        self.assertEqual(len(result["items"]), 1)
        client = client_for(monitor.Response(feed(), "https://news.google.com/rss"))
        empty = monitor.collect(NOW, client, clock=lambda: NOW)
        self.assertEqual(empty["status"], "complete")
        self.assertEqual(empty["counts"]["eligible"], 0)
        self.assertEqual(empty["reviewStatus"], "unreviewed")
        self.assertIn("Отсутствие результатов", " ".join(empty["limitations"]))


if __name__ == "__main__":
    unittest.main()
