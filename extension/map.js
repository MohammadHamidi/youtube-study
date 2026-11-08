"use strict";
// Full-size video map, opened from the side panel. Reads the cached map and follows the video's playhead.
const $ = (id) => document.getElementById(id);
const { esc, ts, span: spanText } = window.YSMap;
const params = new URLSearchParams(location.search);
const videoId = params.get("v");
const ytTab = Number(params.get("tab"));
const COLORS = ["--k2", "--k4", "--n1", "--k3"];
let entry = null;
let now = null;
let selected = null;
let following = true;
let zoom = 1.6;
let lastSvg = "";
let lastFollow = null;
let understood = new Set();

async function load() {
  const key = `map:${videoId}`;
  const got = await chrome.storage.local.get([key, `und:${videoId}`]);
  entry = got[key];
  understood = new Set(got[`und:${videoId}`] || []);
  if (!entry?.map?.parts) {
    $("canvas").innerHTML = '<p class="empty-fm">This map isn\'t saved yet. Build it from the Map tab in the side panel, then open it here again.</p>';
    return;
  }
  const top = entry.map.parts.filter((p) => !p.parent);
  const duration = entry.duration || entry.map.parts.at(-1).end;
  $("sub").textContent = `${entry.title || "This video"} · ${top.length} parts · ${Math.round(duration / 60)} min`;
  document.title = `${entry.title || "Video"} · Video map`;
  $("tl-end").textContent = ts(duration);
  $("timeline").innerHTML = top.map((p, i) => `<button type="button" data-id="${esc(p.id)}" title="${esc(p.title)} · ${ts(p.start)}–${ts(p.end)}" aria-label="${esc(p.title)}, ${ts(p.start)} to ${ts(p.end)}" style="flex:${Math.max(1, p.end - p.start)};background:color-mix(in srgb,var(${COLORS[i % COLORS.length]}) 55%,transparent)"></button>`).join("")
    + '<i class="ph" id="playhead" hidden></i>';
  render();
}

function render() {
  if (!entry) return;
  const parts = entry.map.parts;
  const svg = window.YSMap.svg(parts, { now, selected, understood, label: `Map of ${entry.title || "the video"}` });
  if (svg !== lastSvg) {
    lastSvg = svg;
    $("canvas").innerHTML = svg;
  }
  const el = $("canvas").querySelector("svg");
  el.style.width = `${window.YSMap.WIDTH * zoom}px`;
  el.style.height = "auto";
  const duration = entry.duration || parts.at(-1).end;
  const ph = $("playhead");
  ph.hidden = !Number.isFinite(now);
  if (Number.isFinite(now)) ph.style.left = `calc(${Math.min(100, (now / duration) * 100)}% - 1.5px)`;
  $("tl-now").textContent = Number.isFinite(now) ? `${ts(now)} now` : "";
  $("timeline").querySelectorAll("button").forEach((b) => b.classList.toggle("sel", b.dataset.id === selected));
  $("follow").setAttribute("aria-pressed", String(following));
  renderSide();
  follow();
}

function renderSide() {
  const part = selected && entry.map.parts.find((p) => p.id === selected);
  if (!part) {
    $("side").innerHTML = '<div class="hint"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 11v5M12 8h.01"></path></svg><span>Click a part to read about it, jump to it, or ask about it in the side panel.</span></div>';
    return;
  }
  const info = window.YSMap.decorate(entry.map.parts).get(part.id);
  const html = `<section class="card nsheet">
      <div class="nh" style="--k:var(${info.color})"><span class="nh-i">${esc(info.num)}</span>
        <div style="flex:1;min-width:0"><b dir="auto">${esc(part.title)}</b><small><span class="mono">${ts(part.start)} – ${ts(part.end)}</span> · ${spanText(part.end - part.start)}</small></div></div>
      ${part.summary ? `<p class="ns-p" dir="auto">${esc(part.summary)}</p>` : ""}
      ${part.terms.length ? `<div class="terms">${part.terms.map((t) => `<span class="term-c" dir="auto">${esc(t)}</span>`).join("")}</div>` : ""}
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="btn pri" data-act="panel">Ask in side panel</button>
        <button type="button" class="btn" data-act="seek" data-t="${part.start}">Jump to <span class="mono">${ts(part.start)}</span></button>
      </div>
    </section>`;
  if ($("side").dataset.html !== html) {
    $("side").innerHTML = html;
    $("side").dataset.html = html;
  }
}

function follow() {
  const target = selected || (following ? window.YSMap.partAt(entry.map.parts, now)?.id : null);
  if (!target || target === lastFollow) return;
  lastFollow = target;
  const box = window.YSMap.nodeBox(entry.map.parts, target);
  const canvas = $("canvas");
  if (box) canvas.scrollTo({ top: Math.max(0, (box.y + box.h / 2) * zoom + 24 - canvas.clientHeight / 2), behavior: "smooth" });
}

function select(id) {
  selected = id === selected ? null : id;
  if (selected) following = false;
  lastFollow = null;
  render();
}

async function poll() {
  try {
    const data = await chrome.tabs.sendMessage(ytTab, { type: "study-context", includeCaptions: false });
    now = data?.videoId === videoId ? data.seconds : null;
  } catch {
    now = null;
  }
  render();
}

document.addEventListener("click", async (event) => {
  const node = event.target.closest(".nd[data-id], .tl button[data-id]");
  if (node) {
    select(node.dataset.id);
    return;
  }
  const btn = event.target.closest("[data-act]");
  if (!btn) return;
  if (btn.dataset.act === "seek") {
    await chrome.tabs.sendMessage(ytTab, { type: "study-seek", videoId, seconds: Number(btn.dataset.t) }).catch(() => {});
  }
  if (btn.dataset.act === "panel") {
    await chrome.runtime.sendMessage({ type: "study-select-part", videoId, id: selected }).catch(() => {});
  }
});
document.addEventListener("keydown", (event) => {
  const node = event.target.closest?.(".nd[data-id]");
  if (node && (event.key === "Enter" || event.key === " ")) {
    select(node.dataset.id);
    event.preventDefault();
  }
  if (event.key === "Escape" && selected) select(selected);
});
$("canvas").addEventListener("wheel", () => { following = false; render(); }, { passive: true });
$("follow").addEventListener("click", () => {
  following = !following;
  if (following) selected = null;
  lastFollow = null;
  render();
});
$("fit").addEventListener("click", () => {
  const canvas = $("canvas");
  const { height } = window.YSMap.layout(entry.map.parts);
  zoom = Math.max(0.6, Math.min(3, (canvas.clientHeight - 48) / height));
  render();
});
$("zoom-in").addEventListener("click", () => { zoom = Math.min(3, zoom + 0.2); render(); });
$("zoom-out").addEventListener("click", () => { zoom = Math.max(0.6, zoom - 0.2); render(); });
chrome.storage.onChanged.addListener((changes) => {
  if (changes[`und:${videoId}`]) {
    understood = new Set(changes[`und:${videoId}`].newValue || []);
    render();
  }
});

void load().then(() => {
  void poll();
  setInterval(poll, 1000);
});
