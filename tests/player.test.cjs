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

test("returns the whole transcript, moves the playhead and turns on captions", () => {
  const media = { currentTime: 40, readyState: 4, duration: 600, paused: true, playbackRate: 1 };
  let listener;
  let pressed = "false";
  let clicks = 0;
  const node = (textContent) => ({ textContent, getClientRects: () => [1] });
  const ccButton = { getAttribute: () => pressed, click: () => { clicks++; pressed = "true"; } };
  const player = {
    classList: { contains: () => false },
    querySelector: (selector) => selector === ".ytp-subtitles-button" ? ccButton : media,
    querySelectorAll: () => [],
  };
  const rows = [["0:05", "Hello"], ["1:10", "Tokens"], ["9:59", "Bye"]].map(([stamp, text]) => ({
    ...node(""),
    querySelector: (selector) => node(selector === ".segment-timestamp" ? stamp : text),
  }));
  const document = {
    title: "Lesson - YouTube",
    querySelector: (selector) => selector === "#movie_player" ? player : null,
    querySelectorAll: () => rows,
    addEventListener: () => {},
  };
  vm.runInNewContext(script, {
    chrome: { runtime: { id: "ext", onMessage: { addListener: (fn) => { listener = fn; } } } },
    document, location: { pathname: "/watch", search: "?v=vid" }, URLSearchParams, setInterval: () => {},
    getComputedStyle: () => ({ visibility: "visible" }),
  });
  const send = (message) => {
    let result;
    listener(message, { id: "ext" }, (data) => { result = JSON.parse(JSON.stringify(data)); });
    return result;
  };
  const full = send({ type: "study-full-transcript", videoId: "vid" });
  assert.equal(full.title, "Lesson");
  assert.equal(full.duration, 600);
  assert.deepEqual(full.cues.map((cue) => cue.seconds), [5, 70, 599]);
  assert.equal(send({ type: "study-full-transcript", videoId: "other" }), null);

  assert.equal(send({ type: "study-seek", videoId: "vid", seconds: 130 }), true);
  assert.equal(media.currentTime, 130);
  assert.equal(send({ type: "study-seek", videoId: "other", seconds: 5 }), false);
  assert.equal(media.currentTime, 130);

  assert.equal(send({ type: "study-cc", videoId: "vid" }), true);
  assert.equal(send({ type: "study-cc", videoId: "vid" }), true);
  assert.equal(clicks, 1);
});
