// שומר את מעטפת האפליקציה, כדי שתיפתח מהר גם בקליטה חלשה. נתונים תמיד מגיעים מהשרת.
const CACHE = "bph-shell-v1";
const SHELL = ["./", "index.html", "logo.png", "icon-192.png", "icon-512.png", "manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  // דפים: קודם מהרשת, ואם אין רשת מהמטמון
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match(new URL("index.html", self.registration.scope).href))),
  );
});

// התראה לטלפון (כשיחובר שירות ההתראות)
self.addEventListener("push", (e) => {
  const d = e.data ? e.data.json() : { title: "בורא פרי העץ", body: "" };
  e.waitUntil(self.registration.showNotification(d.title, { body: d.body, icon: new URL("icon-192.png", self.registration.scope).href, dir: "rtl", lang: "he" }));
});
