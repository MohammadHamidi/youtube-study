(() => {
  if (globalThis.youtubeStudyAttached) return;
  globalThis.youtubeStudyAttached = true;

  const WINDOW_SECONDS = 90;
  const player = () => document.querySelector("#movie_player");
  const video = () => player()?.querySelector("video.html5-main-video");
  const id = () => location.pathname === "/watch"
    ? new URLSearchParams(location.search).get("v") : null;
  const clean = (value) => (value ?? "").replace(/\s+/g, " ").trim();
  const isAd = () => player()?.classList.contains("ad-showing");
  const visible = (element) => element && element.getClientRects().length > 0
    && getComputedStyle(element).visibility === "visible";
  let videoId;
  let ready = true;
  let captions = [];
  let previousLine = "";

  function resetCaptions() {
    captions = [];
    previousLine = "";
  }

  function syncVideo() {
    const currentId = id();
    if (currentId !== videoId) {
      videoId = currentId;
      resetCaptions();
    }
  }

  function matchesWatchPage() {
    const renderedId = document.querySelector("ytd-watch-flexy[video-id]")?.getAttribute("video-id");
    return ready && videoId && (!renderedId || renderedId === videoId);
  }

  function sample() {
    syncVideo();
    const media = video();
    if (!matchesWatchPage() || !media || !Number.isFinite(media.currentTime) || isAd() || media.seeking) {
      previousLine = "";
      return;
    }
    const line = clean([...player().querySelectorAll(".ytp-caption-segment")]
      .filter(visible).map((node) => node.textContent).join(" "));
    const seconds = media.currentTime;
    captions = captions.filter((cue) => cue.seconds >= seconds - WINDOW_SECONDS);
    if (line && line !== previousLine) {
      captions.push({ seconds, text: line.slice(0, 400) });
      if (captions.length > 100) captions.shift();
    }
    previousLine = line;
  }

  function transcript() {
    const cues = [];
    for (const row of document.querySelectorAll("ytd-transcript-segment-renderer")) {
      if (!visible(row)) continue;
      const stamp = clean(row.querySelector(".segment-timestamp")?.textContent);
      const text = clean(row.querySelector(".segment-text")?.textContent);
      if (!/^\d+(?::\d{2}){1,2}$/.test(stamp) || !text) continue;
      const seconds = stamp.split(":").reduce((value, part) => value * 60 + Number(part), 0);
      cues.push({ seconds, text: text.slice(0, 400) });
    }
    return cues;
  }

  function context(includeCaptions) {
    sample();
    const media = video();
    if (!matchesWatchPage() || !media || media.readyState === 0 || !Number.isFinite(media.currentTime)) return null;
    const seconds = media.currentTime;
    const state = isAd() ? "ad" : media.seeking ? "seeking" : media.ended ? "ended"
      : media.paused ? "paused" : media.readyState < 3 ? "buffering" : "playing";
    let source = "none";
    let cues = [];
    if (includeCaptions && state !== "ad" && state !== "seeking") {
      const near = (cue) => cue.seconds >= Math.max(0, seconds - WINDOW_SECONDS) && cue.seconds <= seconds;
      cues = transcript().filter(near);
      if (cues.length) source = "transcript";
      else {
        cues = captions.filter(near);
        if (cues.length) source = "captions";
      }
    }
    return {
      videoId, seconds, state, source, cues: cues.slice(-30),
      title: clean(document.querySelector("ytd-watch-metadata h1")?.textContent
        || document.title.replace(/ - YouTube$/, "")).slice(0, 300),
      duration: Number.isFinite(media.duration) ? media.duration : null,
      rate: media.playbackRate
    };
  }

  document.addEventListener("yt-navigate-start", () => {
    ready = false;
    resetCaptions();
  });
  document.addEventListener("yt-navigate-finish", () => {
    syncVideo();
    ready = true;
  });
  document.addEventListener("seeking", (event) => {
    if (event.target === video()) resetCaptions();
  }, true);
  setInterval(sample, 300);

  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (sender.id !== chrome.runtime.id) return;
    if (message.type === "study-context") respond(context(message.includeCaptions));
    if (message.type === "study-transcript") {
      syncVideo();
      if (!matchesWatchPage() || message.videoId !== videoId || isAd()) {
        respond(false);
        return;
      }
      if (transcript().length) {
        respond(true);
        return;
      }
      const transcriptButton = document.querySelector("ytd-video-description-transcript-section-renderer button");
      transcriptButton?.click();
      respond(Boolean(transcriptButton));
    }
  });
})();
