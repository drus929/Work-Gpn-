#!/usr/bin/env python3
"""Validate local Pages asset links and optionally copy a build without stat shortcuts."""
from __future__ import annotations

import argparse
import hashlib
from html.parser import HTMLParser
from pathlib import Path
import re
import shutil
import sys
from urllib.parse import unquote, urlsplit

BASE = "/Work-Gpn-/"
PRESERVED = {".git", ".nojekyll", "CNAME"}


class InvalidBuild(ValueError):
    pass


class HTMLAssets(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.assets = []
        self.scripts = []

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == "script" and attrs.get("src"):
            self.assets.append(attrs["src"])
            self.scripts.append(attrs["src"])
        elif tag == "link" and attrs.get("href") and set(attrs.get("rel", "").split()) & {
            "stylesheet", "modulepreload", "preload", "icon", "manifest"
        }:
            self.assets.append(attrs["href"])
        elif tag in {"img", "source", "video", "audio", "iframe"} and attrs.get("src"):
            self.assets.append(attrs["src"])
        if tag == "video" and attrs.get("poster"):
            self.assets.append(attrs["poster"])


def local_asset(root: Path, owner: Path, reference: str, base: str):
    try:
        url = urlsplit(reference.strip())
    except ValueError as exc:
        raise InvalidBuild(f"Invalid asset URL in {owner.name}") from exc
    if url.scheme or url.netloc or not url.path:
        return None
    path = unquote(url.path)
    if path.startswith("/"):
        if not path.startswith(base):
            raise InvalidBuild(f"Asset uses a different Pages base: {reference}")
        target = root / path[len(base):]
    else:
        target = owner.parent / path
    if not target.resolve().is_relative_to(root.resolve()):
        raise InvalidBuild(f"Asset escapes the build directory: {reference}")
    if target.is_symlink() or not target.is_file() or target.stat().st_size == 0:
        raise InvalidBuild(f"Missing, empty or linked asset: {reference}")
    return target


def validate_build(directory: Path, base: str = BASE):
    root = Path(directory)
    if root.is_symlink() or not root.is_dir():
        raise InvalidBuild("Build directory is missing or is a symbolic link")
    root = root.resolve()
    index = root / "index.html"
    if not index.is_file() or index.is_symlink():
        raise InvalidBuild("Missing index.html")
    parser = HTMLAssets()
    parser.feed(index.read_text(encoding="utf-8"))
    if not parser.scripts:
        raise InvalidBuild("index.html has no application script")
    assets = set()
    pending = [local_asset(root, index, ref, base) for ref in parser.assets]
    while pending:
        asset = pending.pop()
        if asset is None or asset in assets:
            continue
        assets.add(asset)
        if asset.suffix == ".css":
            css = asset.read_text(encoding="utf-8")
            refs = re.findall(r"url\(\s*['\"]?([^)'\"]+?)['\"]?\s*\)", css)
            refs.extend(re.findall(r"@import\s+['\"]([^'\"]+)['\"]", css))
            pending.extend(local_asset(root, asset, ref, base) for ref in refs)
    return assets


def file_hash(path: Path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(65536), b""):
            digest.update(chunk)
    return digest.digest()


def verify_same_bytes(source: Path, destination: Path):
    for item in source.rglob("*"):
        if item.is_symlink():
            raise InvalidBuild(f"Build contains a symbolic link: {item.relative_to(source)}")
        if item.is_file():
            copied = destination / item.relative_to(source)
            if not copied.is_file() or copied.is_symlink() or file_hash(item) != file_hash(copied):
                raise InvalidBuild(f"Published copy differs from build: {item.relative_to(source)}")


def copy_build(source: Path, destination: Path, base: str = BASE):
    """Always copy file bytes, regardless of matching sizes and modification times."""
    source, destination = Path(source), Path(destination)
    if source.is_symlink() or destination.is_symlink():
        raise InvalidBuild("Copy roots must not be symbolic links")
    source, destination = source.resolve(), destination.resolve()
    if source == destination or source.is_relative_to(destination) or destination.is_relative_to(source):
        raise InvalidBuild("Source and destination directories must not overlap")
    validate_build(source, base)
    for item in source.rglob("*"):
        if item.is_symlink() or item.relative_to(source).parts[0] in {".git", ".github"}:
            raise InvalidBuild("Build contains symbolic links or Git metadata")
    destination.mkdir(parents=True, exist_ok=True)
    for item in destination.iterdir():
        if item.name not in PRESERVED:
            if item.is_dir() and not item.is_symlink():
                shutil.rmtree(item)
            else:
                item.unlink()
    for item in source.iterdir():
        target = destination / item.name
        if target.is_symlink():
            target.unlink()
        if item.is_dir():
            shutil.copytree(item, target)
        else:
            shutil.copy2(item, target)
    (destination / ".nojekyll").touch()
    validate_build(destination, base)
    verify_same_bytes(source, destination)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    parser.add_argument("--base", default=BASE)
    parser.add_argument("--copy-to", type=Path)
    args = parser.parse_args()
    try:
        if not args.base.startswith("/") or not args.base.endswith("/"):
            raise InvalidBuild("Pages base must begin and end with /")
        if args.copy_to:
            copy_build(args.directory, args.copy_to, args.base)
        assets = validate_build(args.directory, args.base)
        print(f"Pages build valid: {len(assets)} local assets checked")
    except (InvalidBuild, OSError, UnicodeError) as exc:
        print(f"Pages build validation failed: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
