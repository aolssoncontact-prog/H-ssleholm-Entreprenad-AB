import { getApiKey, orsFetch, allowCors } from './_lib/ors.js';

// POST /api/directions
// Body: { coordinates: [[lon,lat], [lon,lat], ...], profile?: "driving-car" }
// Returnerar GeoJSON med ruttgeometri, körtid (sekunder) och sträcka (meter).
export default async function handler(req, res) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Endast POST stöds.' });
    return;
  }

  const apiKey = getApiKey(res);
  if (!apiKey) return;

  const { coordinates, profile = 'driving-car' } = req.body || {};
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    res.status(400).json({ error: 'Minst två koordinater krävs (t.ex. [[lon,lat],[lon,lat]]).' });
    return;
  }

  try {
    const { ok, status, data } = await orsFetch(`/v2/directions/${profile}/geojson`, {
      method: 'POST',
      apiKey,
      body: { coordinates },
    });
    res.status(ok ? 200 : status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Kunde inte nå OpenRouteService.', details: err.message });
  }
}
