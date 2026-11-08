import json
import os
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


def windows_claude(folder):
    impl = folder / "mock_claude.py"
    impl.write_text(
        "import json, sys\n"
        "assert '--safe-mode' in sys.argv\n"
        "assert sys.argv[sys.argv.index('--tools')+1] == ''\n"
        "assert sys.argv[sys.argv.index('--disallowedTools')+1] == '*'\n"
        "prompt = json.load(sys.stdin)\n"
        "assert prompt['video']['seconds'] == 103\n"
        "print(json.dumps({'result': prompt['question'] + ' پاسخ'}))\n",
        encoding="utf-8",
    )
    command = folder / "mock claude.cmd"
    command.write_text(f'@echo off\r\n"{sys.executable}" -u "{impl}" %*\r\n', encoding="ascii")
    return command


class BridgeTest(unittest.TestCase):
    def test_installer_and_native_message_round_trip(self):
        if sys.platform == "win32":
            self.round_trip_windows()
            return
        if not sys.platform.startswith("linux"):
            self.skipTest("Installer test isolates the Linux paths via XDG variables.")
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            claude = root / "mock claude"
            claude.write_text(
                "#!" + sys.executable + "\n"
                "import json, sys\n"
                "assert '--safe-mode' in sys.argv\n"
                "assert sys.argv[sys.argv.index('--tools')+1] == ''\n"
                "assert sys.argv[sys.argv.index('--disallowedTools')+1] == '*'\n"
                "prompt = json.load(sys.stdin)\n"
                "assert prompt['video']['seconds'] == 103\n"
                "print(json.dumps({'result': prompt['question'] + ' پاسخ'}))\n",
                encoding="utf-8",
            )
            claude.chmod(0o700)
            extension = "a" * 32
            env = {**os.environ, "CHROME_CONFIG_HOME": str(root / "config"), "XDG_DATA_HOME": str(root / "data")}
            subprocess.run(
                [sys.executable, str(ROOT / "bridge/install.py"), extension, "--claude", str(claude)],
                env=env, check=True, capture_output=True,
            )
            path = root / "config/google-chrome/NativeMessagingHosts/com.youtube_study.claude.json"
            manifest = json.loads(path.read_text())
            self.assertEqual(manifest["allowed_origins"], [f"chrome-extension://{extension}/"])
            payload = json.dumps({"type": "explain", "question": "چی؟", "context": {"seconds": 103}}).encode()
            response = subprocess.run(
                [manifest["path"], manifest["allowed_origins"][0]],
                input=struct.pack("=I", len(payload)) + payload, capture_output=True, check=True,
            ).stdout
            self.assertEqual(struct.unpack("=I", response[:4])[0], len(response[4:]))
            self.assertEqual(json.loads(response[4:]), {"ok": True, "answer": "چی؟ پاسخ"})

    def round_trip_windows(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            claude = windows_claude(root)
            extension = "a" * 32
            env = {**os.environ, "YOUTUBE_STUDY_INSTALL_ROOT": str(root / "install")}
            subprocess.run(
                [sys.executable, str(ROOT / "bridge/install.py"), extension, "--claude", str(claude)],
                env=env, check=True, capture_output=True,
            )
            path = root / "install" / "com.youtube_study.claude.json"
            manifest = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(manifest["allowed_origins"], [f"chrome-extension://{extension}/"])
            self.assertTrue(manifest["path"].lower().endswith("launch.bat"))
            payload = json.dumps({"type": "explain", "question": "چی؟", "context": {"seconds": 103}}).encode()
            response = subprocess.run(
                [manifest["path"], manifest["allowed_origins"][0]],
                input=struct.pack("=I", len(payload)) + payload, capture_output=True, check=True, shell=True,
            ).stdout
            self.assertEqual(struct.unpack("=I", response[:4])[0], len(response[4:]))
            self.assertEqual(json.loads(response[4:]), {"ok": True, "answer": "چی؟ پاسخ"})

    def test_malformed_request_fails_before_starting_claude(self):
        response = subprocess.run(
            [sys.executable, str(ROOT / "bridge/host.py"), "/nonexistent"],
            input=struct.pack("=I", 2) + b"{}", capture_output=True, check=True,
        ).stdout
        self.assertEqual(json.loads(response[4:]), {"ok": False, "error": "Unsupported bridge request."})
