// Pokédex hors ligne : la page et les images déjà vues restent disponibles sans réseau.
// Les listes de Pokémon, elles, sont gardées par la page (localStorage).

const VERSION = "v70";                       // à changer quand la liste PAGE_FILES change
const PAGE_CACHE = `pokedex-page-${VERSION}`;
const IMG_CACHE = "pokedex-images";         // gardé d'une version à l'autre
const IMG_MAX = 1200;                       // au-delà, les plus anciennes partent
const PAGE_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./fonts/baloo2-latin.woff2",
  "./fonts/baloo2-latin-ext.woff2",
  "./fonts/rubik-latin.woff2",
  "./fonts/rubik-latin-ext.woff2",
  "./app.js",
  "./pvp.json",
  "./costumes.json",
  "./max.json",
  "./i18n.js",
  "./sync.js",
  "./events.js",
  "./names.json",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", ev => {
  ev.waitUntil(
    caches.open(PAGE_CACHE)
      .then(cache => cache.addAll(PAGE_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", ev => {
  ev.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(k => k.startsWith("pokedex-page-") && k !== PAGE_CACHE)
        .map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Illustrations (wsrv.nl ou PokeAPI sur GitHub) : elles ne changent jamais
function isImage(url) {
  return url.hostname === "wsrv.nl" ||
    (url.hostname === "raw.githubusercontent.com" &&
     url.pathname.startsWith("/PokeAPI/sprites/") && url.pathname.endsWith(".png"));
}

self.addEventListener("fetch", ev => {
  const req = ev.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (isImage(url)) ev.respondWith(cacheFirst(req));
  else if (url.origin === self.location.origin) ev.respondWith(networkFirst(req));
  // Le reste (listes pogoapi / PvPoke) passe directement par le réseau
});

async function cacheFirst(req) {
  const cache = await caches.open(IMG_CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone()).then(() => { if (++puts % 50 === 0) trimImages(cache); });
  return res;
}

// Les clés sortent dans l'ordre d'ajout : on retire les plus anciennes
let puts = 0;
async function trimImages(cache) {
  const keys = await cache.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - IMG_MAX))) await cache.delete(k);
}

// La page : toujours la dernière version en ligne, la copie gardée sinon
async function networkFirst(req) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    // no-cache : toujours demander au serveur s'il y a plus récent (sinon le navigateur garde 10 min l'ancien)
    const res = await fetch(req, { cache: "no-cache" });
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req, { ignoreSearch: true })) ||
           (req.mode === "navigate" ? await cache.match("./index.html") : Response.error());
  }
}

// Notification du matin (tools/notify.py) : une par jour, qui liste les Pokémon arrivés
self.addEventListener("push", ev => {
  const d = ev.data ? ev.data.json() : {};
  ev.waitUntil(self.registration.showNotification(d.title || "Pokédex GO", {
    body: d.body || "", icon: d.icon || "icons/icon-192.png", badge: "icons/icon-192.png", tag: "pokedex-daily",
  }));
});
self.addEventListener("notificationclick", ev => {
  ev.notification.close();
  ev.waitUntil(self.clients.openWindow("./?now=1"));
});
