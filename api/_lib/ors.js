// Delad hjälpfunktion för alla /api-endpoints som proxar OpenRouteService.
// Filer som börjar med "_" i /api-mappen byggs INTE till egna Vercel-funktioner.

const ORS_BASE_URL = 'https://api.openrouteservice.org';

export function getApiKey(res) {
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: 'Servern saknar ORS_API_KEY. Sätt miljövariabeln i Vercel (Project Settings -> Environment Variables) och deploya om.',
    });
    return null;
  }
  return apiKey;
}

export async function orsFetch(path, { method = 'GET', apiKey, body, query } = {}) {
  const url = new URL(ORS_BASE_URL + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    }
  }

  const headers = {
    Authorization: apiKey,
    Accept: 'application/json, application/geo+json',
  };
  if (body) headers['Content-Type'] = 'application/json';

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  return { ok: response.ok, status: response.status, data };
}

export function allowCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}
