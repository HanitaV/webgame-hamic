/* Offline copy for the event demo machine (GDD: "bản chạy ngoại tuyến"). Same-origin GETs only:
   network first, cache as fallback, so edited JSON content shows up as soon as the machine is online. */
const CACHE = "dem-toan-tin-v2.8.1-hamic";
// Tải trước nội dung để máy trình diễn chạy được khi mất mạng ngay từ lần mở thứ hai.
const PRECACHE = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg",
  "./assets/hamic-logo.png", "./assets/hamic-mark.png", "./models/campus.glb",
  "./models/show-drone.glb", "./data/music.json",
  "./audio/bgm/WereWasI_0.ogg", "./audio/bgm/Exploration Theme/Exploration Theme.ogg", "./audio/bgm/chilllofir-loop.ogg", "./audio/bgm/Relaxing.mp3", "./audio/bgm/Heavenly Loop.ogg",
  "./data/config.json", "./data/story.json", "./data/map.json", "./data/i18n/vi.json", "./data/levels/circuits.json",
  "./data/levels_generated.json", "./data/achievements.json", "./data/facts.json", "./data/facts_generated.json",
  "./data/casual_glossary.json", "./data/qa_report.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  // Media uses byte ranges. Never cache partial films or return the HTML fallback for video.
  // Offline playback uses the live Three.js scene, so large films need no bulk precache.
  if (req.headers.has("range") || new URL(req.url).pathname.endsWith(".mp4")) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        if (res.status === 200) e.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}));
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html"))),
  );
});
