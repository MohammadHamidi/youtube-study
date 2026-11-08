const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const vm = require("node:vm");

const script = readFileSync(require.resolve("../extension/player.js"), "utf8");

test("captures player state and bounds context to the current video and playback position", () => {
  const events = new Map();
  const media = { currentTime: 100, readyState: 4, duration: 260, paused: false, playbackRate: 1.25 };
  const location = { pathname: "/watch", search: "?v=first" };
  let ad = false;
  let listener;
  let rows = [];
  let line = "Previous thought";
  const node = (textContent) => ({ textContent, getClientRects: () => [1] });
  const player = {
    classList: { contains: () => ad },
    querySelector: () => media,
    querySelectorAll: () => line ? [node(line)] : [],
  };
  const document = {
    title: "Lesson - YouTube",
    querySelector: (selector) => selector === "#movie_player" ? player : null,
    querySelectorAll: () => rows,
    addEventListener: (type, listener) => events.set(type, listener),
  };
  vm.runInNewContext(script, {
    chrome: { runtime: { id: "ext", onMessage: { addListener: (fn) => { listener = fn; } } } },
    document, location, URLSearchParams, setInterval: () => {},
    getComputedStyle: () => ({ visibility: "visible" }),
  });
  function context() {
    let result;
    listener({ type: "study-context", includeCaptions: true }, { id: "ext" }, (data) => {
      result = JSON.parse(JSON.stringify(data));
    });
    return result;
  }
  assert.equal(context().state, "playing");
  assert.equal(context().rate, 1.25);
  assert.equal(context().source, "captions");

  media.currentTime = 103;
  media.paused = true;
  line = "Context windows";
  assert.equal(context().state, "paused");
  assert.deepEqual(context().cues.map((cue) => cue.text), ["Previous thought", "Context windows"]);

  rows = [["0:02", "Too early"], ["1:41", "Transcript line"], ["1:46", "Future"]]
    .map(([stamp, text]) => ({
      ...node(""),
      querySelector: (selector) => node(selector === ".segment-timestamp" ? stamp : text),
    }));
  assert.equal(context().source, "transcript");
  assert.deepEqual(context().cues, [{ seconds: 101, text: "Transcript line" }]);

  ad = true;
  assert.equal(context().state, "ad");
  assert.deepEqual(context().cues, []);
  ad = false;
  rows = [];
  line = "";
  events.get("seeking")({ target: media });
  assert.deepEqual(context().cues, []);

  line = "First video";
  context();
  events.get("yt-navigate-start")();
  assert.equal(context(), null);
  location.search = "?v=second";
  line = "Second video";
  events.get("yt-navigate-finish")();
  assert.equal(context().videoId, "second");
  assert.deepEqual(context().cues.map((cue) => cue.text), ["Second video"]);
});
