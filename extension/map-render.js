// Shared drawing for the video map (side panel and full-tab map).
// Parts come from the bridge: { id, title, start, end, summary, terms, parent }.
(() => {
  const LEFT = { x: 12, w: 150 };
  const RIGHT = { x: 190, w: 130 };
  const H = 52;
  const PITCH = 76;
  const TOP = 14;
  const WIDTH = 332;
  const PALETTE = ["--k2", "--k4", "--n1", "--k3"];

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function ts(value) {
    const seconds = Math.max(0, Math.floor(value || 0));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds / 60) % 60;
    const s = String(seconds % 60).padStart(2, "0");
    return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
  }

  function span(seconds) {
    const total = Math.max(0, Math.round(seconds));
    const m = Math.floor(total / 60);
    const s = total % 60;
    if (!m) return `${s} s`;
    return s ? `${m} min ${s} s` : `${m} min`;
  }

  function clip(text, max) {
    return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
  }

  // Number each part ("3", "5a") and give it a colour; children share the parent's colour.
  function decorate(parts) {
    const top = parts.filter((p) => !p.parent);
    const info = new Map();
    top.forEach((part, i) => {
      info.set(part.id, { num: String(i + 1), color: PALETTE[i % PALETTE.length], index: i });
      parts.filter((child) => child.parent === part.id).forEach((child, j) => {
        info.set(child.id, { num: `${i + 1}${String.fromCharCode(97 + j)}`, color: PALETTE[i % PALETTE.length], index: i });
      });
    });
    return info;
  }

  function layout(parts) {
    const branched = parts.some((p) => p.parent);
    const left = branched ? LEFT : { x: LEFT.x, w: WIDTH - 2 * LEFT.x };
    const nodes = [];
    const edges = [];
    let row = 0;
    let previousTop = null;
    for (const part of parts.filter((p) => !p.parent)) {
      const y = TOP + row * PITCH;
      const node = { part, x: left.x, y, w: left.w, h: H };
      nodes.push(node);
      if (previousTop) edges.push({ kind: "main", from: previousTop, to: node });
      const children = parts.filter((child) => child.parent === part.id);
      children.forEach((child, j) => {
        const cy = TOP + (row + j) * PITCH;
        const childNode = { part: child, x: RIGHT.x, y: cy, w: RIGHT.w, h: H };
        nodes.push(childNode);
        edges.push({ kind: "branch", from: node, to: childNode });
      });
      row += Math.max(1, children.length);
      previousTop = node;
    }
    return { nodes, edges, width: WIDTH, height: TOP + (row - 1) * PITCH + H + 22 };
  }

  // The part playing now: the deepest part whose range holds the playhead.
  function partAt(parts, seconds) {
    if (!Number.isFinite(seconds)) return null;
    const holding = parts.filter((p) => seconds >= p.start && seconds < p.end);
    return holding.find((p) => p.parent) || holding[0] || null;
  }

  function stateOf(part, now, current) {
    if (current && (part.id === current.id || part.id === current.parent)) return "cur";
    return Number.isFinite(now) && part.end <= now ? "done" : "todo";
  }

  function edgePath(edge) {
    const { from, to } = edge;
    if (edge.kind === "main") {
      const x = from.x + from.w / 2;
      const y1 = from.y + from.h;
      const y2 = to.y - 2;
      return { d: `M${x} ${y1}V${y2}`, head: `M${x - 4} ${y2 - 4.5}L${x} ${y2 + 0.5}L${x + 4} ${y2 - 4.5}` };
    }
    const fy = from.y + from.h / 2;
    const ty = to.y + to.h / 2;
    const x1 = from.x + from.w;
    const x2 = to.x - 2;
    const d = fy === ty ? `M${x1} ${fy}H${x2}` : `M${x1} ${fy}H${x1 + 14}V${ty}H${x2}`;
    return { d, head: `M${x2 - 4.5} ${ty - 4}L${x2 + 0.5} ${ty}L${x2 - 4.5} ${ty + 4}` };
  }

  // opts: { now, selected, understood: Set, asked: Map(id -> count), label }
  function svg(parts, opts = {}) {
    const { nodes, edges, width, height } = layout(parts);
    const info = decorate(parts);
    const now = opts.now;
    const current = partAt(parts, now);
    const understood = opts.understood || new Set();
    const asked = opts.asked || new Map();
    let out = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="group" aria-label="${esc(opts.label || "Map of the video")}">`;
    for (const edge of edges) {
      const { d, head } = edgePath(edge);
      const done = Number.isFinite(now) && edge.to.part.start <= now;
      out += `<path class="${done ? "e-done" : "e-todo"}" d="${d}"></path><path class="hd-m" d="${head}"></path>`;
    }
    for (const node of nodes) {
      const { part, x, y, w, h } = node;
      const meta = info.get(part.id);
      const state = stateOf(part, now, current);
      const isCur = current && part.id === current.id;
      const und = understood.has(part.id);
      const sel = opts.selected === part.id;
      const count = asked.get(part.id) || 0;
      const chars = Math.floor((w - 50) / 7.2);
      const stateWord = isCur ? "playing now" : state === "done" ? "watched" : "coming up";
      const label = `${meta.num}. ${part.title}, ${ts(part.start)} to ${ts(part.end)}, ${stateWord}${und ? ", understood" : ""}${count ? `, ${count} asked` : ""}`;
      const color = isCur ? "--accent" : (state === "done" || und) ? "--k3" : meta.color;
      out += `<g class="nd ${isCur ? "cur" : ""} ${state === "done" ? "done" : ""} ${sel ? "sel" : ""} ${und ? "und" : ""}" data-id="${esc(part.id)}" tabindex="0" role="button" aria-label="${esc(label)}" aria-pressed="${sel}">`;
      out += `<title>${esc(part.title)}</title>`;
      if (sel) out += `<rect class="nd-selh" x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="17"></rect>`;
      if (isCur) out += `<rect class="nd-halo" x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="17"></rect>`;
      out += `<rect class="nd-bg" x="${x}" y="${y}" width="${w}" height="${h}" rx="14"></rect>`;
      out += `<rect x="${x + 8}" y="${y + 14}" width="24" height="24" rx="8" style="fill:color-mix(in srgb,var(${color}) 18%,transparent)"></rect>`;
      if ((state === "done" || und) && !isCur) {
        out += `<path d="M${x + 15.5} ${y + 26.5}l3.2 3.2 5.8-6.4" style="fill:none;stroke:var(--k3);stroke-width:2;stroke-linecap:round;stroke-linejoin:round"></path>`;
      } else {
        out += `<text class="nd-n" x="${x + 20}" y="${y + 30}" style="fill:var(${isCur ? "--accent-ink" : color})">${esc(meta.num)}</text>`;
      }
      out += `<text class="nd-t" x="${x + 40}" y="${y + 23}">${esc(clip(part.title, chars))}</text>`;
      out += `<text class="nd-m" x="${x + 40}" y="${y + 39}">${ts(part.start)}–${ts(part.end)}${count ? ` · ${count} asked` : ""}</text>`;
      if (isCur) {
        const frac = Math.min(1, Math.max(0, (now - part.start) / Math.max(1, part.end - part.start)));
        out += `<rect x="${x + 40}" y="${y + 45}" width="${w - 50}" height="3" rx="1.5" style="fill:rgba(var(--ink),.12)"></rect>`;
        out += `<rect class="np-fill" x="${x + 40}" y="${y + 45}" width="${Math.max(3, (w - 50) * frac).toFixed(1)}" height="3" rx="1.5" style="fill:var(--accent)" data-w="${w - 50}"></rect>`;
        out += `<rect class="nd-pill" x="${x + w - 56}" y="${y - 8}" width="50" height="17" rx="8.5"></rect><text class="nd-pt" x="${x + w - 31}" y="${y + 4}">Now</text>`;
      }
      out += "</g>";
    }
    return `${out}</svg>`;
  }

  function nodeBox(parts, id) {
    return layout(parts).nodes.find((n) => n.part.id === id) || null;
  }

  window.YSMap = { svg, layout, partAt, decorate, nodeBox, ts, span, esc, WIDTH };
})();
