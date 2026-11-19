"""Offline regression checks for cartographic railway corridor selection."""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import unittest


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "select-rail-corridors.py"
SPEC = spec_from_file_location("rail_corridors", SCRIPT)
corridors = module_from_spec(SPEC)
SPEC.loader.exec_module(corridors)


def network(*lines):
    return {
        "type": "FeatureCollection",
        "metadata": {"segments": len(lines), "sourceFeatures": len(lines)},
        "features": [{
            "type": "Feature",
            "properties": {"sourceIds": list(range(100, 100 + len(lines)))},
            "geometry": {"type": "MultiLineString", "coordinates": list(lines)},
        }],
    }


def target(name, coordinate):
    return {"id": name, "kind": "refinery", "coordinates": coordinate}


def selected_lines(result):
    return [line for feature in result["features"]
            for line in feature["geometry"]["coordinates"]]


class RailCorridorSelectionTests(unittest.TestCase):
    def test_unrelated_dead_end_and_loop_are_removed(self):
        points = [[0, 0], [.1, 0], [.2, 0], [.1, -.1], [.1, .1], [.2, .1]]
        edges = [(0, 1), (1, 2), (1, 3), (1, 4), (4, 5), (5, 1)]

        kept, _ = corridors.select_edges(points, edges, [0, 2])

        self.assertEqual(kept, {0, 1})

    def test_shorter_existing_path_wins_even_when_long_route_is_first(self):
        points = [[0, 0], [.1, 0], [.2, 0], [.1, .5]]
        edges = [(0, 3), (3, 2), (0, 1), (1, 2)]

        kept, _ = corridors.select_edges(points, edges, [0, 2])

        self.assertEqual(kept, {2, 3})

    def test_three_terminals_connect_through_shared_junction(self):
        points = [[0, 0], [.1, 0], [.1, .1], [.2, 0], [.15, .4]]
        edges = [(0, 1), (1, 2), (1, 3), (2, 4), (4, 3)]
        anchors = [0, 2, 3]

        kept, _ = corridors.select_edges(points, edges, anchors)

        self.assertEqual(kept, {0, 1, 2})
        reachable = {anchors[0]}
        pending = [anchors[0]]
        while pending:
            node = pending.pop()
            for edge in kept:
                a, b = edges[edge]
                if node not in (a, b):
                    continue
                other = b if node == a else a
                if other not in reachable:
                    reachable.add(other)
                    pending.append(other)
        self.assertTrue(set(anchors).issubset(reachable))

    def test_disconnected_components_keep_their_own_paths(self):
        points = [[0, 0], [.1, 0], [.2, 0], [1, 0], [1.1, 0], [2, 0], [2.1, 0]]
        edges = [(0, 1), (1, 2), (3, 4), (5, 6)]

        kept, _ = corridors.select_edges(points, edges, [0, 2, 3, 4])

        self.assertEqual(kept, {0, 1, 2})

    def test_build_preserves_source_subsequence_and_provenance(self):
        line = [[0, 0], [.1, 0], [.2, 0], [.3, 0]]
        source = network(line)

        result = corridors.build_corridors(source, [target("west", line[1]), target("east", line[2])])

        self.assertEqual(selected_lines(result), [[line[1], line[2]]])
        self.assertEqual(result["features"][0]["properties"]["sourceIds"], [100])
        self.assertEqual(result["bbox"], [.1, 0, .2, 0])
        self.assertEqual(result["metadata"]["segments"], 1)
        self.assertEqual(result["metadata"]["vertices"], 2)
        self.assertEqual(result["metadata"]["selectedSourceFeatures"], 1)
        self.assertEqual(source["features"][0]["geometry"]["coordinates"], [line])

    def test_separated_runs_keep_their_own_coordinates_and_source_id(self):
        line = [[0, 0], [.1, 0], [.2, .4], [.3, 0], [.4, 0]]
        shortcut = [line[1], line[3]]
        source = network(line, shortcut)
        targets = [target("west", line[0]), target("east", line[-1])]

        result = corridors.build_corridors(source, targets)

        self.assertEqual(selected_lines(result), [[line[0], line[1]], [line[3], line[4]], shortcut])
        self.assertEqual(result["features"][0]["properties"]["sourceIds"], [100, 100, 101])

    def test_single_target_component_keeps_only_nearest_existing_approach(self):
        west = [[0, 0], [.03, 0]]
        east = [[0, 0], [.1, 0]]
        unrelated = [[1, 0], [1.1, 0]]

        result = corridors.build_corridors(network(west, east, unrelated), [target("only", [0, 0])])

        self.assertEqual(selected_lines(result), [west])
        self.assertTrue(result["metadata"]["selection"]["targets"][0]["included"])

    def test_far_target_cannot_keep_an_unrelated_component(self):
        nearby = [[0, 0], [.1, 0]]
        distant = [[2, 0], [2.1, 0]]
        targets = [target("west", nearby[0]), target("east", nearby[1]), target("unmapped", [3, 0])]

        result = corridors.build_corridors(network(nearby, distant), targets)

        self.assertEqual(selected_lines(result), [nearby])
        assessment = result["metadata"]["selection"]["targets"][-1]
        self.assertFalse(assessment["included"])
        self.assertNotIn("networkPoint", assessment)
        self.assertGreater(assessment["nearestVertexKm"], corridors.MAX_DISTANCE_KM)

    def test_component_gap_never_becomes_a_drawn_connector(self):
        west = [[0, 0], [.01, 0]]
        east = [[.0101, 0], [.02, 0]]
        source = network(west, east)
        targets = [target("west", west[0]), target("east", east[-1])]

        result = corridors.build_corridors(source, targets)

        self.assertEqual(selected_lines(result), [west, east])
        original_edges = {(tuple(a), tuple(b)) for line in [west, east] for a, b in zip(line, line[1:])}
        output_edges = {(tuple(a), tuple(b)) for line in selected_lines(result) for a, b in zip(line, line[1:])}
        self.assertEqual(output_edges, original_edges)


if __name__ == "__main__":
    unittest.main()
