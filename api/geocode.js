import { getApiKey, orsFetch, allowCors } from './_lib/ors.js';

// GET /api/geocode?text=Norra+Kringelvägen+70,+Hässleholm   (adress -> koordinater, ett resultat)
// GET /api/geocode?text=Norra+Kring&size=5                   (adress -> flera förslag, medan man skriver)
// GET /api/geocode?lat=56.05&lon=13.76                        (koordinater -> adress)
//
// Vi använder alltid /geocode/search (fullständig strukturerad
// adressparsning via libpostal), inte /geocode/autocomplete. Autocomplete
// är byggt för korta, ostrukturerade textprefix medan search klarar
// kompletta adresser med gatunummer, postnummer och ort mycket bättre –
// annars missas riktiga, existerande adresser (visas som "hittades inte"
// trots att adressen är korrekt).
export default async function handler(req, res) {
  if (allowCors(req, res)) return;
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Endast GET stöds.' });
    return;
  }

  const apiKey = getApiKey(res);
  if (!apiKey) return;

  const { text, lat, lon, size } = req.query || {};

  try {
    if (text) {
      const { ok, status, data } = await orsFetch('/geocode/search', {
        method: 'GET',
        apiKey,
        query: { text, size: size || 1, 'boundary.country': 'SE' },
      });
      res.status(ok ? 200 : status).json(data);
      return;
    }

    if (lat && lon) {
      const { ok, status, data } = await orsFetch('/geocode/reverse', {
        method: 'GET',
        apiKey,
        query: { 'point.lat': lat, 'point.lon': lon, size: 1 },
      });
      res.status(ok ? 200 : status).json(data);
      return;
    }

    res.status(400).json({ error: 'Ange antingen "text" (adress) eller "lat" och "lon" (koordinater).' });
  } catch (err) {
    res.status(502).json({ error: 'Kunde inte nå OpenRouteService.', details: err.message });
  }
}
