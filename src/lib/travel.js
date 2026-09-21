import { fetchDirections } from './ors.js';
import { haversineMeters } from './geo.js';

// Om OpenRouteService inte går att nå (t.ex. lokal utveckling utan
// "vercel dev" eller saknad ORS_API_KEY) faller vi tillbaka på en grov
// uppskattning: fågelvägen * en vägfaktor, delat på en antagen snitthastighet.
const FALLBACK_ROAD_FACTOR = 1.3;
const FALLBACK_AVG_SPEED_KMH = 55;

// Beräknar körsträcka/körtid mellan två punkter ({lat, lon}). Använder
// riktig ruttning via /api/directions när det går, annars en uppskattning.
export async function estimateTravel(a, b) {
  try {
    const res = await fetchDirections([a, b]);
    if (res.distanceMeters != null && res.durationSeconds != null) {
      return { distanceMeters: res.distanceMeters, durationSeconds: res.durationSeconds, estimated: false };
    }
  } catch {
    // faller igenom till uppskattning nedan
  }
  const distanceMeters = haversineMeters(a, b) * FALLBACK_ROAD_FACTOR;
  const durationSeconds = (distanceMeters / 1000 / FALLBACK_AVG_SPEED_KMH) * 3600;
  return { distanceMeters, durationSeconds, estimated: true };
}
