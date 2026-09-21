import { getApiKey, orsFetch, allowCors } from './_lib/ors.js';

// POST /api/optimization
// Body: { jobs: [{id, location:[lon,lat], service?, time_windows?}], vehicles: [{...}] }
// Proxar ORS/VROOM-optimeringsmotorn för att hitta bästa besöksordning
// inom tidsfönstret (skickas av klienten, typiskt 07:00-17:00).
export default async function handler(req, res) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Endast POST stöds.' });
    return;
  }

  const apiKey = getApiKey(res);
  if (!apiKey) return;

  const { jobs, vehicles } = req.body || {};
  if (!Array.isArray(jobs) || jobs.length === 0 || !Array.isArray(vehicles) || vehicles.length === 0) {
    res.status(400).json({ error: 'jobs och vehicles krävs.' });
    return;
  }

  try {
    const { ok, status, data } = await orsFetch('/optimization', {
      method: 'POST',
      apiKey,
      body: { jobs, vehicles },
    });
    res.status(ok ? 200 : status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Kunde inte nå OpenRouteService.', details: err.message });
  }
}
