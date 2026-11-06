"""Exercise the exact publication copy and integrity checks used by the workflow."""
import importlib.util
import os
from pathlib import Path
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts/validate-pages-build.py"
SPEC = importlib.util.spec_from_file_location("pages_publish", SCRIPT)
publish = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(publish)


def build(root, name="new"):
    (root / "assets").mkdir(parents=True)
    (root / "index.html").write_text(f'<script type="module" src="/Work-Gpn-/assets/{name}.js"></script>'
                                    '<link rel="stylesheet" href="/Work-Gpn-/assets/site.css">')
    (root / "assets" / f"{name}.js").write_text("console.log('application')")
    (root / "assets/site.css").write_text('body{font-family:test}@font-face{src:url("./font.woff2")}')
    (root / "assets/font.woff2").write_bytes(b"fixture font")


class PublishTests(unittest.TestCase):
    def test_exact_workflow_copy_replaces_equal_size_equal_mtime_index_and_removes_old_assets(self):
        with tempfile.TemporaryDirectory() as temporary:
            source, destination = Path(temporary) / "dist", Path(temporary) / "pages"
            build(source, "new")
            build(destination, "old")
            source_index, old_index = source / "index.html", destination / "index.html"
            self.assertEqual(source_index.stat().st_size, old_index.stat().st_size)
            timestamp = 1793941200
            os.utime(source_index, (timestamp, timestamp))
            os.utime(old_index, (timestamp, timestamp))
            self.assertEqual(source_index.stat().st_mtime_ns, old_index.stat().st_mtime_ns)
            (destination / ".git").write_text("gitdir: fixture worktree metadata")
            (destination / "CNAME").write_text("example.test\n")
            (destination / ".nojekyll").touch()
            publish.copy_build(source, destination)
            self.assertEqual(old_index.read_bytes(), source_index.read_bytes())
            self.assertTrue((destination / "assets/new.js").is_file())
            self.assertFalse((destination / "assets/old.js").exists())
            self.assertEqual((destination / "CNAME").read_text(), "example.test\n")
            self.assertEqual((destination / ".git").read_text(), "gitdir: fixture worktree metadata")
            self.assertTrue((destination / ".nojekyll").is_file())
            self.assertEqual(len(publish.validate_build(destination)), 3)

    def test_stale_index_referencing_deleted_bundle_is_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            build(root, "new")
            index = root / "index.html"
            index.write_text(index.read_text().replace("new.js", "old.js"))
            with self.assertRaisesRegex(publish.InvalidBuild, "Missing.*old.js"):
                publish.validate_build(root)

    def test_missing_css_font_and_wrong_pages_base_are_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            build(root)
            (root / "assets/font.woff2").unlink()
            with self.assertRaisesRegex(publish.InvalidBuild, "font.woff2"):
                publish.validate_build(root)
            (root / "assets/font.woff2").write_bytes(b"fixture font")
            index = root / "index.html"
            index.write_text(index.read_text().replace("/Work-Gpn-/assets/new.js", "/assets/new.js"))
            with self.assertRaisesRegex(publish.InvalidBuild, "different Pages base"):
                publish.validate_build(root)

    def test_source_or_destination_overlap_and_symbolic_links_cannot_be_copied(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "dist"
            build(source)
            for target in [source, source / "nested", root]:
                with self.assertRaisesRegex(publish.InvalidBuild, "overlap"):
                    publish.copy_build(source, target)
            linked = root / "linked"
            linked.symlink_to(source, target_is_directory=True)
            with self.assertRaisesRegex(publish.InvalidBuild, "symbolic links"):
                publish.copy_build(source, linked)

    def test_invalid_source_is_rejected_before_existing_site_is_modified(self):
        with tempfile.TemporaryDirectory() as temporary:
            source, destination = Path(temporary) / "dist", Path(temporary) / "pages"
            build(source, "new")
            build(destination, "old")
            before = (destination / "index.html").read_bytes()
            (source / "assets/new.js").unlink()
            with self.assertRaises(publish.InvalidBuild):
                publish.copy_build(source, destination)
            self.assertEqual((destination / "index.html").read_bytes(), before)
            self.assertTrue((destination / "assets/old.js").is_file())


if __name__ == "__main__":
    unittest.main()
