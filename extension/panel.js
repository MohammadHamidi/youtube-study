const el = (id) => document.getElementById(id);
const host = "com.youtube_study.claude";
let busy = false;
let polling = false;
let targetKey = "";
let revision = 0;

function timestamp(value) {
  const seconds = Math.max(0, Math.floor(value));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  const tail = String(seconds % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${tail}` : `${minutes}:${tail}`;
}

async function watchTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return null;
  const url = new URL(tab.url);
  const id = url.searchParams.get("v");
  return url.origin === "https://www.youtube.com" && url.pathname === "/watch" && id
    ? { id: tab.id, videoId: id, key: `${tab.id}:${id}` } : null;
}

async function request(tab, message) {
  try {
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["player.js"] });
    return chrome.tabs.sendMessage(tab.id, message);
  }
}

function selectTarget(key) {
  if (targetKey === key) return;
  targetKey = key;
  revision++;
  el("result").hidden = true;
  el("status").textContent = "";
  el("manual").value = "";
}

function canAsk(data) {
  return data && !["ad", "seeking"].includes(data.state);
}

async function refresh() {
  if (polling) return;
  polling = true;
  try {
    const tab = await watchTab();
    selectTarget(tab?.key ?? "");
    const currentRevision = revision;
    const data = tab && await request(tab, { type: "study-context", includeCaptions: true });
    if (currentRevision !== revision) return;
    const player = data?.videoId === tab?.videoId ? data : null;
    el("video-title").textContent = player?.title || "Open a YouTube video.";
    el("player-state").textContent = player
      ? player.state === "ad" ? "Ad playing" : `${timestamp(player.seconds)} · ${player.state}`
      : "Waiting for player";
    el("caption-summary").textContent = player?.source === "transcript" ? "YouTube transcript"
      : player?.source === "captions" ? "Recent closed captions" : "Caption context unavailable";
    el("captions").textContent = player?.cues.map((cue) => `${timestamp(cue.seconds)}  ${cue.text}`).join("\n")
      || "Open the YouTube transcript, enable CC, or paste a quote.";
    el("ask").disabled = busy || !canAsk(player);
    el("transcript").disabled = !canAsk(player);
  } catch {
    el("ask").disabled = true;
    el("transcript").disabled = true;
    el("player-state").textContent = "Waiting for player";
  } finally {
    polling = false;
  }
}

el("transcript").addEventListener("click", async () => {
  try {
    const tab = await watchTab();
    if (!tab || !await request(tab, { type: "study-transcript", videoId: tab.videoId })) {
      el("status").textContent = "Expand the video description and select Show transcript, or enable CC.";
    }
  } catch {
    el("status").textContent = "Could not reach the YouTube player.";
  }
  void refresh();
});

el("question-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = el("question").value.trim();
  if (!question || busy) return;
  busy = true;
  el("ask").disabled = true;
  const requestRevision = revision;
  try {
    const tab = await watchTab();
    if (!tab || tab.key !== targetKey) throw new Error("Wait for the current video to load.");
    const data = await request(tab, { type: "study-context", includeCaptions: true });
    if (!canAsk(data) || data.videoId !== tab.videoId
        || (await watchTab())?.key !== tab.key || revision !== requestRevision) {
      throw new Error("Wait for the current video to finish loading, seeking, or playing its ad.");
    }
    el("result").hidden = true;
    el("status").textContent = "Asking Claude Code…";
    let reply;
    try {
      reply = await chrome.runtime.sendNativeMessage(host, {
        type: "explain", question, context: data, manual: el("manual").value.trim()
      });
    } catch (error) {
      throw new Error(`Local Claude Code bridge unavailable. Check setup in README. ${error.message}`);
    }
    if ((await watchTab())?.key !== tab.key || revision !== requestRevision) return;
    if (!reply?.ok) throw new Error(reply?.error || "Claude Code returned no answer.");
    el("status").textContent = "";
    el("anchor").textContent = `Asked at ${timestamp(data.seconds)}`;
    const url = new URL("https://www.youtube.com/watch");
    url.search = new URLSearchParams({ v: data.videoId, t: String(Math.floor(data.seconds)) });
    el("anchor").href = url.href;
    el("answer").textContent = reply.answer;
    el("result").hidden = false;
  } catch (error) {
    if (revision === requestRevision) el("status").textContent = error.message;
  } finally {
    busy = false;
    void refresh();
  }
});

void refresh();
setInterval(refresh, 800);
