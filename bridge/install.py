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


def manifest_for(launcher, extension_id):
    return {
        "name": HOST,
        "description": "YouTube Study Claude Code bridge",
        "path": str(Path(launcher).resolve()),
        "type": "stdio",
        "allowed_origins": [f"chrome-extension://{extension_id}/"],
    }


def write_manifest(directory, launcher, extension_id):
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / f"{HOST}.json"
    path.write_text(json.dumps(manifest_for(launcher, extension_id), indent=2) + "\n", encoding="utf-8")
    return path


def register_chrome_user(manifest_path):
    import winreg
    key_path = rf"Software\Google\Chrome\NativeMessagingHosts\{HOST}"
    wrote = False
    for view in (winreg.KEY_WOW64_64KEY, winreg.KEY_WOW64_32KEY):
        try:
            with winreg.CreateKeyEx(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_SET_VALUE | view) as key:
                winreg.SetValueEx(key, "", 0, winreg.REG_SZ, str(manifest_path))
            wrote = True
        except OSError:
            continue
    if not wrote:
        raise SystemExit("Could not write the Chrome native messaging registry key for the current user.")


def install_windows(claude, extension_id):
    override = os.environ.get("YOUTUBE_STUDY_INSTALL_ROOT")
    data = Path(override) if override else Path(os.environ.get("LOCALAPPDATA") or "") / "YouTube Study"
    if not override and not os.environ.get("LOCALAPPDATA"):
        raise SystemExit("LOCALAPPDATA is not set, so the helper folder cannot be chosen.")
    data.mkdir(parents=True, exist_ok=True)
    host_script = data / "host.py"
    shutil.copyfile(Path(__file__).with_name("host.py"), host_script)
    launcher = data / "launch.bat"
    python = str(Path(sys.executable).resolve())
    launcher.write_bytes(
        f'@echo off\r\n"{python}" -u "{host_script.resolve()}" "{Path(claude).resolve()}"\r\n'.encode("mbcs")
    )
    manifest_path = write_manifest(data, launcher, extension_id)
    if override:
        print(f"Wrote YouTube Study host at {manifest_path}")
        return
    register_chrome_user(manifest_path)
    print(f"Registered YouTube Study at {manifest_path}")
    print(r"Chrome reads HKCU\Software\Google\Chrome\NativeMessagingHosts\com.youtube_study.claude")


def main():
    parser = argparse.ArgumentParser(description="Register YouTube Study for Google Chrome.")
    parser.add_argument("extension_id", help="32-character extension ID from chrome://extensions")
    parser.add_argument("--claude", default="claude", help="Claude Code executable path")
    args = parser.parse_args()
    if not re.fullmatch("[a-p]{32}", args.extension_id):
        parser.error("Copy the extension ID from chrome://extensions.")
    claude = shutil.which(args.claude)
    if not claude:
        parser.error("Claude Code was not found. Sign in to Claude Code and rerun from that terminal.")
    if sys.platform == "win32":
        install_windows(claude, args.extension_id)
        return
    if sys.platform == "darwin":
        chrome = Path.home() / "Library/Application Support/Google/Chrome"
        data = Path.home() / "Library/Application Support/YouTube Study"
    elif sys.platform.startswith("linux"):
        chrome = Path(os.environ.get("CHROME_CONFIG_HOME") or os.environ.get("XDG_CONFIG_HOME") or Path.home() / ".config") / "google-chrome"
        data = Path(os.environ.get("XDG_DATA_HOME") or Path.home() / ".local/share") / "youtube-study"
    else:
        parser.error("This installer supports Google Chrome on macOS, Linux, and Windows.")
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
    path = write_manifest(manifests, launcher, args.extension_id)
    print(f"Registered YouTube Study at {path}")


if __name__ == "__main__":
    main()
