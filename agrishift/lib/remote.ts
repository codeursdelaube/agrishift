import { getPosts, getZoneSummary, type PublicPost } from "./api";
import { db, nowIso } from "./db";

/** Données en ligne seulement : mises en cache dans Dexie, jamais bloquantes pour l'écran. */

export interface Forecast {
  daily: {
    time: string[];
    precipitation_sum: (number | null)[];
    precipitation_probability_max: (number | null)[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
  };
}

const FORECAST_URL = process.env.NEXT_PUBLIC_FORECAST_URL ?? "https://api.open-meteo.com/v1/forecast";
const THIRTY_MIN = 1_800_000;

export async function refreshForecast(zoneId: string, latitude: number, longitude: number) {
  if (!navigator.onLine) return;
  const cached = await db.forecast.get(zoneId);
  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < THIRTY_MIN) return;
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily:
      "precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min",
    timezone: "Africa/Lome",
    forecast_days: "7",
  });
  const res = await fetch(`${FORECAST_URL}?${params}`, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error("Prévision indisponible");
  await db.forecast.put({ zone_id: zoneId, fetched_at: nowIso(), data: await res.json() });
}

export async function refreshSummary(zoneId: string) {
  if (!navigator.onLine) return;
  const data = await getZoneSummary(zoneId);
  await db.regionSummary.put({ zone_id: zoneId, fetched_at: nowIso(), data });
}

async function storePublicPosts(posts: PublicPost[]) {
  await db.transaction("rw", db.posts, async () => {
    for (const post of posts) {
      const local = await db.posts.get(post.id);
      if (local && (local.sync_state === "pending" || local.deleted)) continue;
      await db.posts.put({
        id: post.id,
        zone_id: post.zone_id,
        body: post.body,
        ...(post.author_name ? { author_name: post.author_name } : {}),
        updated_at: post.updated_at,
        deleted: post.deleted,
        is_mine: local?.is_mine ?? false,
        sync_state: "synced",
      });
    }
  });
}

/** Charge une page de messages publics ; renvoie le curseur de la page suivante. */
export async function loadPosts(zoneId: string, before?: string | null): Promise<string | null> {
  const page = await getPosts(zoneId, before);
  await storePublicPosts(page.posts);
  return page.next_before;
}
