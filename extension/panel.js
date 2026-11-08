"use strict";
// YouTube Study side panel. Layout and copy follow the "Side Panel Redesign" design.
const $ = (id) => document.getElementById(id);
const { esc, ts, span: spanText } = window.YSMap;
const HOST = "com.youtube_study.claude";
const SETUP_CMD = `python3 bridge/install.py ${chrome.runtime.id}`;
const WINDOW_SECONDS = 90;
const Q_LIMIT = 1600;
const QUOTE_LIMIT = 4000;
const FOLD_CHARS = 1500;

const ICON = {
  check: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>',
  warn: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l9 16H3z"></path><path d="M12 10v4M12 17h.01"></path></svg>',
  clock: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path></svg>',
  info: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 11v5M12 8h.01"></path></svg>',
  retry: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-1.2 5.2M20 5v6h-6"></path></svg>',
  copy: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5"></rect><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"></path></svg>',
  play: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"></path></svg>',
  jump: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px"><circle cx="12" cy="12" r="8.5"></circle><path d="M10.5 9v6l5-3z"></path></svg>',
  chevDown: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6"></path></svg>',
  chevRight: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6l6 6-6 6"></path></svg>',
  back: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6l-6 6 6 6"></path></svg>',
  expand: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"></path></svg>',
  close: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>',
  fit: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4"></path></svg>',
  ask: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4 3.5V16h-.5A2.5 2.5 0 0 1 5 13.5z"></path></svg>',
  part: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true" style="width:12px;height:12px"><rect x="3" y="4" width="8" height="6" rx="2"></rect><rect x="13" y="14" width="8" height="6" rx="2"></rect><path d="M7 10v4a2 2 0 0 0 2 2h4"></path></svg>',
  doc: '<svg class="i" viewBox="0 0 24 24"><path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"></path><path d="M14 3.5V8h4M9 12h6M9 16h6"></path></svg>',
  cc: '<svg class="i" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"></rect><path d="M10 10.2a2.4 2.4 0 1 0 0 3.6M16.5 10.2a2.4 2.4 0 1 0 0 3.6"></path></svg>',
  paste: '<svg class="i" viewBox="0 0 24 24"><rect x="6" y="5" width="12" height="16" rx="2"></rect><path d="M9 5.5h6M9 11h6M9 15h4"></path></svg>',
  lines: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"></rect><path d="M7 10h6M7 14h10"></path></svg>',
  pause: '<svg class="i" viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"></path></svg>',
  book: '<svg class="i" viewBox="0 0 24 24"><path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H19v14H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"></path></svg>',
  ring: '<span class="ring"></span>',
  logo: '<svg width="24" height="24" viewBox="0 0 28 28" aria-hidden="true" style="flex:none;margin-top:1px"><rect width="28" height="28" rx="8" style="fill:var(--accent)"></rect><path d="M9.5 6h9A2.5 2.5 0 0 1 21 8.5v6a2.5 2.5 0 0 1-2.5 2.5H13l-3.6 3.2a.6.6 0 0 1-1-.45V17h1.1A2.5 2.5 0 0 1 7 14.5v-6A2.5 2.5 0 0 1 9.5 6z" style="fill:var(--on-accent)"></path><path d="M12.4 9.6v4.4l3.8-2.2z" style="fill:var(--accent)"></path></svg>'
};

const S = {
  tab: null,            // { id, videoId, key }
  data: null,           // latest player context for the tab
  helper: "unknown",    // ok | missing | unknown
  claude: null,
  onboarding: false,
  view: "ask",          // ask | map | history
  format: "diagram",
  thread: null,
  cancelled: null,      // question text after Cancel
  changed: null,        // { thread } shown after the video changes
  showCaps: false,
  showPaste: false,
  showHow: false,
  privacy: false,
  manual: "",
  selected: null,       // selected part id on the map
  scope: null,          // part the composer is scoped to
  following: true,
  fit: false,
  readOpen: false,
  overlay: null
};
const threads = new Map();      // videoId -> current thread
const qHistory = new Map();     // videoId -> answered threads, newest first
const maps = new Map();         // videoId -> { status, map, cues, error, started, title, duration }
const understood = new Map();   // videoId -> Set(part id)
const mapTabs = new Map();      // full-map tab id -> YouTube tab id
let polling = false;
let revision = 0;
let lastAskHtml = "";
let lastMapHtml = "";
let lastHistHtml = "";
let lastCaps = "";
let lastFollowId = null;

/* ---------------- helpers ---------------- */

