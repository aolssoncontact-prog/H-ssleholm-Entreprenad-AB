import { getApiKey, orsFetch, allowCors } from './_lib/ors.js';

// POST /api/matrix
// Body: { locations: [[lon,lat], ...], profile?: "driving-car" }
// Returnerar avstånd (meter) och körtid (sekunder) mellan alla punkter.
export default async function handler(req, res) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Endast POST stöds.' });
    return;
  }

  const apiKey = getApiKey(res);
  if (!apiKey) return;

  const { locations, profile = 'driving-car' } = req.body || {};
  if (!Array.isArray(locations) || locations.length < 2) {
    res.status(400).json({ error: 'Minst två platser krävs.' });
    return;
  }

  try {
    const { ok, status, data } = await orsFetch(`/v2/matrix/${profile}`, {
      method: 'POST',
      apiKey,
      body: { locations, metrics: ['distance', 'duration'], units: 'm' },
    });
    res.status(ok ? 200 : status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Kunde inte nå OpenRouteService.', details: err.message });
  }
}
