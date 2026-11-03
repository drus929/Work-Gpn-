#!/usr/bin/env python3
"""Build the local overview rail layer from the pinned Natural Earth GeoJSON.

Usage: python scripts/update-rail-network.py /path/to/ne_10m_railroads.geojson
Requires Shapely 2.x and the project's installed Node dependencies.
The input hash is checked before any output is written. No network requests.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess
import sys

from shapely.geometry import box, shape

ROOT = Path(__file__).resolve().parents[1]
COMMIT = "ca96624a56bd078437bca8184e78163e5039ad19"
SOURCE_SHA256 = "a0962d7866060ae3e24df255f6d662389ac9ba7e0df40cf329c2281190b861e6"
BUFFER = 0.5
TOLERANCE = 0.015
PRECISION = 4
BLOCK_SIZE = 128


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    source_path = Path(sys.argv[1])
    raw = source_path.read_bytes()
    if hashlib.sha256(raw).hexdigest() != SOURCE_SHA256:
        raise SystemExit("Input hash differs from the pinned source; review before updating constants.")
    source = json.loads(raw)
    # Use the same public-domain country outline as the existing atlas.
    mask_json = subprocess.check_output([
        "node", "--input-type=module", "-e",
        "import {feature} from 'topojson-client'; import fs from 'node:fs'; "
        "const world=JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-110m.json')); "
        "console.log(JSON.stringify(feature(world,world.objects.countries).features.find(f=>f.id==='643')));",
    ], cwd=ROOT, text=True)
    mask = shape(json.loads(mask_json)["geometry"]).buffer(BUFFER).intersection(box(19, 41, 180, 75))
    segments = []
    source_ids = set()
    for feature in source["features"]:
        if feature["properties"]["featurecla"] != "Railroad":
            continue  # Rail ferries are not terrestrial railway connections.
        line = shape(feature["geometry"])
        if not line.intersects(mask):
            continue
        clipped = line.intersection(mask).simplify(TOLERANCE, preserve_topology=True)
        if clipped.is_empty:
            continue
        pieces = [clipped] if clipped.geom_type == "LineString" else list(clipped.geoms)
        for part in pieces:
            if part.geom_type != "LineString" or part.length < 0.005:
                continue
            points = [[round(x, PRECISION), round(y, PRECISION)] for x, y in part.coords]
            points = [point for i, point in enumerate(points) if not i or point != points[i-1]]
            if len(points) < 2:
                continue
            source_id = feature["properties"]["rwdb_rr_id"]
            segments.append((source_id, points))
            source_ids.add(source_id)
    features = []
    for start in range(0, len(segments), BLOCK_SIZE):
        chunk = segments[start:start + BLOCK_SIZE]
        features.append({
            "type": "Feature", "id": f"ne-rail-{start // BLOCK_SIZE + 1:03}",
            "properties": {
                "sourceClass": "Railroad",
                "sourceIds": [source_id for source_id, _ in chunk],
            },
            "geometry": {"type": "MultiLineString", "coordinates": [points for _, points in chunk]},
        })
    all_points = [point for _, line in segments for point in line]
    bbox = [min(p[0] for p in all_points), min(p[1] for p in all_points),
            max(p[0] for p in all_points), max(p[1] for p in all_points)]
    result = {
        "type": "FeatureCollection", "bbox": bbox,
        "metadata": {
            "source": "Natural Earth · ne_10m_railroads",
            "sourceUrl": f"https://github.com/nvkelso/natural-earth-vector/blob/{COMMIT}/geojson/ne_10m_railroads.geojson",
            "sourceCommit": COMMIT,
            "sourceSha256": SOURCE_SHA256,
            "sourceVersion": "4.1.0",
            "license": "Public domain",
            "licenseUrl": f"https://github.com/nvkelso/natural-earth-vector/blob/{COMMIT}/README.md",
            "checkedAt": "2026-11-03",
            "sourceFeatures": len(source["features"]),
            "selectedSourceFeatures": len(source_ids),
            "segments": len(segments),
            "vertices": len(all_points),
            "sourceClass": "Railroad",
            "excludedClasses": ["Railroad ferry"],
            "borderBufferDegrees": BUFFER,
            "simplificationToleranceDegrees": TOLERANCE,
            "coordinateDecimalPlaces": PRECISION,
            "minimumFragmentLengthDegrees": 0.005,
            "mask": "world-atlas countries-110m, country643, buffered and clipped to [19,41,180,75]",
            "coverage": "Russia and nearby cross-border context; overview geometry, not current operating status or terminal access",
        },
        "features": features,
    }
    output = ROOT / "src/data/rail-network.json"
    output.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(json.dumps({"file": str(output.relative_to(ROOT)), "bytes": output.stat().st_size,
                      "blocks": len(features), "segments": len(segments), "vertices": len(all_points),
                      "selectedSourceFeatures": len(source_ids), "bbox": bbox}, ensure_ascii=False))


if __name__ == "__main__":
    main()