function fmtInline(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/`([^`]+)`/g, '<span class="term">$1</span>');
}

const isRtl = (text) => /[֐-ࣿיִ-﷿ﹰ-﻿]/.test((text || "").slice(0, 80));

function announce(text) {
  $("status").textContent = "";
  setTimeout(() => { $("status").textContent = text; }, 30);
}

let toastTimer;
function toast(text) {
  const el = $("toast");
  el.textContent = text;
  el.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("on"), 1600);
}

function videoUrl(videoId, seconds) {
  const url = new URL("https://www.youtube.com/watch");
  url.search = new URLSearchParams({ v: videoId, t: String(Math.floor(seconds || 0)) });
  return url.href;
}

function storeGet(key) {
  return chrome.storage.local.get(key).then((r) => r[key]).catch(() => undefined);
}

function storeSet(key, value) {
  return chrome.storage.local.set({ [key]: value }).catch(() => {});
}

/* ---------------- tab and player ---------------- */

async function watchTab() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && mapTabs.has(tab.id)) {
    try { tab = await chrome.tabs.get(mapTabs.get(tab.id)); } catch { return null; }
  }
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

function phase(data) {
  if (!data) return "none";
  if (data.state === "ad") return "ad";
  if (data.state === "seeking") return "seeking";
  if (data.state === "buffering") return "buffering";
  return "ok";
}

function hasContext() {
  return Boolean(S.data && (S.data.source !== "none" || S.manual.trim()));
}

function askBlock() {
  if (S.onboarding) return "Finish setup to ask your first question.";
  if (!S.tab) return "Open a YouTube video to start.";
  if (S.thread?.status === "asking") return "Answering… press Esc to cancel.";
  if (S.thread?.status === "error" && S.thread.error.kind === "helper") {
    return "Finish the one-time helper setup above. Ask turns back on afterwards.";
  }
  const p = phase(S.data);
  if (p === "none") return "Waiting for the video player… Refresh the YouTube tab if this stays.";
  if (p === "ad") return "Waiting for the ad to finish… Ask turns back on by itself.";
  if (p === "seeking") return "Jumping to a new spot… Ask is back in a moment.";
  if (p === "buffering") return "Buffering… Ask is back when the video is ready.";
  return "";
}

/* ---------------- target changes ---------------- */

async function onTargetChange(tab) {
  const previous = S.tab;
  if (S.thread && previous) threads.set(previous.videoId, S.thread);
  const leftThread = S.thread;
  S.tab = tab;
  revision++;
  S.data = null;
  S.selected = null;
  S.scope = null;
  S.showCaps = false;
  S.showPaste = false;
  S.manual = "";
  S.readOpen = false;
  S.following = true;
  S.fit = false;
  S.cancelled = null;
  lastCaps = "";
  lastFollowId = null;
  if (S.view === "history") S.view = "ask";
  S.thread = tab ? threads.get(tab.videoId) || null : null;
  S.changed = tab && previous && previous.videoId !== tab.videoId && leftThread && !S.thread
    ? { thread: leftThread } : null;
  if (tab) await loadVideoStore(tab.videoId);
  renderAll();
}

async function loadVideoStore(videoId) {
  if (!maps.has(videoId)) {
    const cached = await storeGet(`map:${videoId}`);
    if (cached?.map?.parts) maps.set(videoId, { status: "ready", ...cached });
  }
  if (!understood.has(videoId)) {
    const list = await storeGet(`und:${videoId}`);
    understood.set(videoId, new Set(Array.isArray(list) ? list : []));
  }
}

/* ---------------- polling ---------------- */

async function refresh() {
  if (polling) return;
  polling = true;
  try {
    const tab = await watchTab();
    if ((tab?.key ?? "") !== (S.tab?.key ?? "")) await onTargetChange(tab);
    const rev = revision;
    const data = tab ? await request(tab, { type: "study-context", includeCaptions: true }).catch(() => null) : null;
    if (rev === revision) S.data = data && data.videoId === tab?.videoId ? data : null;
  } catch {
    S.data = null;
  } finally {
    polling = false;
  }
  renderLive();
}

/* ---------------- asking ---------------- */

function partPayload(part) {
  const entry = maps.get(S.tab?.videoId);
  const lines = (entry?.cues || []).filter((c) => c.seconds >= part.start && c.seconds < part.end);
  let budget = 12000;
  const kept = [];
  for (const cue of lines) {
    budget -= cue.text.length;
    if (budget < 0) break;
    kept.push(cue);
  }
  return { title: part.title, start: part.start, end: part.end, summary: part.summary, transcript: kept };
}

async function ask(text, options = {}) {
  const question = (text ?? $("question").value).trim();
  if (!question || question.length > Q_LIMIT || askBlock()) return;
  const tab = S.tab;
  const rev = revision;
  let data;
  try {
    data = await request(tab, { type: "study-context", includeCaptions: true });
  } catch {
    data = null;
  }
  if (rev !== revision || !data || data.videoId !== tab.videoId || phase(data) !== "ok") {
    toast("Wait for the video to finish loading, then ask.");
    return;
  }
  const part = options.part !== undefined ? options.part : S.scope;
  const prev = S.thread?.status === "answer" && S.thread.videoId === tab.videoId ? S.thread : null;
  const thread = {
    videoId: tab.videoId, title: data.title, question, seconds: data.seconds,
    part: part ? { id: part.id, title: part.title, start: part.start, end: part.end } : null,
    format: S.format, status: "asking", started: Date.now(), reply: null, error: null,
    showMore: false, showDetails: false
  };
  S.thread = thread;
  threads.set(tab.videoId, thread);
  S.cancelled = null;
  S.changed = null;
  S.view = "ask";
  if (text === undefined || options.clear) $("question").value = "";
  updateCount();
  renderAll();
  $("main").scrollTop = 0;
  announce("Asking Claude Code");
  const message = {
    type: "explain", question, context: data,
    manual: part ? "" : S.manual.trim().slice(0, QUOTE_LIMIT),
    format: S.format === "diagram" ? "diagram" : "text"
  };
  if (part) message.part = partPayload(part);
  if (prev) message.previous = { question: prev.question, answer: prev.reply.answer };
  let reply;
  try {
    reply = await chrome.runtime.sendNativeMessage(HOST, message);
  } catch (error) {
    if (thread.cancelled) return;
    S.helper = "missing";
    thread.status = "error";
    thread.error = { kind: "helper", detail: error.message };
    finishThread(thread, "YouTube Study's helper isn't set up yet");
    return;
  }
  if (thread.cancelled) return;
  S.helper = "ok";
  if (!reply?.ok) {
    thread.status = "error";
    thread.error = { kind: reply?.code === "timeout" ? "timeout" : "failed", detail: reply?.error || "Claude Code returned no answer." };
    finishThread(thread, thread.error.kind === "timeout" ? "That took too long" : "Claude Code didn't answer");
    return;
  }
  thread.status = "answer";
  thread.reply = { answer: reply.answer, structured: reply.structured || null };
  const list = qHistory.get(thread.videoId) || [];
  qHistory.set(thread.videoId, [thread, ...list.filter((t) => t !== thread)].slice(0, 30));
  finishThread(thread, "Answer ready");
}

function finishThread(thread, message) {
  if (S.thread === thread) {
    renderAll();
    announce(message);
  }
}

function cancelAsk() {
  const thread = S.thread;
  if (thread?.status !== "asking") return;
  thread.cancelled = true;
  threads.delete(thread.videoId);
  S.thread = null;
  S.cancelled = thread.question;
  $("question").value = thread.question;
  updateCount();
  renderAll();
  announce("Cancelled. Your question is still here.");
}

async function ping() {
  try {
    const reply = await chrome.runtime.sendNativeMessage(HOST, { type: "ping" });
    S.helper = reply?.ok ? "ok" : "missing";
    S.claude = Boolean(reply?.claude);
  } catch {
    S.helper = "missing";
    S.claude = null;
  }
}

/* ---------------- video map ---------------- */

async function ensureMap(force = false) {
  const tab = S.tab;
  if (!tab) return;
  const existing = maps.get(tab.videoId);
  if (!force && existing && ["ready", "building"].includes(existing.status)) return;
  const rev = revision;
  const entry = { status: "reading", started: Date.now() };
  maps.set(tab.videoId, entry);
  renderAll();
  let full = null;
  try {
    full = await request(tab, { type: "study-full-transcript", videoId: tab.videoId });
    if (!full || full.cues.length < 3) {
      await request(tab, { type: "study-transcript", videoId: tab.videoId });
      for (let i = 0; i < 8 && (!full || full.cues.length < 3); i++) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        if (rev !== revision || entry.cancelled) return;
        full = await request(tab, { type: "study-full-transcript", videoId: tab.videoId });
      }
    }
  } catch {
    full = null;
  }
  if (rev !== revision || entry.cancelled) return;
  if (!full || full.cues.length < 3) {
    entry.status = "empty";
    renderAll();
    return;
  }
  entry.status = "building";
  entry.cues = full.cues;
  entry.title = full.title;
  entry.duration = full.duration || full.cues.at(-1).seconds;
  entry.started = Date.now();
  renderAll();
  announce("Mapping this video");
  let reply;
  try {
    reply = await chrome.runtime.sendNativeMessage(HOST, {
      type: "map", video: { videoId: tab.videoId, title: full.title, duration: full.duration }, cues: full.cues
    });
  } catch (error) {
    if (entry.cancelled) return;
    S.helper = "missing";
    entry.status = "error";
    entry.error = { kind: "helper", detail: error.message };
    if (maps.get(tab.videoId) === entry) renderAll();
    return;
  }
  if (entry.cancelled) return;
  if (!reply?.ok) {
    entry.status = "error";
    entry.error = { kind: reply?.code === "timeout" ? "timeout" : "failed", detail: reply?.error || "No map came back." };
  } else {
    entry.status = "ready";
    entry.map = reply.map;
    storeSet(`map:${tab.videoId}`, { map: entry.map, cues: entry.cues, title: entry.title, duration: entry.duration });
    announce("Map ready");
  }
  if (maps.get(tab.videoId) === entry && S.tab?.videoId === tab.videoId) renderAll();
}

function cancelMap() {
  const entry = maps.get(S.tab?.videoId);
  if (!entry || !["reading", "building"].includes(entry.status)) return;
  entry.cancelled = true;
  maps.set(S.tab.videoId, { status: "idle" });
  renderAll();
}

function currentMap() {
  const entry = maps.get(S.tab?.videoId);
  return entry?.status === "ready" ? entry : null;
}

function partById(id) {
  return currentMap()?.map.parts.find((p) => p.id === id) || null;
}

function askedCounts() {
  const counts = new Map();
  for (const t of qHistory.get(S.tab?.videoId) || []) {
    if (t.part) counts.set(t.part.id, (counts.get(t.part.id) || 0) + 1);
  }
  return counts;
}

async function toggleUnderstood(id) {
  const set = understood.get(S.tab.videoId) || new Set();
  if (set.has(id)) set.delete(id); else set.add(id);
  understood.set(S.tab.videoId, set);
  await storeSet(`und:${S.tab.videoId}`, [...set]);
  renderAll();
}

async function openFullMap() {
  const tab = S.tab;
  if (!tab || !currentMap()) return;
  const created = await chrome.tabs.create({ url: `map.html?v=${encodeURIComponent(tab.videoId)}&tab=${tab.id}` });
  mapTabs.set(created.id, tab.id);
  chrome.storage.session.set({ mapTabs: [...mapTabs] }).catch(() => {});
}

/* ---------------- rendering: shared bits ---------------- */

function ctxInfo() {
  if (!S.data) return { tone: "load", long: "Checking for captions…", short: "Checking captions…" };
  if (S.data.source === "transcript") return { tone: "ok", long: "Context ready · YouTube transcript", short: "Context ready" };
  if (S.data.source === "captions") return { tone: "ok", long: "Context ready · Recent closed captions", short: "Context ready" };
  if (S.manual.trim()) return { tone: "ok", long: "Context ready · Your pasted quote", short: "Your quote" };
  return { tone: "warn", long: "No captions found", short: "No captions" };
}

function stateBadge(data) {
  if (!data) return { text: "Waiting", tone: "neutral" };
  return ({
    playing: { text: "Playing", tone: "accent" }, paused: { text: "Paused", tone: "neutral" },
    ad: { text: "Ad playing", tone: "warn" }, seeking: { text: "Seeking", tone: "warn" },
    buffering: { text: "Buffering", tone: "warn" }, ended: { text: "Ended", tone: "neutral" }
  })[data.state] || { text: data.state, tone: "neutral" };
}

function meterBars(data) {
  const now = data.seconds;
  const bars = [];
  for (let i = 0; i < 30; i++) {
    const from = now - WINDOW_SECONDS + i * 3;
    const chars = data.cues.filter((c) => c.seconds >= from && c.seconds < from + 3)
      .reduce((sum, c) => sum + c.text.length, 0);
    const h = chars ? Math.min(22, 5 + chars / 6) : 3;
    const cls = i === 29 ? "now" : i >= 24 ? "late" : "";
    bars.push(`<i class="${cls}" style="height:${h.toFixed(0)}px"></i>`);
  }
  return bars.join("");
}

function placeholder() {
  if (S.onboarding) return "Ask a question…";
  if (!S.tab) return "Ask about a video…";
  if (S.scope) return "Ask about this part…";
  if (S.view === "map") return "Ask about the whole video…";
  const t = S.thread;
  if (t?.status === "asking" || t?.status === "answer") return "Ask a follow-up…";
  if (t?.status === "error") return t.error.kind === "helper" ? "Set up the helper to ask"
    : t.error.kind === "timeout" ? "Ask a shorter question…" : "Ask again…";
  if (phase(S.data) === "ad") return "Ask once the ad ends";
  if (S.data && !hasContext()) return "Ask a general question…";
  return "What does “context window” mean here?";
}

/* ---------------- rendering: live (every tick) ---------------- */

function renderLive() {
  const data = S.data;
  const ctx = ctxInfo();
  const badge = stateBadge(data);
  const time = data ? ts(data.seconds) : "0:00";
  const title = data?.title || "Waiting for the video…";

  // Moment cards
  const compact = Boolean(S.thread) || S.view === "map";
  $("moment-full").hidden = !S.tab || S.onboarding || compact || S.view === "history";
  $("moment-compact").hidden = !S.tab || S.onboarding || !compact || S.view === "history";
  $("video-title").textContent = title;
  $("time").textContent = time;
  $("time").classList.toggle("dim", data?.state === "ad");
  $("state-badge").className = `badge ${badge.tone}`;
  $("state-text").textContent = badge.text;
  const showBars = Boolean(data && data.cues.length && !S.changed);
  $("meter-wrap").hidden = !showBars;
  $("meter-empty").hidden = showBars;
  $("meter-empty").textContent = data ? (S.changed ? "Checking for captions…" : "Nothing to read yet") : "Checking for captions…";
  if (showBars) {
    $("meter").innerHTML = meterBars(data);
    $("meter-start").textContent = ts(Math.max(0, data.seconds - WINDOW_SECONDS));
    $("meter-end").textContent = time;
  }
  $("caption-summary").className = `ctx ${ctx.tone}`;
  $("ctx-text").textContent = ctx.long;
  $("caption-summary").setAttribute("aria-expanded", String(S.showCaps));
  $("captions").hidden = !S.showCaps;
  if (S.showCaps) {
    const cues = data?.cues || [];
    const html = cues.length
      ? cues.map((c, i) => `<li class="${i === cues.length - 1 ? "cur" : ""}"><b>${ts(c.seconds)}</b><span dir="auto">${esc(c.text)}</span></li>`).join("")
      : '<li><span>Open the transcript, turn on CC, or paste a quote.</span></li>';
    if (html !== lastCaps) {
      $("captions").innerHTML = html;
      $("captions").scrollTop = $("captions").scrollHeight;
      lastCaps = html;
    }
  }
  const showAsked = S.thread && S.view === "ask";
  $("time-sm").textContent = showAsked ? ts(S.thread.part ? S.thread.part.start : S.thread.seconds) : time;
  $("title-sm").textContent = showAsked ? S.thread.title : title;
  $("ctx-mini").className = `mini ${ctx.tone}`;
  $("ctx-mini-text").textContent = ctx.short;
  $("ctx-mini").setAttribute("aria-label", `Caption context: ${ctx.short}`);

  // Composer chips
  const chipsHidden = !S.tab || S.onboarding;
  $("chips").hidden = chipsHidden;
  $("chip-node").hidden = !S.scope;
  if (S.scope) {
    $("chip-node-name").textContent = S.scope.title;
    $("chip-node-time").textContent = `${ts(S.scope.start)}–${ts(S.scope.end)}`;
  }
  $("chip-mom").hidden = Boolean(S.scope);
  const asking = S.thread?.status === "asking";
  $("chip-mom-time").textContent = asking ? ts(S.thread.seconds) : data?.state === "playing" ? "live" : time;
  $("chip-mom-note").textContent = asking ? "locked" : "locks when you ask";
  $("chip-ctx").className = `chip ${ctx.tone}`;
  $("chip-ctx").textContent = ctx.short;

  // Ask availability
  const block = askBlock();
  $("reason").hidden = !block;
  $("reason-text").textContent = block;
  $("question").disabled = Boolean(block) && !asking;
  $("question").placeholder = placeholder();
  $("ask").disabled = Boolean(block) || !$("question").value.trim() || $("question").value.length > Q_LIMIT;

  // Header
  const tabsOn = Boolean(S.tab) && !S.onboarding;
  $("tabs").hidden = !tabsOn;
  $("brand").hidden = tabsOn;
  $("tab-ask").classList.toggle("on", S.view !== "map");
  $("tab-ask").setAttribute("aria-pressed", String(S.view !== "map"));
  $("tab-map").classList.toggle("on", S.view === "map");
  $("tab-map").setAttribute("aria-pressed", String(S.view === "map"));
  $("history-btn").disabled = !S.tab;
  $("history-btn").setAttribute("aria-pressed", String(S.view === "history"));

  // Timers inside cards
  const waitTime = $("wait-time");
  if (waitTime && S.thread?.status === "asking") {
    waitTime.textContent = `${Math.round((Date.now() - S.thread.started) / 1000)} s · usually 5–30 s`;
  }
  const mapTime = $("map-time");
  const entry = maps.get(S.tab?.videoId);
  if (mapTime && entry?.started) {
    mapTime.textContent = `${Math.round((Date.now() - entry.started) / 1000)} s · about 20 s, once per video`;
  }
  document.querySelectorAll(".live-time").forEach((el) => { el.textContent = time; });

  renderAsk();
  renderMap();
}

/* ---------------- rendering: Ask view ---------------- */

function greetingHtml(text) {
  return `<div class="ai">${ICON.logo}<div class="ai-t"><p>${esc(text)}</p></div></div>
    <div class="sg-w">
      <button type="button" class="sg" data-act="suggest">Explain this simply</button>
      <button type="button" class="sg" data-act="suggest">Give me an example</button>
      <button type="button" class="sg" data-act="suggest">What did they just say?</button>
    </div>`;
}

function onboardingHtml() {
  const helperOk = S.helper === "ok";
  const claudeState = !helperOk ? "idle" : S.claude ? "ok" : "warn";
  return `<section style="flex:none;padding-top:6px">
      <div class="eyebrow">FIRST RUN</div>
      <h1 style="margin:4px 0 6px;font-size:24px;line-height:1.2;letter-spacing:-.025em;font-weight:600">Let's get you set up</h1>
      <p style="margin:0;font-size:15px;line-height:1.55;color:var(--text2)">Three quick checks. About a minute.</p>
    </section>
    <section class="card setup" aria-live="polite">
      <div class="st"><span class="ic ok">${ICON.check}</span><div class="st-b"><b>Extension</b><small>Installed and ready</small></div></div>
      <div class="st"><span class="ic ${helperOk ? "ok" : "warn"}">${helperOk ? ICON.check : ICON.warn}</span>
        <div class="st-b"><b>Helper on this computer</b><small>${helperOk ? "Found and working" : "Not found yet"}</small>
          ${helperOk ? "" : `<div class="st-x"><span style="font-size:13px;color:var(--text2)">Open Terminal in the YouTube Study folder, paste this and press Return.</span>${cmdHtml()}</div>`}
        </div></div>
      <div class="st"><span class="ic ${claudeState}">${claudeState === "ok" ? ICON.check : claudeState === "warn" ? ICON.warn : '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7.5"></circle></svg>'}</span>
        <div class="st-b"><b>Claude Code</b><small>${claudeState === "ok" ? "Found" : claudeState === "warn" ? "Not found. Install Claude Code, sign in, then run the command again." : "Waiting for step 2"}</small></div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn pri" data-act="check">${ICON.retry}Check again</button><button type="button" class="btn ghost" data-act="skip-setup">Skip for now</button></div>
    </section>`;
}

function cmdHtml() {
  return `<div class="cmd"><code>${esc(SETUP_CMD)}</code><button type="button" class="btn" data-act="copy-cmd" aria-label="Copy command">${ICON.copy}Copy</button></div>`;
}

function notVideoHtml() {
  return `<section class="empty">
      <div>
        <div class="eyebrow">YOUTUBE STUDY</div>
        <h1>Ask about this video</h1>
        <p>Open any YouTube video, pause where you got lost, and ask.</p>
      </div>
      <div class="dg flow" aria-hidden="true">
        <div class="fc" style="--k:var(--accent-ink)"><span class="fi">${ICON.pause}</span><b>Pause</b><small>where you got lost</small></div>
        <i class="fe"></i>
        <div class="fc" style="--k:var(--k2)"><span class="fi">${ICON.ask.replace('aria-hidden="true"', "")}</span><b>Ask</b><small>in plain words</small></div>
        <i class="fe"></i>
        <div class="fc" style="--k:var(--k3)"><span class="fi">${ICON.book}</span><b>Read</b><small>then jump back</small></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a class="btn pri" href="https://www.youtube.com" target="_blank" rel="noopener">Open YouTube</a>
        <button type="button" class="btn ghost" data-act="how" aria-expanded="${S.showHow}">How it works</button>
      </div>
      ${S.showHow ? `<div class="hint how">${ICON.info}<span>When you ask, YouTube Study reads the captions from the last 90 seconds of the video you're watching and sends them with your question to your own Claude Code. The answer appears here with a small diagram. The Map tab splits a whole video into parts you can jump between.</span></div>` : ""}
    </section>`;
}

function fixHtml() {
  const count = S.manual.length;
  return `<section class="card fix">
      <div class="fix-h">
        <span class="ic warn">${ICON.cc.replace('<svg class="i"', '<svg class="i" aria-hidden="true"')}</span>
        <div><b>I can't hear this video yet.</b><p>Open the transcript or turn on CC so I know what was said.</p></div>
      </div>
      <div class="fxs">
        <button type="button" id="transcript" class="fx" data-act="open-transcript"><span class="fi">${ICON.doc}</span><span class="fx-t"><b>Open transcript</b><small>Shows the full text beside the video</small></span>${ICON.chevRight}</button>
        <button type="button" class="fx" data-act="cc"><span class="fi">${ICON.cc}</span><span class="fx-t"><b>Turn on CC</b><small>Or press C in the player</small></span>${ICON.chevRight}</button>
        <button type="button" class="fx" data-act="paste" aria-expanded="${S.showPaste}" aria-controls="manual"><span class="fi">${ICON.paste}</span><span class="fx-t"><b>Paste a quote</b><small>Subtitles, or any text you want explained</small></span>${ICON.chevDown}</button>
      </div>
      <div id="manual" class="paste" ${S.showPaste ? "" : "hidden"}>
        <textarea id="manual-text" dir="auto" rows="3" maxlength="${QUOTE_LIMIT}" placeholder="Paste subtitles or a quote…" aria-label="Pasted quote"></textarea>
        <div class="paste-f"><span>I'll read this together with your question.</span><span class="mono ${count >= QUOTE_LIMIT ? "at-limit" : ""}" id="manual-count">${count.toLocaleString()} / 4,000</span></div>
      </div>
      <p class="soft">No time? You can still ask a general question below.</p>
    </section>`;
}

function waitHtml(p) {
  const head = { ad: "Waiting for the ad to finish…", seeking: "Jumping to a new spot…", buffering: "Buffering…", none: "Looking for the video player…" }[p];
  const soft = p === "none"
    ? "If this doesn't change, refresh the YouTube tab."
    : `Ask turns back on by itself. Your place at <span class="mono live-time">${esc(ts(S.data?.seconds))}</span> is saved.`;
  return `<section class="card wait" aria-live="polite">
      <div class="wait-h">${ICON.ring}<span>${head}</span></div>
      <p class="soft" style="font-size:13.5px;line-height:1.5;color:var(--text2)">${soft}</p>
    </section>`;
}

function bubbleHtml(t) {
  const tag = t.part
    ? `${ICON.part}${esc(t.part.title)} · <span class="mono">${ts(t.part.start)}–${ts(t.part.end)}</span>`
    : `<svg class="i" viewBox="0 0 24 24" aria-hidden="true" style="width:12px;height:12px"><path d="M8 5.5v13l11-6.5z"></path></svg><span class="mono">${ts(t.seconds)}</span>`;
  const note = t.status === "error" && t.error.kind === "helper"
    ? `<span class="nt"><svg class="i" viewBox="0 0 24 24" aria-hidden="true" style="width:13px;height:13px"><path d="M12 4l9 16H3z"></path><path d="M12 10v4M12 17h.01"></path></svg>Not sent</span>` : "";
  return `<div class="u"><span class="tag">${tag}</span><div class="q" dir="auto">${esc(t.question)}</div>${note}</div>`;
}

function askingHtml(t) {
  const first = t.part ? `Read the part “${esc(t.part.title)}”` : "Read the last 90 seconds";
  return `<section class="card wait" aria-live="polite">
      <div class="wait-h">${ICON.ring}<span>Thinking about what was said at <span class="mono">${ts(t.part ? t.part.start : t.seconds)}</span>…</span></div>
      <ol class="steps">
        <li class="done"><span class="sd">${ICON.check}</span>${first}</li>
        <li class="now"><span class="sd"></span>Asking Claude Code…</li>
        <li><span class="sd"></span>Writing your answer</li>
      </ol>
      <div class="skel" aria-hidden="true"><i style="width:92%"></i><i style="width:78%"></i><i style="width:56%"></i></div>
      <div class="wait-f"><span id="wait-time">0 s · usually 5–30 s</span><button type="button" class="btn" data-act="cancel">Cancel <span class="kbd">Esc</span></button></div>
    </section>`;
}

function diagramSvg(diagram, rtl) {
  const steps = diagram.steps;
  const W = 276;
  const x = 14;
  const w = 248;
  const h = 44;
  const gap = 28;
  const colors = ["--k2", "--k4", "--n1", "--accent", "--k3"];
  let y0 = 8;
  let out = "";
  if (diagram.title) {
    const pw = Math.min(w, 28 + diagram.title.length * 6.6);
    const px = rtl ? x + w - pw : x;
    out += `<rect class="sv-pill" x="${px}" y="8" width="${pw.toFixed(0)}" height="22" rx="11"></rect>`;
    out += `<text class="sv-pt" x="${(px + pw / 2).toFixed(0)}" y="23" text-anchor="middle" ${rtl ? 'direction="rtl"' : ""}>${esc(diagram.title)}</text>`;
    y0 = 40;
  }
  steps.forEach((step, i) => {
    const y = y0 + i * (h + gap);
    const last = i === steps.length - 1;
    const color = last ? "--k3" : colors[i % colors.length];
    const cx = rtl ? x + w - 34 : x + 10;
    const tx = rtl ? x + w - 42 : x + 42;
    const anchor = rtl ? 'text-anchor="start" direction="rtl"' : "";
    out += `<rect class="sv-card" x="${x}" y="${y}" width="${w}" height="${h}" rx="14"></rect>`;
    out += `<rect x="${cx}" y="${y + 10}" width="24" height="24" rx="8" style="fill:color-mix(in srgb,var(${color}) 18%,transparent)"></rect>`;
    out += last
      ? `<path d="M${cx + 7} ${y + 22.5}l3.6 3.6 7-7.2" style="fill:none;stroke:var(--k3);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"></path>`
      : `<text x="${cx + 12}" y="${y + 26}" text-anchor="middle" style="fill:var(${color});font-size:11.5px;font-weight:700">${i + 1}</text>`;
    const label = step.label.length > 28 ? `${step.label.slice(0, 27)}…` : step.label;
    const note = step.note.length > 36 ? `${step.note.slice(0, 35)}…` : step.note;
    out += `<text class="sv-t" x="${tx}" y="${step.note ? y + 19 : y + 26}" ${anchor}>${esc(label)}</text>`;
    if (step.note) out += `<text class="sv-s" x="${tx}" y="${y + 34}" ${anchor}>${esc(note)}</text>`;
    if (!last) {
      const ex = 138;
      const a = y + h;
      const b = y + h + gap - 4;
      out += `<path class="sv-tr" d="M${ex} ${a + 3}V${b}"></path><path class="sv-fl" d="M${ex} ${a + 3}V${b}"></path>`;
      out += `<circle class="sv-port" cx="${ex}" cy="${a}" r="3"></circle>`;
      out += `<path class="sv-hd" d="M${ex - 4.5} ${b - 4.5}L${ex} ${b + 0.5}L${ex + 4.5} ${b - 4.5}"></path>`;
    }
  });
  const height = y0 + steps.length * h + (steps.length - 1) * gap + 8;
  const aria = `Diagram${diagram.title ? `: ${diagram.title}` : ""}. ${steps.map((s, i) => `${i + 1}. ${s.label}${s.note ? `, ${s.note}` : ""}`).join(". ")}.`;
  return `<svg class="gx" viewBox="0 0 ${W} ${height}" role="img" aria-label="${esc(aria)}">${out}</svg>`;
}

function answerBodyHtml(t) {
  const st = t.reply.structured;
  let paragraphs;
  if (st) {
    paragraphs = [];
    if (st.lead) paragraphs.push(`<p class="lead">${fmtInline(st.lead)}</p>`);
    for (const p of st.paragraphs) paragraphs.push(`<p>${fmtInline(p)}</p>`);
  } else {
    paragraphs = t.reply.answer.split(/\n{2,}/).filter(Boolean).map((p) => `<p>${fmtInline(p)}</p>`);
  }
  return paragraphs.join("");
}

function answerHtml(t) {
  const st = t.reply.structured;
  const rtl = isRtl(st ? st.lead || st.paragraphs[0] : t.reply.answer);
  const sameVideo = t.videoId === S.tab?.videoId;
  const jumpAt = t.part ? t.part.start : t.seconds;
  const jumpLabel = t.part ? "Jump to" : "Asked at";
  const textLength = st ? [st.lead, ...st.paragraphs].join(" ").length : t.reply.answer.length;
  const fold = textLength > FOLD_CHARS && !t.showMore;
  const example = st?.example;
  const scope = t.part
    ? `<div class="scope"><span>Answered from the part <b>${esc(t.part.title)}</b>, not the whole video.</span>${sameVideo && partById(t.part.id) ? '<button type="button" class="btn" style="height:32px" data-act="show-on-map">Show on map</button>' : ""}</div>` : "";
  const figure = example ? `<figure class="ex">
        <div class="ex-h"><span class="lab">Example</span>${example.diagram ? `<button type="button" class="ib" data-act="expand" aria-label="Expand diagram" style="width:32px;height:32px">${ICON.expand}</button>` : ""}</div>
        ${example.diagram ? `<div class="dg">${diagramSvg(example.diagram, rtl)}</div>` : ""}
        ${example.caption ? `<figcaption class="ex-c ${rtl ? "rtl" : ""}" dir="${rtl ? "rtl" : "auto"}">${fmtInline(example.caption)}</figcaption>` : ""}
      </figure>` : "";
  const parts = currentMap()?.map.parts || [];
  const idx = t.part ? parts.findIndex((p) => p.id === t.part.id) : -1;
  const next = idx >= 0 ? parts.slice(idx + 1).find((p) => !p.parent) : null;
  const followups = t.part
    ? `${next ? `<button type="button" class="sg" data-act="next-part" data-id="${esc(next.id)}">Next part: ${esc(next.title)}</button>` : ""}<button type="button" class="sg" data-act="whole-video">Ask about the whole video</button>`
    : ["Show another example", "Explain it simpler", "Why does it matter?"].map((q) => `<button type="button" class="sg" data-act="suggest">${q}</button>`).join("");
  return `<article id="result" class="card ans">
      <div class="ans-h">
        <span class="lab">Explanation</span>
        <a id="anchor" class="jump" href="${esc(videoUrl(t.videoId, jumpAt))}" target="_blank" rel="noopener" data-act="jump" data-t="${jumpAt}">${ICON.jump}${jumpLabel} <span class="mono">${ts(jumpAt)}</span></a>
      </div>
      ${scope}
      <div id="answer" class="ans-b ${rtl ? "rtl" : ""} ${fold ? "fold" : ""}" dir="${rtl ? "rtl" : "auto"}" ${rtl ? 'lang="fa"' : ""}>${answerBodyHtml(t)}</div>
      ${textLength > FOLD_CHARS ? `<button type="button" class="btn ghost more" data-act="more">${t.showMore ? "Show less" : "Show more"}</button>` : ""}
      ${figure}
      <div class="acts">
        <button type="button" class="btn" data-act="copy">${ICON.copy}Copy</button>
        <button type="button" class="btn" data-act="again">${ICON.retry}Ask again</button>
      </div>
    </article>
    <div class="fu">${followups}</div>`;
}

function detailsHtml(t, act = "details") {
  return `<button type="button" class="det" data-act="${act}" aria-expanded="${t.showDetails}">Show details ${ICON.chevDown}</button>`;
}

function errorHtml(t, retryAct = "retry") {
  const e = t.error;
  const detAct = retryAct === "retry" ? "details" : "map-details";
  const details = t.showDetails ? `<pre class="det-x">${esc(e.detail)}</pre>` : "";
  if (e.kind === "helper") {
    return `<section class="card err" role="alert">
        <div class="err-h"><span class="ic err">${ICON.warn}</span>
          <div><b>YouTube Study's helper isn't set up on this computer yet.</b><p>Claude Code runs through a small helper here. One command installs it.</p></div></div>
        <ol class="ol">
          <li><div><span>Open Terminal in the YouTube Study folder.</span></div></li>
          <li><div><span>Paste this and press Return.</span>${cmdHtml()}</div></li>
          <li><div><span>Come back here and try again.</span></div></li>
        </ol>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <button type="button" class="btn pri" data-act="${retryAct}-helper">${ICON.retry}I've done it, try again</button>${detailsHtml(t, detAct)}
        </div>${details}
      </section>`;
  }
  if (e.kind === "timeout") {
    return `<section class="card err" role="alert">
        <div class="err-h"><span class="ic warn">${ICON.clock}</span><div><b>That took too long.</b><p>Try again, or ask a shorter question.</p></div></div>
        <p class="soft">Stopped before an answer came back.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <button type="button" class="btn pri" data-act="${retryAct}">${ICON.retry}Try again</button>
          ${retryAct === "retry" ? '<button type="button" class="btn" data-act="edit">Edit question</button>' : ""}
        </div>
      </section>`;
  }
  return `<section class="card err" role="alert">
      <div class="err-h"><span class="ic err">${ICON.warn}</span><div><b>${retryAct === "retry" ? "Claude Code didn't answer." : "I couldn't draw the map."}</b><p>Make sure you're signed in to Claude Code, then try again.</p></div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <button type="button" class="btn pri" data-act="${retryAct}">${ICON.retry}Try again</button>${detailsHtml(t, detAct)}
      </div>${details}
    </section>`;
}

function askViewHtml() {
  if (S.onboarding) return onboardingHtml();
  if (!S.tab) return notVideoHtml();
  let html = "";
  if (S.changed && !S.thread) {
    html += `<div class="old">${ICON.check}<span>Previous answer cleared</span><button type="button" class="btn ghost" style="height:32px" data-act="undo">Undo</button></div><div class="sep">New video</div>`;
  }
  if (S.cancelled && !S.thread) {
    html += `<div class="cancelled">${ICON.info}<span>Cancelled. Your question is still here.</span></div>`;
  }
  const t = S.thread;
  if (!t) {
    const p = phase(S.data);
    if (p !== "ok") return html + waitHtml(p);
    if (S.data.state === "playing") {
      html += `<div class="hint">${ICON.info}<span>Pause to anchor your question to this moment. You can still ask while it plays.</span></div>`;
    }
    if (S.data.source === "none") return html + fixHtml();
    return html + greetingHtml(S.changed ? "New video. Pause where you got lost, then ask."
      : "Pause where you got lost, then ask. I'll read the last 90 seconds around this moment.");
  }
  html += bubbleHtml(t);
  if (t.status === "asking") html += askingHtml(t);
  else if (t.status === "answer") html += answerHtml(t);
  else if (t.status === "error") html += errorHtml(t);
  return html;
}

function renderAsk() {
  const view = $("view-ask");
  view.hidden = S.view !== "ask";
  if (view.hidden) return;
  const html = askViewHtml();
  if (html === lastAskHtml) return;
  lastAskHtml = html;
  view.innerHTML = html;
  const manual = $("manual-text");
  if (manual) manual.value = S.manual;
}

/* ---------------- rendering: Map view ---------------- */

function mapViewHtml() {
  const entry = maps.get(S.tab?.videoId);
  if (!S.tab) return "";
  if (!entry || entry.status === "idle") {
    return `<section class="card fix"><div class="fix-h"><span class="ic acc">${ICON.part.replace('style="width:12px;height:12px"', "")}</span>
        <div><b>Map this video</b><p>I read the whole transcript once, then split it into parts you can jump between. About 20 seconds.</p></div></div>
        <div><button type="button" class="btn pri" data-act="build-map">Build the map</button></div></section>`;
  }
  if (entry.status === "reading" || entry.status === "building") {
    const mins = entry.duration ? ` (${Math.round(entry.duration / 60)} min)` : "";
    const reading = entry.status === "reading";
    return `<section class="card wait" aria-live="polite">
        <div class="wait-h">${ICON.ring}<span>Mapping this video…</span></div>
        <p class="soft" style="font-size:13.5px;line-height:1.5;color:var(--text2)">I read the whole transcript once, then split it into parts you can jump between.</p>
        <ol class="steps">
          <li class="${reading ? "now" : "done"}"><span class="sd">${reading ? "" : ICON.check}</span>Read the transcript${mins}</li>
          <li class="${reading ? "" : "now"}"><span class="sd"></span>Finding the topics…</li>
          <li><span class="sd"></span>Drawing the map</li>
        </ol>
        <div class="dg" style="padding:14px 16px" aria-hidden="true">
          <div class="skc"><i class="sk-l" style="width:46%"></i></div><i class="sk-e"></i>
          <div class="skc"><i class="sk-l" style="width:62%"></i></div><i class="sk-e"></i>
          <div class="skc ghost"><i class="sk-l" style="width:58%"></i></div>
        </div>
        <div class="wait-f"><span id="map-time">About 20 s · once per video</span><button type="button" class="btn" data-act="cancel-map">Cancel <span class="kbd">Esc</span></button></div>
      </section>`;
  }
  if (entry.status === "empty") {
    return `<section class="card fix">
        <div class="fix-h"><span class="ic warn">${ICON.cc.replace('<svg class="i"', '<svg class="i" aria-hidden="true"')}</span>
          <div><b>I need the transcript to draw the map.</b><p>Open the transcript, then I'll map the whole video in about 20 seconds.</p></div></div>
        <div class="fxs">
          <button type="button" id="transcript" class="fx" data-act="map-transcript"><span class="fi">${ICON.doc}</span><span class="fx-t"><b>Open transcript</b><small>Shows the full text beside the video</small></span>${ICON.chevRight}</button>
        </div>
        <p class="soft">Some videos have no transcript. Asking questions still works without it.</p>
      </section>`;
  }
  if (entry.status === "error") return errorHtml({ error: entry.error, showDetails: entry.showDetails }, "retry-map");
  const parts = entry.map.parts;
  const now = S.data?.seconds;
  const top = parts.filter((p) => !p.parent);
  const svg = window.YSMap.svg(parts, {
    now, selected: S.selected, understood: understood.get(S.tab.videoId), asked: askedCounts(),
    label: `Map of the video in ${top.length} parts: ${top.map((p) => p.title).join(", ")}.`
  });
  const minutes = Math.round((entry.duration || parts.at(-1).end) / 60);
  const height = S.selected ? 200 : 420;
  let html = `<section class="card mp" aria-label="Video map">
      <div class="mp-h">
        <div><div class="lab">Video map</div><div class="mp-s">${top.length} parts · ${minutes} min</div></div>
        <div class="mp-t">
          <button type="button" class="fol" data-act="follow" aria-pressed="${S.following}"><i class="dot"></i>Following</button>
          <button type="button" class="ib" data-act="fit" aria-pressed="${S.fit}" aria-label="Fit map to panel">${ICON.fit}</button>
          <button type="button" class="ib" data-act="full-map" aria-label="Open full map in a tab">${ICON.expand}</button>
        </div>
      </div>
      <div class="dg mp-c ${S.fit ? "fit" : ""}" id="map-canvas" style="max-height:${height}px">${svg}</div>
      ${S.selected ? "" : '<div class="mp-l"><span><i class="lg" style="background:var(--accent)"></i>Now playing</span><span><i class="lg" style="background:var(--ok)"></i>Watched</span><span><i class="lg" style="border:1.5px solid rgba(var(--ink),.4)"></i>Coming up</span></div>'}
    </section>`;
  const sel = S.selected && parts.find((p) => p.id === S.selected);
  if (sel) html += sheetHtml(entry, sel);
  return html;
}

function sheetHtml(entry, part) {
  const parts = entry.map.parts;
  const info = window.YSMap.decorate(parts).get(part.id);
  const now = S.data?.seconds;
  const und = understood.get(S.tab.videoId)?.has(part.id);
  const current = window.YSMap.partAt(parts, now);
  const status = current && (current.id === part.id || current.parent === part.id) ? ["accent", "Now playing"]
    : und ? ["ok", "Understood"] : Number.isFinite(now) && part.end <= now ? ["neutral", "Watched"] : ["neutral", "Coming up"];
  const lines = (entry.cues || []).filter((c) => c.seconds >= part.start && c.seconds < part.end);
  const order = parts;
  const i = order.findIndex((p) => p.id === part.id);
  const before = order[i - 1];
  const next = order[i + 1];
  return `<section class="card nsheet" aria-label="Part details">
      <div class="nh" style="--k:var(${info.color})">
        <span class="nh-i">${esc(info.num)}</span>
        <div style="flex:1;min-width:0"><b dir="auto">${esc(part.title)}</b><small><span class="mono">${ts(part.start)} – ${ts(part.end)}</span> · ${spanText(part.end - part.start)}</small></div>
        <span class="badge ${status[0]}"><i class="dot"></i>${status[1]}</span>
      </div>
      ${part.summary ? `<p class="ns-p" dir="auto">${esc(part.summary)}</p>` : ""}
      ${part.terms.length ? `<div class="terms">${part.terms.map((t) => `<span class="term-c" dir="auto">${esc(t)}</span>`).join("")}</div>` : ""}
      ${lines.length ? `<button type="button" class="rd" data-act="read" aria-expanded="${S.readOpen}">${ICON.lines}<span>Read what was said <small>· ${lines.length} lines</small></span>${ICON.chevRight}</button>` : ""}
      ${S.readOpen && lines.length ? `<ul class="rd-l">${lines.map((c) => `<li><b>${ts(c.seconds)}</b><span dir="auto">${esc(c.text)}</span></li>`).join("")}</ul>` : ""}
      <div class="nav2">
        <button type="button" class="nv" data-act="select" data-id="${esc(before?.id || "")}" ${before ? "" : "disabled"}><small>Before</small><b>${esc(before?.title || "Start of video")}</b></button>
        <button type="button" class="nv" data-act="select" data-id="${esc(next?.id || "")}" ${next ? "" : "disabled"}><small>Next</small><b>${esc(next?.title || "End of video")}</b></button>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="btn pri" data-act="ask-part">${ICON.ask}Ask about this part</button>
        <button type="button" class="btn" data-act="seek" data-t="${part.start}">${ICON.play}Jump to <span class="mono">${ts(part.start)}</span></button>
        <button type="button" class="btn ghost" data-act="understood" aria-pressed="${Boolean(und)}">${ICON.check}${und ? "Understood" : "Mark understood"}</button>
      </div>
    </section>`;
}

function renderMap() {
  const view = $("view-map");
  view.hidden = S.view !== "map";
  if (view.hidden) return;
  const html = mapViewHtml();
  if (html !== lastMapHtml) {
    const canvas = $("map-canvas");
    const keepScroll = canvas ? canvas.scrollTop : 0;
    const focusedId = document.activeElement?.closest?.(".nd")?.dataset.id;
    lastMapHtml = html;
    view.innerHTML = html;
    const fresh = $("map-canvas");
    if (fresh) fresh.scrollTop = keepScroll;
    if (focusedId) view.querySelector(`.nd[data-id="${CSS.escape(focusedId)}"]`)?.focus({ preventScroll: true });
  }
  followPlayhead();
}

function followPlayhead() {
  const entry = currentMap();
  const canvas = $("map-canvas");
  if (!entry || !canvas || S.fit) return;
  const target = S.selected || (S.following ? window.YSMap.partAt(entry.map.parts, S.data?.seconds)?.id : null);
  if (!target || target === lastFollowId) return;
  const box = window.YSMap.nodeBox(entry.map.parts, target);
  if (!box) return;
  lastFollowId = target;
  const scale = canvas.clientWidth / window.YSMap.WIDTH;
  canvas.scrollTo({ top: Math.max(0, (box.y + box.h / 2) * scale - canvas.clientHeight / 2), behavior: "smooth" });
}

/* ---------------- rendering: History view ---------------- */

function renderHistory() {
  const view = $("view-history");
  view.hidden = S.view !== "history";
  if (view.hidden) return;
  const list = qHistory.get(S.tab?.videoId) || [];
  const title = S.data?.title || S.thread?.title || "";
  let html = `<div style="flex:none;display:flex;align-items:center;gap:6px">
      <button type="button" class="ib" data-act="back" aria-label="Back to chat">${ICON.back}</button>
      <div style="flex:1;min-width:0"><div style="font-size:15px;font-weight:600">This video</div><div class="soft" dir="auto">${list.length} question${list.length === 1 ? "" : "s"}${title ? ` · ${esc(title)}` : ""}</div></div>
    </div>`;
  if (!list.length) html += `<div class="hint">${ICON.info}<span>Questions you ask about this video show up here, so you can read an answer again.</span></div>`;
  list.forEach((t, i) => {
    const st = t.reply.structured;
    const first = st ? st.lead || st.paragraphs[0] : t.reply.answer.split(/\n/)[0];
    const at = t.part ? `${ts(t.part.start)}` : ts(t.seconds);
    html += `<button type="button" class="card hist ${t === S.thread ? "sel" : ""}" data-act="open-history" data-i="${i}">
        <div class="hist-t"><span class="pill"><span class="mono">${at}</span></span><b dir="auto">${esc(t.question)}</b>${st?.example?.diagram ? '<span class="pill">Diagram</span>' : ""}</div>
        <p dir="auto">${esc((first || "").replace(/\*\*|`/g, ""))}</p></button>`;
  });
  if (html !== lastHistHtml) {
    lastHistHtml = html;
    view.innerHTML = html;
  }
}

