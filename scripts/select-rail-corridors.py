#!/usr/bin/env python3
"""Select existing railway geometry connecting the atlas facilities, offline.

Run after update-rail-network.py or changes to the facility catalogues.
Uses Python's standard library and the project's Node modules.
"""
from __future__ import annotations

import hashlib
import heapq
import json
import math
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MAX_DISTANCE_KM = 30


def distance(a, b):
    lon1, lat1, lon2, lat2 = map(math.radians, (*a, *b))
    value = math.sin((lat2 - lat1) / 2) ** 2
    value += math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 12742 * math.asin(min(1, math.sqrt(value)))


def facility_targets():
    code = """
      import {plants} from './src/data.js';
      import {borderCrossings} from './src/border-crossings.js';
      import {portRailConnections} from './src/rail-connections.js';
      console.log(JSON.stringify([
        ...plants.map(p => ({id:p.id, kind:'refinery', coordinates:[p.lon,p.lat]})),
        ...borderCrossings.map(p => ({id:p.id, kind:'border', coordinates:p.coordinates})),
        ...portRailConnections.filter(p => p.status === 'schematic').flatMap(p =>
          p.nodes.slice(0,-1).map((node,i) =>
            ({id:p.portId + '-' + i, facilityId:p.portId, kind:'port', coordinates:node.coordinates})))
      ]));
    """
    return json.loads(subprocess.check_output(
        ["node", "--input-type=module", "-e", code], cwd=ROOT, text=True))


def select_edges(points, edges, anchors):
    """Join terminal nodes along existing shortest paths, component by component.

    Multi-source Dijkstra yields boundaries between terminal catchments. A minimum
    spanning forest of those boundaries selects a compact set of connecting paths.
    Disconnected source components stay disconnected.
    """
    adjacency = [[] for _ in points]
    for index, (a, b) in enumerate(edges):
        length = distance(points[a], points[b])
        adjacency[a].append((b, length, index))
        adjacency[b].append((a, length, index))

    costs = [math.inf] * len(points)
    owners = [None] * len(points)
    previous = [None] * len(points)
    queue = []
    for node in sorted(set(anchors)):
        costs[node] = 0
        owners[node] = node
        heapq.heappush(queue, (0, node))
    while queue:
        cost, node = heapq.heappop(queue)
        if cost != costs[node]:
            continue
        for other, length, edge in adjacency[node]:
            candidate = cost + length
            if candidate < costs[other]:
                costs[other] = candidate
                owners[other] = owners[node]
                previous[other] = (node, edge)
                heapq.heappush(queue, (candidate, other))

    boundaries = []
    for index, (a, b) in enumerate(edges):
        if owners[a] is not None and owners[b] is not None and owners[a] != owners[b]:
            length = costs[a] + distance(points[a], points[b]) + costs[b]
            boundaries.append((length, index, a, b))
    parents = {anchor: anchor for anchor in set(anchors)}

    def representative(node):
        while parents[node] != node:
            parents[node] = parents[parents[node]]
            node = parents[node]
        return node

    kept = set()
    for _, edge, a, b in sorted(boundaries):
        first, second = representative(owners[a]), representative(owners[b])
        if first == second:
            continue
        parents[first] = second
        kept.add(edge)
        for node in (a, b):
            while previous[node] is not None:
                node, parent_edge = previous[node]
                if parent_edge in kept:
                    break
                kept.add(parent_edge)
    return kept, adjacency


def build_corridors(network, targets):
    points, point_ids, edges, lines = [], {}, [], []

    def node_id(coordinate):
        key = tuple(coordinate)
        if key not in point_ids:
            point_ids[key] = len(points)
            points.append(coordinate)
        return point_ids[key]

    for feature in network["features"]:
        for coordinates, source_id in zip(feature["geometry"]["coordinates"],
                                          feature["properties"]["sourceIds"]):
            ids = [node_id(point) for point in coordinates]
            edge_ids = []
            for a, b in zip(ids, ids[1:]):
                edge_ids.append(len(edges))
                edges.append((a, b))
            lines.append((coordinates, source_id, edge_ids))

    anchors, assessments = [], []
    for target in targets:
        node = min(range(len(points)), key=lambda index: distance(target["coordinates"], points[index]))
        offset = distance(target["coordinates"], points[node])
        assessment = {**target, "nearestVertexKm": round(offset, 2),
                      "included": offset <= MAX_DISTANCE_KM}
        if assessment["included"]:
            anchors.append(node)
            assessment["networkPoint"] = points[node]
        assessments.append(assessment)
    kept, adjacency = select_edges(points, edges, anchors)
    # A single-target isolated component still gets its nearest existing approach.
    # Adding only the shortest incident source edge also keeps coincident anchors visible.
    for anchor in anchors:
        if not any(edge in kept for _, _, edge in adjacency[anchor]):
            kept.add(min(adjacency[anchor], key=lambda entry: entry[1])[2])

    selected = []
    for coordinates, source_id, edge_ids in lines:
        run = []
        for index, edge in enumerate(edge_ids):
            if edge in kept:
                if not run:
                    run.append(coordinates[index])
                run.append(coordinates[index + 1])
            elif run:
                selected.append((source_id, run))
                run = []
        if run:
            selected.append((source_id, run))
    features = []
    for start in range(0, len(selected), 128):
        block = selected[start:start + 128]
        features.append({
            "type": "Feature", "id": f"rail-corridor-{start // 128 + 1:03}",
            "properties": {"sourceClass": "Railroad", "sourceIds": [item[0] for item in block]},
            "geometry": {"type": "MultiLineString", "coordinates": [item[1] for item in block]},
        })
    coordinates = [point for _, line in selected for point in line]
    return {
        "type": "FeatureCollection",
        "bbox": [min(p[0] for p in coordinates), min(p[1] for p in coordinates),
                 max(p[0] for p in coordinates), max(p[1] for p in coordinates)],
        "metadata": {
            **network["metadata"],
            "selectedSourceFeatures": len({item[0] for item in selected}),
            "segments": len(selected), "vertices": len(coordinates),
            "coverage": "Selected overview corridors between refinery, border and schematic port-area anchors",
            "selection": {
                "method": "Minimum spanning forest of shortest paths on exact source vertices",
                "inputSegments": network["metadata"]["segments"],
                "maximumAnchorDistanceKm": MAX_DISTANCE_KM,
                "targets": assessments,
            },
        },
        "features": features,
    }


def main():
    source = ROOT / "src/data/rail-network.json"
    raw = source.read_bytes()
    result = build_corridors(json.loads(raw), facility_targets())
    result["metadata"]["selection"]["inputSha256"] = hashlib.sha256(raw).hexdigest()
    destination = ROOT / "src/data/rail-corridors.json"
    destination.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(json.dumps({"file": str(destination.relative_to(ROOT)), "bytes": destination.stat().st_size,
                      "segments": result["metadata"]["segments"],
                      "vertices": result["metadata"]["vertices"],
                      "omittedTargets": [t["id"] for t in result["metadata"]["selection"]["targets"]
                                         if not t["included"]]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
