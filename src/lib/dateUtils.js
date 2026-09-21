const WEEKDAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
const MONTHS = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
];

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function isToday(dateStr) {
  return dateStr === todayIso();
}

export function formatDateLong(dateStr) {
  if (!dateStr) return '–';
  const d = new Date(`${dateStr}T00:00:00`);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '–';
  const d = new Date(`${dateStr}T00:00:00`);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function weekdayName(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return WEEKDAYS[d.getDay()];
}

// Måndag som första dagen i veckan som innehåller referensDate (Date-objekt).
export function startOfWeek(referenceDate) {
  const d = new Date(referenceDate);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function toIso(date) {
  return date.toISOString().slice(0, 10);
}

export function timesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}