function renderAll() {
  lastFollowId = null;
  renderLive();
  renderHistory();
}

/* ---------------- overlay (expanded diagram) ---------------- */

function openOverlay() {
  const t = S.thread;
  const example = t?.reply?.structured?.example;
  if (!example?.diagram) return;
  const rtl = isRtl(t.reply.structured.lead);
  const el = document.createElement("div");
  el.className = "overlay";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "Example diagram");
  el.innerHTML = `<div class="card"><div class="ex-h"><span class="lab">Example</span><button type="button" class="ib" data-act="close-overlay" aria-label="Close diagram">${ICON.close}</button></div>
      <div class="dg">${diagramSvg(example.diagram, rtl)}</div>
      ${example.caption ? `<p class="ex-c ${rtl ? "rtl" : ""}" dir="auto">${fmtInline(example.caption)}</p>` : ""}</div>`;
  el.addEventListener("click", (event) => {
    if (event.target === el || event.target.closest("[data-act=close-overlay]")) closeOverlay();
  });
  document.body.append(el);
  S.overlay = el;
  el.querySelector("[data-act=close-overlay]").focus();
}

function closeOverlay() {
  S.overlay?.remove();
  S.overlay = null;
}

/* ---------------- events ---------------- */

async function seek(seconds) {
  if (!S.tab) return;
  const ok = await request(S.tab, { type: "study-seek", videoId: S.tab.videoId, seconds }).catch(() => false);
  if (!ok) toast("Couldn't move the video. Wait for the ad or loading to finish.");
}

