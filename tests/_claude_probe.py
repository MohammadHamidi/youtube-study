import json
import subprocess
import sys
import tempfile

claude = r"C:\Users\user\.local\bin\claude.exe"
args = [
    claude, "-p", "--output-format", "json",
    "--no-chrome", "--tools", "", "--disallowedTools", "*",
    "--disable-slash-commands", "--permission-mode", "dontAsk",
    "--strict-mcp-config", "--mcp-config", '{"mcpServers":{}}',
    "--no-session-persistence", "--system-prompt", "Reply with the single word hello.",
]
with tempfile.TemporaryDirectory(prefix="youtube-study-") as workdir:
    result = subprocess.run(
        args, input="Say hello", capture_output=True, encoding="utf-8",
        errors="replace", cwd=workdir, timeout=60, check=False,
    )
print("code", result.returncode)
print("--- stdout ---")
print(result.stdout)
print("--- stderr ---")
print(result.stderr)
