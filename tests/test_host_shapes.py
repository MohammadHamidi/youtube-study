import importlib.util
import json
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("host", ROOT / "bridge/host.py")
host = importlib.util.module_from_spec(spec)
spec.loader.exec_module(host)


def fake_claude(folder, reply):
    path = Path(folder) / "claude"
    path.write_text(
        "#!" + sys.executable + "\n"
        "import json, sys\n"
        "sys.stdin.read()\n"
        f"print(json.dumps({{'result': {reply!r}}}))\n",
        encoding="utf-8",
    )
    path.chmod(0o700)
    return str(path)


def call(claude, request):
    payload = json.dumps(request).encode()
    out = subprocess.run(
        [sys.executable, str(ROOT / "bridge/host.py"), claude],
        input=struct.pack("=I", len(payload)) + payload, capture_output=True, check=True,
    ).stdout
    return json.loads(out[4:])


class ShapeTest(unittest.TestCase):
    def test_structured_answer_is_cleaned_and_flattened(self):
        raw = json.dumps({
            "lead": "A window is how much the model reads.",
            "paragraphs": ["Older text **drops out**.", ""],
            "example": {"caption": "Like a small desk.", "diagram": {"title": "Window", "steps": [
                {"label": "Read", "note": "8K tokens"}, {"label": "Drop", "note": "oldest first"}, {"bad": 1}]}},
        })
        with tempfile.TemporaryDirectory() as folder:
            reply = call(fake_claude(folder, "```json\n" + raw + "\n```"), {
                "type": "explain", "question": "What?", "context": {"seconds": 3}, "format": "diagram"})
        self.assertTrue(reply["ok"])
        self.assertEqual(reply["structured"]["paragraphs"], ["Older text **drops out**."])
        self.assertEqual(len(reply["structured"]["example"]["diagram"]["steps"]), 2)
        self.assertIn("Like a small desk.", reply["answer"])

    def test_text_format_drops_the_diagram_and_bad_json_falls_back(self):
        raw = json.dumps({"lead": "Short.", "paragraphs": [], "example": {"caption": "", "diagram": {"steps": [
            {"label": "a"}, {"label": "b"}]}}})
        with tempfile.TemporaryDirectory() as folder:
            reply = call(fake_claude(folder, raw), {
                "type": "explain", "question": "What?", "context": {}, "format": "text"})
            self.assertIsNone(reply["structured"]["example"])
            plain = call(fake_claude(folder, "Just words."), {
                "type": "explain", "question": "What?", "context": {}, "format": "diagram"})
        self.assertEqual(plain, {"ok": True, "answer": "Just words."})

    def test_map_parts_are_validated_and_sorted(self):
        shaped = host.shape_map({"parts": [
            {"id": "p2", "title": "Second", "start": 60, "end": 120},
            {"id": "p1", "title": "First", "start": 0, "end": 60, "terms": ["a", "", "b"]},
            {"id": "p1a", "title": "Detail", "start": 10, "end": 30, "parent": "p1"},
            {"id": "x", "title": "Orphan", "start": 70, "end": 80, "parent": "missing"},
            {"id": "bad", "title": "Backwards", "start": 50, "end": 40},
        ]}, duration=100)
        self.assertEqual([p["id"] for p in shaped["parts"]], ["p1", "p1a", "p2", "x"])
        self.assertEqual(shaped["parts"][0]["terms"], ["a", "b"])
        self.assertEqual(shaped["parts"][2]["end"], 100)
        self.assertIsNone(shaped["parts"][3]["parent"])

    def test_map_request_round_trip_and_ping(self):
        parts = {"parts": [{"id": "p1", "title": "One", "start": 0, "end": 30},
                           {"id": "p2", "title": "Two", "start": 30, "end": 60}]}
        with tempfile.TemporaryDirectory() as folder:
            claude = fake_claude(folder, json.dumps(parts))
            reply = call(claude, {"type": "map", "video": {"title": "T", "duration": 60},
                                  "cues": [{"seconds": s, "text": "x"} for s in (0, 20, 40)]})
            self.assertEqual([p["title"] for p in reply["map"]["parts"]], ["One", "Two"])
            self.assertEqual(call(claude, {"type": "ping"}), {"ok": True, "claude": True})
            short = call(claude, {"type": "map", "video": {}, "cues": []})
        self.assertFalse(short["ok"])


if __name__ == "__main__":
    unittest.main()