async function copyText(text, done = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    toast(done);
  } catch {
    toast("Couldn't copy. Select the text and copy it instead.");
  }
}

function selectPart(id) {
  S.selected = id || null;
  S.readOpen = false;
  if (S.selected) S.following = false;
  S.view = "map";
  renderAll();
}

async function onAction(btn, event) {
  const act = btn.dataset.act;
  const t = S.thread;
  switch (act) {
    case "suggest": return ask(btn.textContent.trim(), { clear: false });
    case "how": S.showHow = !S.showHow; return renderAll();
    case "check": {
      await ping();
      if (S.helper === "ok" && S.claude) S.onboarding = false;
      return renderAll();
    }
    case "skip-setup":
      S.onboarding = false;
      storeSet("setupSkipped", true);
      return renderAll();
    case "copy-cmd": return copyText(SETUP_CMD, "Command copied");
    case "open-transcript": {
      const ok = S.tab && await request(S.tab, { type: "study-transcript", videoId: S.tab.videoId }).catch(() => false);
      if (!ok) toast("Expand the video description and choose Show transcript.");
      return;
    }
    case "cc": {
      const ok = S.tab && await request(S.tab, { type: "study-cc", videoId: S.tab.videoId }).catch(() => false);
      toast(ok ? "Captions on. Play a few seconds so I can read them." : "Press C in the player to turn on captions.");
      return;
    }
    case "paste":
      S.showPaste = !S.showPaste;
      renderAll();
      if (S.showPaste) $("manual-text")?.focus();
      return;
    case "cancel": return cancelAsk();
    case "jump":
      if (t && t.videoId === S.tab?.videoId) {
        event.preventDefault();
        return seek(Number(btn.dataset.t));
      }
      return;
    case "seek": return seek(Number(btn.dataset.t));
    case "more": t.showMore = !t.showMore; return renderAll();
    case "copy": return copyText(t.reply.answer);
    case "again": return ask(t.question, { part: t.part ? partById(t.part.id) || t.part : null, clear: false });
    case "expand": return openOverlay();
    case "details": t.showDetails = !t.showDetails; return renderAll();
    case "map-details": {
      const entry = maps.get(S.tab?.videoId);
      if (entry) entry.showDetails = !entry.showDetails;
      return renderAll();
    }
    case "retry": return ask(t.question, { part: t.part ? partById(t.part.id) || t.part : null, clear: false });
    case "retry-helper":
      await ping();
      if (S.helper !== "ok") {
        toast("Still can't reach the helper. Run the command, then try again.");
        return;
      }
      S.thread = null;
      return ask(t.question, { part: t.part ? partById(t.part.id) || t.part : null, clear: false });
    case "edit":
      $("question").value = t.question;
      threads.delete(t.videoId);
      S.thread = null;
      updateCount();
      renderAll();
      $("question").focus();
      return;
    case "undo":
      if (S.changed) {
        S.thread = S.changed.thread;
        S.changed = null;
        renderAll();
      }
      return;
    case "show-on-map": selectPart(t.part.id); return;
    case "next-part": {
      const part = partById(btn.dataset.id);
      if (!part) return;
      S.scope = part;
      return ask("What is this part about? Explain it simply.", { part, clear: false });
    }
    case "whole-video":
      S.scope = null;
      renderAll();
      $("question").focus();
      return;
    case "build-map": return ensureMap(true);
    case "cancel-map": return cancelMap();
    case "map-transcript": {
      if (S.tab) await request(S.tab, { type: "study-transcript", videoId: S.tab.videoId }).catch(() => false);
      return ensureMap(true);
    }
    case "retry-map": return ensureMap(true);
    case "retry-map-helper":
      await ping();
      if (S.helper !== "ok") {
        toast("Still can't reach the helper. Run the command, then try again.");
        return;
      }
      return ensureMap(true);
    case "follow":
      S.following = !S.following;
      if (S.following) S.selected = null;
      return renderAll();
    case "fit": S.fit = !S.fit; return renderAll();
    case "full-map": return openFullMap();
    case "select": return selectPart(btn.dataset.id);
    case "read": S.readOpen = !S.readOpen; return renderAll();
    case "ask-part": {
      S.scope = partById(S.selected);
      renderAll();
      $("question").focus();
      return;
    }
    case "understood": return toggleUnderstood(S.selected);
    case "back": S.view = "ask"; return renderAll();
    case "open-history": {
      const item = (qHistory.get(S.tab?.videoId) || [])[Number(btn.dataset.i)];
      if (item) {
        S.thread = item;
        threads.set(item.videoId, item);
        S.view = "ask";
        renderAll();
      }
      return;
    }
  }
}

