# YouTube Study

A personal Chrome extension for learning from YouTube with Claude Code. Pause a video, open the extension side panel, and ask a question like “What does context window mean here?” Claude uses the nearby captions to explain the concept in plain language, with a short example drawn as a small diagram. A **Map** tab splits the whole video into parts you can jump between and ask about.

## Install on macOS or Linux

1. Extract this ZIP to a folder you can keep. Have Google Chrome 123+, Python 3.8+, and an up-to-date Claude Code CLI installed. Check Claude Code from Terminal with `claude -p 'Say hello'`. It should answer under your existing Claude Code login or provider configuration.
2. Open `chrome://extensions`, turn on **Developer mode**, choose **Load unpacked**, then select this project's `extension` folder. The manifest pins the extension ID to `icblfonninechhmjeifbgafconhjhjhc`, so the card should show that ID.
3. In Terminal, change to the extracted project directory and run `python3 bridge/install.py icblfonninechhmjeifbgafconhjhjhc`. If Claude Code is outside your Terminal's PATH, pass `--claude /absolute/path/to/claude`.
4. Open a regular YouTube watch page, then open **YouTube Study** from Chrome's extensions menu. On an existing tab, refresh YouTube if the player isn't detected.
5. For immediate context after jumping into a video, choose **Open transcript** when the panel says it can't hear the video. If needed, expand YouTube's description and select **Show transcript**. If you're watching continuously, turn on **CC** and let the extension collect recent lines. Pause, type the question, and press Enter (or the round send button).
6. To map a whole video, open the **Map** tab. It needs the YouTube transcript; the panel opens it for you when it can. The map is built once per video (about 20 seconds) and saved in the extension's local storage.

After updating the extension files, click the reload button on the extension card in `chrome://extensions`. After updating `bridge/host.py`, run the installer again, because it copies the bridge into its own folder.

Chrome starts the bridge on demand. The bridge launches a separate `claude -p` request with tools disabled and session persistence off. There is no bridge web server. The question, video title/ID, playback state, and nearby caption text or your pasted quote are sent through your configured Claude Code provider only when you ask. Building a map sends the video's transcript the same way.

## Context and limits

- The panel reads playback time, playing or paused state, buffering, seeking, ads, duration, and speed from the main video player. Questions are anchored to the timestamp at submission.
- Caption context includes up to 30 lines from the preceding 90 seconds. An open YouTube transcript supplies timestamped lines immediately. Otherwise, the extension samples visible CC while you watch and clears sampled lines when you seek or change videos. CC timestamps are approximate.
- Caption and transcript detection depends on YouTube's current page markup. If neither source is usable, paste a quote or ask for a general explanation. YouTube Study does not transcribe audio. Live streams, Shorts, embeds, Windows, and Chrome Web Store installation are outside this version's supported scope.
- The panel shows the latest answer for each video. A follow-up includes your previous question and answer so "Explain it simpler" works. The clock button lists this session's questions for the current video; they are not saved after Chrome closes.
- **Text + diagram** asks Claude for a short structured answer with a 2–5 step diagram. If Claude's reply can't be read as that structure, the panel shows it as plain text. **Text** skips the diagram.
- Asking from a map part sends that part's transcript lines instead of the last 90 seconds, and the answer says so.
- If the bridge is unavailable, rerun the installer with the ID shown on your current extension card. If Claude Code fails, verify the CLI directly in Terminal and update it if needed.

## Verify

Run `node --test tests/player.test.cjs` and `python3 -m unittest discover -s tests` from this folder. The tests simulate YouTube's page and use a fake Claude CLI for the framed native message round trip.

On your Mac, open a captioned video, play then pause, and check that the panel timestamp and state match. Open the transcript, jump to a new timestamp, and ask about a nearby line. Confirm that the reply links back to the question's timestamp. Switch videos and confirm the previous answer clears (with Undo). Open the Map tab, let it build, click a part, and use **Ask about this part** and **Jump to**.

## Remove

Remove the unpacked extension from Chrome. On macOS, remove `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.youtube_study.claude.json` and `~/Library/Application Support/YouTube Study`. On Linux, the corresponding defaults are `~/.config/google-chrome/NativeMessagingHosts/com.youtube_study.claude.json` and `~/.local/share/youtube-study`.
