// Pokédex hors ligne : la page et les images déjà vues restent disponibles sans réseau.
// Les listes de Pokémon, elles, sont gardées par la page (localStorage).

const VERSION = "v3";                       // à changer quand la liste PAGE_FILES change
const PAGE_CACHE = `pokedex-page-${VERSION}`;
const IMG_CACHE = "pokedex-images";         // gardé d'une version à l'autre
const PAGE_FILES = [
  "./",
  "./index.html",
  "./i18n.js",
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
  // Le reste (listes pogoapi / PvPoke, cris) passe directement par le réseau
});

async function cacheFirst(req) {
  const cache = await caches.open(IMG_CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

// La page : toujours la dernière version en ligne, la copie gardée sinon
async function networkFirst(req) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req, { ignoreSearch: true })) ||
           (req.mode === "navigate" ? await cache.match("./index.html") : Response.error());
  }
}