document.body.addEventListener("click", (event) => {
  const node = event.target.closest(".nd[data-id]");
  if (node) {
    selectPart(S.selected === node.dataset.id ? null : node.dataset.id);
    return;
  }
  const btn = event.target.closest("[data-act]");
  if (btn && !btn.disabled && !btn.closest(".overlay")) void onAction(btn, event);
});

document.body.addEventListener("input", (event) => {
  if (event.target.id === "manual-text") {
    S.manual = event.target.value;
    const count = $("manual-count");
    if (count) {
      count.textContent = `${S.manual.length.toLocaleString()} / 4,000`;
      count.classList.toggle("at-limit", S.manual.length >= QUOTE_LIMIT);
    }
    renderLive();
  }
});

// Scrolling the map by hand pauses Following.
document.body.addEventListener("wheel", (event) => {
  if (event.target.closest("#map-canvas") && S.following) {
    S.following = false;
    renderAll();
  }
}, { passive: true });
document.body.addEventListener("touchmove", (event) => {
  if (event.target.closest("#map-canvas") && S.following) {
    S.following = false;
    renderAll();
  }
}, { passive: true });

document.body.addEventListener("keydown", (event) => {
  const node = event.target.closest?.(".nd[data-id]");
  if (node) {
    const all = [...document.querySelectorAll("#map-canvas .nd[data-id]")];
    const i = all.indexOf(node);
    if (["ArrowDown", "ArrowRight"].includes(event.key)) { all[i + 1]?.focus(); event.preventDefault(); }
    if (["ArrowUp", "ArrowLeft"].includes(event.key)) { all[i - 1]?.focus(); event.preventDefault(); }
    if (event.key === "Enter" || event.key === " ") { selectPart(node.dataset.id); event.preventDefault(); }
  }
  if (event.key === "Escape") {
    if (S.overlay) { closeOverlay(); return; }
    if (S.thread?.status === "asking") { cancelAsk(); return; }
    const entry = maps.get(S.tab?.videoId);
    if (S.view === "map" && entry && ["reading", "building"].includes(entry.status)) { cancelMap(); return; }
    if (S.view === "map" && S.selected) { selectPart(null); }
  }
});

