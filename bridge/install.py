#!/usr/bin/env python3
import argparse
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import sys

HOST = "com.youtube_study.claude"


def main():
    parser = argparse.ArgumentParser(description="Register YouTube Study for Google Chrome.")
    parser.add_argument("extension_id", help="32-character extension ID from chrome://extensions")
    parser.add_argument("--claude", default="claude", help="Claude Code executable path")
    args = parser.parse_args()
    if not re.fullmatch("[a-p]{32}", args.extension_id):
        parser.error("Copy the extension ID from chrome://extensions.")
    claude = shutil.which(args.claude)
    if not claude:
        parser.error("Claude Code was not found. Sign in to Claude Code and rerun from that Terminal.")
    if sys.platform == "darwin":
        chrome = Path.home() / "Library/Application Support/Google/Chrome"
        data = Path.home() / "Library/Application Support/YouTube Study"
    elif sys.platform.startswith("linux"):
        chrome = Path(os.environ.get("CHROME_CONFIG_HOME") or os.environ.get("XDG_CONFIG_HOME") or Path.home() / ".config") / "google-chrome"
        data = Path(os.environ.get("XDG_DATA_HOME") or Path.home() / ".local/share") / "youtube-study"
    else:
        parser.error("This installer supports Google Chrome on macOS and Linux.")
    data.mkdir(parents=True, exist_ok=True, mode=0o700)
    host_script = data / "host.py"
    shutil.copyfile(Path(__file__).with_name("host.py"), host_script)
    launcher = data / "launch"
    path = shlex.quote(os.environ.get("PATH", os.defpath))
    command = shlex.join([sys.executable, str(host_script), os.path.abspath(claude)])
    launcher.write_text(f"#!/bin/sh\nexport PATH={path}\nexec {command}\n", encoding="utf-8")
    launcher.chmod(0o700)
    manifests = chrome / "NativeMessagingHosts"
    manifests.mkdir(parents=True, exist_ok=True)
    manifest = {
        "name": HOST,
        "description": "YouTube Study Claude Code bridge",
        "path": str(launcher.resolve()),
        "type": "stdio",
        "allowed_origins": [f"chrome-extension://{args.extension_id}/"],
    }
    path = manifests / f"{HOST}.json"
    path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Registered YouTube Study at {path}")


if __name__ == "__main__":
    main()
