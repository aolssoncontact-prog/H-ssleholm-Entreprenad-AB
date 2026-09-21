import { OFFICE_ADDRESS, OFFICE_FALLBACK_COORDS } from './constants.js';
import { geocodeAddress } from './ors.js';
import { repository } from './storage.js';

// Geokodar kontorsadressen en gång och cachar resultatet i localStorage.
// Faller tillbaka till fasta koordinater om geokodningen inte lyckas
// (t.ex. saknad ORS_API_KEY i lokal utveckling utan "vercel dev").
export async function ensureOfficeLocation() {
  const cached = await repository.getOfficeLocation();
  if (cached) return cached;

  let location;
  try {
    const result = await geocodeAddress(OFFICE_ADDRESS);
    location = result
      ? { ...result, address: OFFICE_ADDRESS, geocoded: true }
      : { ...OFFICE_FALLBACK_COORDS, label: OFFICE_ADDRESS, address: OFFICE_ADDRESS, geocoded: false };
  } catch {
    location = { ...OFFICE_FALLBACK_COORDS, label: OFFICE_ADDRESS, address: OFFICE_ADDRESS, geocoded: false };
  }

  await repository.setOfficeLocation(location);
  return location;
}
