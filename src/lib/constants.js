// Kontorets adress – geokodas till koordinater vid uppstart (se lib/office.js).
// Fallback-koordinaterna nedan pekar mot centrala Hässleholm och används om
// geokodning misslyckas (t.ex. ingen ORS-nyckel i lokal utveckling).
export const OFFICE_ADDRESS = 'Norra Kringelvägen 70, 281 39 Hässleholm';
export const OFFICE_FALLBACK_COORDS = { lat: 56.0596, lon: 13.7668 };

export const USERS = ['Bertil', 'Ove'];

// De tre vyerna för att växla vem man tittar på: alla, eller en specifik person.
export const PERSON_VIEWS = ['Alla', ...USERS];

export const MISSION_TYPES = [
  'Schaktarbete',
  '3-kammarbrunn',
  'Jordvärme',
  'Plattsättning',
  'Gjutning (grund)',
  'Hyvling av väg',
];

export const MISSION_TYPE_ICONS = {
  'Schaktarbete': '🚜',
  '3-kammarbrunn': '🛢️',
  'Jordvärme': '♨️',
  'Plattsättning': '🧱',
  'Gjutning (grund)': '🏗️',
  'Hyvling av väg': '🛣️',
};

export const MISSION_STATUSES = ['Planerat', 'Pågående', 'Klart'];

export const STATUS_COLORS = {
  'Planerat': '#3b82f6',
  'Pågående': '#f59e0b',
  'Klart': '#22c55e',
};

export const MACHINE_TYPES = [
  'Stor grävare',
  'Liten grävare',
  'Väghyvel',
  'Elverk',
  'Vibratorstamp',
];

export const MACHINE_TYPE_ICONS = {
  'Stor grävare': '🚜',
  'Liten grävare': '🚚',
  'Väghyvel': '🛤️',
  'Elverk': '⚡',
  'Vibratorstamp': '📳',
};

export const WORKDAY_START = '07:00';
export const WORKDAY_END = '17:00';
