// Svenska röda dagar + helger. Allt räknas i lokal tid (aldrig via
// Date#toISOString, som kan hoppa ett dygn beroende på tidszon) så att
// veckodag/datum alltid stämmer oavsett var appen körs.

function formatIso(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function parseIsoDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toIsoDate(date) {
  return formatIso(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isWeekend(dateStr) {
  const day = parseIsoDate(dateStr).getDay();
  return day === 0 || day === 6;
}

// Gauss/anonyma gregorianska algoritmen för påskdagen.
function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// Hittar lördagen inom ett datumintervall (använt för midsommar- och
// alla helgons dag, som alltid infaller på en lördag).
function saturdayBetween(from, to) {
  let d = new Date(from);
  while (d.getDay() !== 6) {
    d = addDays(d, 1);
    if (d > to) throw new Error('Ingen lördag hittades i intervallet.');
  }
  return d;
}

const holidayCache = new Map();

function computeSwedishHolidays(year) {
  const set = new Set();
  const add = (date) => set.add(toIsoDate(date));

  add(new Date(year, 0, 1)); // Nyårsdagen
  add(new Date(year, 0, 6)); // Trettondedag jul
  add(new Date(year, 4, 1)); // Första maj
  add(new Date(year, 5, 6)); // Sveriges nationaldag
  add(new Date(year, 11, 25)); // Juldagen
  add(new Date(year, 11, 26)); // Annandag jul

  const easter = easterSunday(year);
  add(addDays(easter, -2)); // Långfredagen
  add(easter); // Påskdagen
  add(addDays(easter, 1)); // Annandag påsk
  add(addDays(easter, 39)); // Kristi himmelsfärdsdag
  add(addDays(easter, 49)); // Pingstdagen

  add(saturdayBetween(new Date(year, 5, 20), new Date(year, 5, 26))); // Midsommardagen
  add(saturdayBetween(new Date(year, 9, 31), new Date(year, 10, 6))); // Alla helgons dag

  return set;
}

function getSwedishHolidays(year) {
  if (!holidayCache.has(year)) holidayCache.set(year, computeSwedishHolidays(year));
  return holidayCache.get(year);
}

export function isSwedishHoliday(dateStr) {
  const year = Number(dateStr.slice(0, 4));
  return getSwedishHolidays(year).has(dateStr);
}

export function isNonWorkingDay(dateStr) {
  return isWeekend(dateStr) || isSwedishHoliday(dateStr);
}

// Kort, användarvänlig etikett för varför ett datum inte går att boka
// arbete på, eller null om det är en vanlig arbetsdag.
export function nonWorkingDayReason(dateStr) {
  if (isSwedishHoliday(dateStr)) return 'röd dag';
  if (isWeekend(dateStr)) return 'helg';
  return null;
}