function updateCount() {
  const length = $("question").value.length;
  const count = $("q-count");
  count.hidden = length < Q_LIMIT * 0.8;
  count.textContent = `${length.toLocaleString()} / 1,600`;
  count.classList.toggle("at-limit", length >= Q_LIMIT);
}

$("question").addEventListener("input", () => { updateCount(); renderLive(); });
$("question").addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    void ask();
  }
});
$("question").addEventListener("focus", () => $("composer").classList.add("focus"));
$("question").addEventListener("blur", () => $("composer").classList.remove("focus"));
$("composer").addEventListener("submit", (event) => {
  event.preventDefault();
  void ask();
});
$("chip-node-x").addEventListener("click", () => { S.scope = null; renderAll(); });
$("fmt-diagram").addEventListener("click", () => setFormat("diagram"));
$("fmt-text").addEventListener("click", () => setFormat("text"));
function setFormat(format) {
  S.format = format;
  $("fmt-diagram").classList.toggle("on", format === "diagram");
  $("fmt-diagram").setAttribute("aria-pressed", String(format === "diagram"));
  $("fmt-text").classList.toggle("on", format === "text");
  $("fmt-text").setAttribute("aria-pressed", String(format === "text"));
  storeSet("format", format);
}
$("caption-summary").addEventListener("click", () => { S.showCaps = !S.showCaps; lastCaps = ""; renderLive(); });
$("ctx-mini").addEventListener("click", () => {
  if (S.thread) return;
  S.view = "ask";
  S.showCaps = true;
  renderAll();
});
$("tab-ask").addEventListener("click", () => { S.view = "ask"; renderAll(); });
$("tab-map").addEventListener("click", () => {
  S.view = "map";
  renderAll();
  void ensureMap();
});
$("history-btn").addEventListener("click", () => {
  S.view = S.view === "history" ? "ask" : "history";
  renderAll();
});
$("privacy-btn").addEventListener("click", () => {
  S.privacy = !S.privacy;
  $("privacy").hidden = !S.privacy;
  $("privacy-btn").setAttribute("aria-pressed", String(S.privacy));
});

// The full-map tab asks the panel to show a part.
chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "study-select-part" && message.videoId === S.tab?.videoId) selectPart(message.id);
});

/* ---------------- start ---------------- */

(async () => {
  const saved = await chrome.storage.session.get("mapTabs").catch(() => ({}));
  for (const [mapTab, ytTab] of saved.mapTabs || []) mapTabs.set(mapTab, ytTab);
  const format = await storeGet("format");
  if (format === "text") setFormat("text");
  renderAll();
  await refresh();
  await ping();
  const skipped = await storeGet("setupSkipped");
  if (!skipped && (S.helper !== "ok" || S.claude === false)) S.onboarding = true;
  renderAll();
  setInterval(refresh, 800);
})();
