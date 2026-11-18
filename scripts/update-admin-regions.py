#!/usr/bin/env python3
"""Generate the atlas GeoJSON from a local Natural Earth 1:50m Admin-1 ZIP.

Usage: /usr/bin/python3 scripts/update-admin-regions.py ne_50m_admin_1_states_provinces.zip
The generator requires the GDAL Python bindings (osgeo). No network is used.
"""

import argparse
import hashlib
import json
from pathlib import Path

from osgeo import ogr


ARCHIVE_DIGEST = '61f79e6705e62a55d6bcf698394295a589af5e24a4b2684c6519dd35c1300bf6'
OUTPUT = Path(__file__).resolve().parents[1] / 'src/data/admin-regions.json'
# Version 5.1.1 has these codes on each other's features. Match the geometry
# and name, rather than assigning Moscow's city polygon to the oblast.
ISO_CORRECTIONS = {'RU-MOS': 'RU-MOW', 'RU-MOW': 'RU-MOS'}
NAME_CORRECTIONS = {'RU-ALT': 'Алтайский край'}


def compact_polygon(raw_rings):
    """Round shared vertices identically and keep D3 spherical ring winding."""
    rings = []
    for index, ring in enumerate(raw_rings):
        points = []
        for x, y in ring:
            point = [round(x, 3), round(y, 3)]
            if not points or point != points[-1]:
                points.append(point)
        # All features in this source are already split at the antimeridian.
        area = sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(points, points[1:]))
        if len(points) < 4 or points[0] != points[-1] or not area:
            raise ValueError('Ring collapsed at this precision')
        if (index == 0 and area > 0) or (index > 0 and area < 0):
            points.reverse()
        rings.append(points)
    return rings


def region(feature):
    code = ISO_CORRECTIONS.get(feature['iso_3166_2'], feature['iso_3166_2'])
    name = NAME_CORRECTIONS.get(code, feature['name_ru'])
    shape = feature.GetGeometryRef()
    geometry = json.loads(shape.ExportToJson())
    if geometry['type'] == 'Polygon':
        geometry['coordinates'] = compact_polygon(geometry['coordinates'])
    elif geometry['type'] == 'MultiPolygon':
        geometry['coordinates'] = [compact_polygon(polygon) for polygon in geometry['coordinates']]
    else:
        raise ValueError(f'Unexpected geometry type for {code}')

    label = ogr.Geometry(ogr.wkbPoint)
    label.AddPoint_2D(feature['longitude'], feature['latitude'])
    if not shape.Contains(label):
        # For island groups a centroid may be in the sea. Place the label on
        # the largest component instead when the source label is also outside.
        main_part = max(shape, key=lambda polygon: polygon.GetArea()) if geometry['type'] == 'MultiPolygon' else shape
        label = main_part.PointOnSurface()
    return {
        'type': 'Feature', 'id': code,
        'properties': {'name': name, 'labelPoint': [round(label.GetX(), 3), round(label.GetY(), 3)]},
        'geometry': geometry,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path)
    archive = parser.parse_args().archive.resolve()
    if hashlib.sha256(archive.read_bytes()).hexdigest() != ARCHIVE_DIGEST:
        raise SystemExit('Input differs from Natural Earth 5.1.1. Review it before updating the pinned digest.')
    ogr.UseExceptions()
    dataset = ogr.Open(f'/vsizip/{archive}')
    layer = dataset.GetLayer()
    layer.SetAttributeFilter("iso_3166_2 LIKE 'RU-%'")
    features = sorted((region(feature) for feature in layer), key=lambda item: item['id'])
    if len(features) != 83 or len({item['id'] for item in features}) != 83:
        raise ValueError('Unexpected ISO 3166-2 coverage')
    result = {'type': 'FeatureCollection', 'features': features}
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
