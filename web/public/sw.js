/* Offline copy for the event demo machine (GDD: "bản chạy ngoại tuyến"). Same-origin GETs only:
   network first, cache as fallback, so edited JSON content shows up as soon as the machine is online. */
const CACHE = "hoitu70-v2.8.0";
// Tải trước nội dung để máy trình diễn chạy được khi mất mạng ngay từ lần mở thứ hai.
const PRECACHE = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./models/campus.glb",
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
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        if (res.ok) caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html"))),
  );
});
