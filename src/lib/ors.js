// Klient mot våra egna /api-endpoints (som i sin tur proxar OpenRouteService).
// Ingen ORS-nyckel finns eller används i frontend-koden.

async function parseJsonResponse(res, url) {
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `Fick inget giltigt svar från ${url}. Kör du "vercel dev" lokalt eller är appen deployad på Vercel med ORS_API_KEY satt?`
    );
  }
  if (!res.ok) {
    throw new Error(data?.error || `Anropet till ${url} misslyckades (${res.status}).`);
  }
  return data;
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseJsonResponse(res, url);
}

async function getJson(url) {
  const res = await fetch(url);
  return parseJsonResponse(res, url);
}

// points: array av {lat, lon}, i den ordning rutten ska ritas.
// Returnerar { distanceMeters, durationSeconds, geometry: [[lat,lon], ...] }
export async function fetchDirections(points) {
  const coordinates = points.map((p) => [p.lon, p.lat]);
  const data = await postJson('/api/directions', { coordinates });
  const feature = data.features?.[0];
  if (!feature) throw new Error('Inget ruttsvar från OpenRouteService.');
  const summary = feature.properties?.summary || {};
  const geometry = (feature.geometry?.coordinates || []).map(([lon, lat]) => [lat, lon]);
  return {
    distanceMeters: summary.distance ?? null,
    durationSeconds: summary.duration ?? null,
    geometry,
  };
}

// points: array av {lat, lon}. Returnerar { distances, durations } (2D-matriser).
export async function fetchMatrix(points) {
  const locations = points.map((p) => [p.lon, p.lat]);
  const data = await postJson('/api/matrix', { locations });
  return {
    distances: data.distances || [],
    durations: data.durations || [],
  };
}

// office: {lat, lon}. missions: [{id, lat, lon, serviceMinutes?, startTime?, endTime?}]
// dateStr: 'YYYY-MM-DD', workStart/workEnd: 'HH:MM'
// Returnerar den optimerade besöksordningen som en lista av mission-id:n.
export async function fetchOptimizedOrder(office, missions, dateStr, workStart, workEnd) {
  const dayStart = new Date(`${dateStr}T${workStart}:00`);
  const dayEnd = new Date(`${dateStr}T${workEnd}:00`);
  const toEpoch = (d) => Math.floor(d.getTime() / 1000);

  const vehicles = [
    {
      id: 1,
      profile: 'driving-car',
      start: [office.lon, office.lat],
      end: [office.lon, office.lat],
      time_window: [toEpoch(dayStart), toEpoch(dayEnd)],
    },
  ];

  const jobs = missions.map((m, i) => {
    const job = {
      id: i + 1,
      location: [m.lon, m.lat],
      service: (m.serviceMinutes ?? 60) * 60,
    };
    if (m.startTime && m.endTime) {
      const s = new Date(`${dateStr}T${m.startTime}:00`);
      const e = new Date(`${dateStr}T${m.endTime}:00`);
      job.time_windows = [[toEpoch(s), toEpoch(e)]];
    } else {
      job.time_windows = [[toEpoch(dayStart), toEpoch(dayEnd)]];
    }
    return job;
  });

  const data = await postJson('/api/optimization', { jobs, vehicles });
  const route = data.routes?.[0];
  if (!route) return { order: [], unassigned: data.unassigned || [] };

  const order = route.steps
    .filter((s) => s.type === 'job')
    .map((s) => missions[s.job - 1].id);

  return { order, unassigned: data.unassigned || [] };
}

export async function geocodeAddress(text) {
  const data = await getJson(`/api/geocode?text=${encodeURIComponent(text)}`);
  const feature = data.features?.[0];
  if (!feature) return null;
  const [lon, lat] = feature.geometry.coordinates;
  return { lat, lon, label: feature.properties?.label || text };
}

export async function reverseGeocode(lat, lon) {
  const data = await getJson(`/api/geocode?lat=${lat}&lon=${lon}`);
  const feature = data.features?.[0];
  if (!feature) return null;
  return feature.properties?.label || null;
}
