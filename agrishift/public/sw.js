/* Service worker écrit à la main : app et photos disponibles sans réseau.
   Les données de l'API passent par IndexedDB, jamais par ce cache. */
const STATIC_CACHE = "agrishift-static-v1";
const PAGE_CACHE = "agrishift-pages-v1";

const PAGES = [
  "/",
  "/accueil",
  "/conseil",
  "/meteo",
  "/region",
  "/echanges",
  "/parametres",
  "/demarrer",
  "/parcelles/nouvelle",
  "/a-propos",
];

const ASSETS = [
  "/packs/maritime_lome.json",
  "/packs/plateaux_kpalime.json",
  "/packs/kara_kara.json",
  "/images/landing/hero.webp",
  "/images/landing/community.webp",
  "/images/landing/sky.webp",
  "/images/crops/maize.webp",
  "/images/crops/sorghum.webp",
  "/images/crops/rice.webp",
  "/images/crops/groundnut.webp",
  "/images/crops/cowpea.webp",
  "/images/zones/kara_kara.webp",
  "/images/zones/plateaux_kpalime.webp",
  "/images/zones/maritime_lome.webp",
];

const NEXT_ASSET = /\/_next\/static\/[^"'\\\s)]+/g;

/** Garde une page et tous les fichiers JS/CSS qu'elle référence : sans eux, pas d'hydratation. */
async function cachePage(url) {
  const [pages, statics] = await Promise.all([caches.open(PAGE_CACHE), caches.open(STATIC_CACHE)]);
  const response = await fetch(url);
  if (!response.ok) return;
  await pages.put(url, response.clone());
  const assets = new Set((await response.text()).match(NEXT_ASSET) ?? []);
  await Promise.allSettled(
    [...assets].map(async (asset) => {
      if (!(await statics.match(asset))) await statics.add(asset);
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((c) => c.addAll(ASSETS)),
      Promise.allSettled(PAGES.map(cachePage)),
    ]).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== STATIC_CACHE && k !== PAGE_CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** L'application signale les pages de ses champs, pour les garder hors ligne. */
self.addEventListener("message", (event) => {
  if (event.data?.type !== "cache-pages" || !Array.isArray(event.data.urls)) return;
  event.waitUntil(Promise.allSettled(event.data.urls.map(cachePage)));
});

async function fromNetworkFirst(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request, { signal: AbortSignal.timeout(3000) });
    if (response.ok) void cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    return cached ?? Response.redirect("/accueil", 302);
  }
}

async function fromCacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) void cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fromNetworkFirst(request));
  } else if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/packs/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(fromCacheFirst(request));
  }
});
