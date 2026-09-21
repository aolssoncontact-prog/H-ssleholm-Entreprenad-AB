import { MISSION_TYPES, USERS, OFFICE_FALLBACK_COORDS } from './constants.js';
import { timesOverlap } from './dateUtils.js';
import { isNonWorkingDay, toIsoDate, addDays } from './holidays.js';

// Bygger listan av faktiska arbetsdagar (inga lördagar, söndagar eller
// svenska röda dagar) inom ett kalenderintervall runt dagens datum.
function buildWorkingDays(startCalendarOffset, endCalendarOffset) {
  const days = [];
  const base = new Date();
  for (let i = startCalendarOffset; i <= endCalendarOffset; i++) {
    const iso = toIsoDate(addDays(base, i));
    if (!isNonWorkingDay(iso)) days.push(iso);
  }
  return days;
}

const WORKING_DAYS = buildWorkingDays(-14, 35);

function nearestWorkingIndex(days) {
  const todayStr = toIsoDate(new Date());
  const exact = days.indexOf(todayStr);
  if (exact !== -1) return exact;
  const next = days.findIndex((d) => d > todayStr);
  return next === -1 ? days.length - 1 : next;
}

// Index i WORKING_DAYS som motsvarar dagens datum (eller närmaste
// kommande arbetsdag, om idag råkar vara helg/röd dag).
const TODAY_INDEX = nearestWorkingIndex(WORKING_DAYS);

// Slår upp en arbetsdag `offset` arbetsdagar från idag (kan vara negativt).
function resolveWorkingDate(offset) {
  const idx = Math.max(0, Math.min(WORKING_DAYS.length - 1, TODAY_INDEX + offset));
  return WORKING_DAYS[idx];
}

// Enkel deterministisk pseudo-slumpgenerator så att exempeldatan ser
// "slumpmässigt" utspridd ut men blir likadan varje gång appen seedas.
function seededRandom(seed) {
  let s = seed >>> 0;
  return function next() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = seededRandom(20240921);

function pick(arr) {
  return arr[Math.floor(rng() * arr.length)];
}

const TOWNS = [
  { name: 'Hässleholm', lat: 56.0596, lon: 13.7668 },
  { name: 'Kristianstad', lat: 56.0294, lon: 14.1567 },
  { name: 'Klippan', lat: 56.1325, lon: 13.1235 },
];

const STREETS = {
  Hässleholm: ['Kristianstadsvägen', 'Vankivavägen', 'Ljungdalavägen', 'Finjasjövägen', 'Tyrs väg', 'Sjöuddevägen', 'Garnisonsvägen'],
  Kristianstad: ['Åhusvägen', 'Degebergavägen', 'Näsby fält', 'Rinkabyvägen', 'Gamlegårdsvägen', 'Vä Norra', 'Tivoligatan'],
  Klippan: ['Ljungbyvägen', 'Östra Ringvägen', 'Stidsvigsvägen', 'Snälltågsvägen', 'Färingtoftavägen', 'Bårslövsvägen'],
};

// Slumpar en punkt inom en cirkel runt en tätort. Longitudgrader är ca 1,65
// gånger "smalare" än breddgrader vid den här breddgraden, så vi kompenserar
// lite grovt för att spridningen ska se jämn ut på kartan.
function jitterAround(center, radiusDeg) {
  const angle = rng() * Math.PI * 2;
  const r = Math.sqrt(rng()) * radiusDeg;
  return {
    lat: +(center.lat + Math.cos(angle) * r).toFixed(6),
    lon: +(center.lon + Math.sin(angle) * r * 1.65).toFixed(6),
  };
}

const TYPE_DESCRIPTIONS = {
  'Schaktarbete': 'Schaktning och iordningställande av mark. Djup och omfattning enligt platsbesök.',
  '3-kammarbrunn': 'Gräva ur och installera ny 3-kammarbrunn för enskilt avlopp enligt kommunens tillstånd.',
  'Jordvärme': 'Gräva ner kollektorslang för jordvärme och samordna med VVS-firma som ansluter värmepumpen.',
  'Plattsättning': 'Förberedelse och plattsättning av uteplats/gångyta, inklusive avjämning med stenmjöl och kantstöd.',
  'Gjutning (grund)': 'Formsättning och gjutning av platta på mark eller grund enligt konstruktionsritning.',
  'Hyvling av väg': 'Hyvling och profilering av enskild väg samt påfyllning av grus i sättningar.',
};

const NOTE_POOL = [
  'Kund vill bli uppringd innan ankomst.',
  'Nycklar hämtas hos granne vid infarten.',
  'Kontrollera ledningar med Ledningskollen innan grävstart.',
  'Fakturaunderlag ska skickas till kontoret samma dag som klart.',
  'Grannar informerade om arbetet.',
  'Extra fallskydd krävs pga närhet till väg.',
  '',
  '',
];

// De sex ursprungliga uppdragen på de koordinater som angavs från start.
// Två av dem (index 4 och 5) utgör tillsammans med två nya uppdrag nedan
// ett medvetet exempel på "samma dag"-planering (se CLUSTER_OFFSET).
const HERO_MISSIONS = [
  {
    lat: 56.09600445454126,
    lon: 13.669358856640757,
    type: 'Schaktarbete',
    title: 'Schaktarbete inför garageuppfart',
    description: 'Schaktning och iordningställande av mark inför ny garageuppfart. Ca 40 m² ska grävas ur till 30 cm djup och fyllas med bärlager.',
    status: 'Planerat',
    responsible: 'Bertil',
    dateOffset: 0,
    startTime: '07:30',
    endTime: '09:30',
    notes: 'Kund har hund på tomten – ring innan ankomst.',
  },
  {
    lat: 56.3325484214752,
    lon: 13.947911106305941,
    type: '3-kammarbrunn',
    title: 'Installation av 3-kammarbrunn',
    description: 'Gräva ur och installera ny 3-kammarbrunn för enskilt avlopp enligt kommunens tillstånd. Anslutning till befintligt spillvattenrör.',
    status: 'Pågående',
    responsible: 'Ove',
    dateOffset: 0,
    startTime: '07:00',
    endTime: '10:30',
    notes: 'Tillstånd från miljöförvaltningen finns i pärm på kontoret. Kontrollera nivåer innan igenfyllning.',
  },
  {
    lat: 56.32265006011826,
    lon: 13.430867095805649,
    type: 'Jordvärme',
    title: 'Grävning för jordvärmeslingor',
    description: 'Gräva ner kollektorslang för jordvärme, ca 300 meter slinga fördelat på tre schakt. Samordnas med VVS-firma som ansluter värmepumpen.',
    status: 'Planerat',
    responsible: 'Bertil',
    dateOffset: 6,
    startTime: '07:00',
    endTime: '16:00',
    notes: 'Beställ markeringsspray för att markera slingans sträckning innan igenfyllning.',
  },
  {
    lat: 56.22161643818717,
    lon: 13.881306499375626,
    type: 'Plattsättning',
    title: 'Plattsättning av uteplats',
    description: 'Förberedelse och plattsättning av ca 25 m² uteplats, inklusive avjämning med stenmjöl och kantstöd.',
    status: 'Klart',
    responsible: 'Ove',
    dateOffset: -4,
    startTime: '08:00',
    endTime: '16:00',
    notes: 'Kund nöjd, fotodokumentation uppladdad. Fakturaunderlag skickat till kontoret.',
  },
  {
    lat: 55.93222421538359,
    lon: 13.926562896546796,
    type: 'Gjutning (grund)',
    title: 'Gjutning av husgrund',
    description: 'Formsättning och gjutning av platta på mark för nytt komplementbostadshus, ca 60 m².',
    status: 'Planerat',
    responsible: 'Bertil',
    dateOffset: 4,
    startTime: '07:00',
    endTime: '11:00',
    notes: 'Betongbil bokad till kl. 08:00. Väderprognos bra hela dagen.',
  },
  {
    lat: 55.87795195076183,
    lon: 13.502215996891856,
    type: 'Hyvling av väg',
    title: 'Hyvling av grusväg',
    description: 'Hyvling och profilering av ca 800 meter enskild grusväg samt påfyllning av grus i sättningar.',
    status: 'Planerat',
    responsible: 'Ove',
    dateOffset: 4,
    startTime: '07:00',
    endTime: '09:30',
    notes: 'Väghållningsförening har informerat boende om avstängning under arbetet.',
  },
];

// Samma dag som de två sista HERO-uppdragen ovan (dateOffset 4) får både
// Bertil och Ove ett andra uppdrag för eftermiddagen. Bertils andra stopp
// ligger nära det första (gott om tid för transport), medan Oves andra
// stopp medvetet ligger långt bort med en snäv lucka – för att visa att
// planeringsverktyget varnar när restiden inte räcker.
const CLUSTER_OFFSET = 4;
const CLUSTER_MISSIONS = [
  {
    ...jitterAround(TOWNS[1], 0.05),
    type: 'Plattsättning',
    title: 'Plattsättning av uteplats – Rinkabyvägen, Kristianstad',
    description: TYPE_DESCRIPTIONS['Plattsättning'] + ' Plats: Rinkabyvägen i Kristianstad-området.',
    status: 'Planerat',
    responsible: 'Bertil',
    dateOffset: CLUSTER_OFFSET,
    startTime: '12:00',
    endTime: '15:30',
    notes: 'Andra uppdraget för dagen – gott om tid för transport från förmiddagens jobb.',
  },
  {
    ...jitterAround(TOWNS[1], 0.05),
    type: '3-kammarbrunn',
    title: 'Installation av 3-kammarbrunn – Åhusvägen, Kristianstad',
    description: TYPE_DESCRIPTIONS['3-kammarbrunn'] + ' Plats: Åhusvägen i Kristianstad-området.',
    status: 'Planerat',
    responsible: 'Ove',
    dateOffset: CLUSTER_OFFSET,
    startTime: '10:00',
    endTime: '13:00',
    notes: 'OBS – kort tid efter förmiddagens uppdrag, kontrollera att restiden räcker.',
  },
];

const DURATION_CATEGORY = {
  'Schaktarbete': 'half',
  '3-kammarbrunn': 'half',
  'Jordvärme': 'full',
  'Plattsättning': 'half',
  'Gjutning (grund)': 'full',
  'Hyvling av väg': 'half',
};

const MORNING_STARTS = ['07:00', '07:30', '08:00'];
const MORNING_ENDS = ['10:30', '11:00', '11:30'];
const AFTERNOON_STARTS = ['12:00', '12:30', '13:00'];
const AFTERNOON_ENDS = ['15:30', '16:00', '16:30', '17:00'];
const FULLDAY_ENDS = ['16:00', '16:30', '17:00'];

function makeSlot(category) {
  if (category === 'full') return { startTime: '07:00', endTime: pick(FULLDAY_ENDS) };
  return rng() < 0.5
    ? { startTime: pick(MORNING_STARTS), endTime: pick(MORNING_ENDS) }
    : { startTime: pick(AFTERNOON_STARTS), endTime: pick(AFTERNOON_ENDS) };
}

// Sannolikhet att försöka lägga ett halvdagsuppdrag på en dag personen
// redan har ett (halvdags-)uppdrag på, istället för en helt ny dag. Ger
// fler dagar med två uppdrag per person, vilket är bra för att visa
// planeringslogiken i praktiken.
const DOUBLE_UP_CHANCE = 0.45;

// Hittar en arbetsdag och tid för `person` som inte krockar med det som
// redan är inbokat (varken de fasta HERO/CLUSTER-uppdragen eller tidigare
// slumpmässigt schemalagda uppdrag). Väljer bara bland faktiska
// arbetsdagar (WORKING_DAYS) – aldrig helg eller röd dag.
function scheduleMission(person, category, usedByPersonDate, usedDaysByPerson) {
  if (category === 'half' && usedDaysByPerson[person].length > 0 && rng() < DOUBLE_UP_CHANCE) {
    const candidateDays = usedDaysByPerson[person].filter(
      (date) => (usedByPersonDate[`${person}|${date}`] || []).length === 1
    );
    if (candidateDays.length > 0) {
      const date = pick(candidateDays);
      for (let attempt = 0; attempt < 20; attempt++) {
        const slot = makeSlot('half');
        const key = `${person}|${date}`;
        const existing = usedByPersonDate[key] || [];
        const conflict = existing.some((e) => timesOverlap(e.startTime, e.endTime, slot.startTime, slot.endTime));
        if (!conflict) {
          usedByPersonDate[key] = [...existing, slot];
          return { date, ...slot };
        }
      }
    }
  }

  for (let attempt = 0; attempt < 80; attempt++) {
    const date = pick(WORKING_DAYS);
    const slot = makeSlot(category);
    const key = `${person}|${date}`;
    const existing = usedByPersonDate[key] || [];
    const conflict = existing.some((e) => timesOverlap(e.startTime, e.endTime, slot.startTime, slot.endTime));
    if (!conflict) {
      usedByPersonDate[key] = [...existing, slot];
      if (!usedDaysByPerson[person].includes(date)) usedDaysByPerson[person].push(date);
      return { date, ...slot };
    }
  }
  for (const date of WORKING_DAYS) {
    const slot = makeSlot(category);
    const key = `${person}|${date}`;
    const existing = usedByPersonDate[key] || [];
    const conflict = existing.some((e) => timesOverlap(e.startTime, e.endTime, slot.startTime, slot.endTime));
    if (!conflict) {
      usedByPersonDate[key] = [...existing, slot];
      if (!usedDaysByPerson[person].includes(date)) usedDaysByPerson[person].push(date);
      return { date, ...slot };
    }
  }
  throw new Error('Kunde inte schemalägga exempeluppdrag utan krock.');
}

function statusForDate(dateStr) {
  const todayStr = toIsoDate(new Date());
  if (dateStr < todayStr) return 'Klart';
  if (dateStr === todayStr) return rng() < 0.6 ? 'Pågående' : 'Planerat';
  return 'Planerat';
}

const GENERATED_MISSION_COUNT = 28;

// Bygger ytterligare 28 fiktiva uppdrag runt Hässleholm, Kristianstad och
// Klippan (utöver de två i CLUSTER_MISSIONS), utspridda över ungefär tre
// veckor med både förflutna, dagens och kommande arbetsdagar. Ungefär
// varannan gång ett halvdagsuppdrag schemaläggs försöker det hamna samma
// dag som personens andra uppdrag (se DOUBLE_UP_CHANCE), så flera dagar
// får två uppdrag per person.
function buildGeneratedMissions(usedByPersonDate, usedDaysByPerson) {
  const missions = [];
  for (let i = 0; i < GENERATED_MISSION_COUNT; i++) {
    const town = TOWNS[i % TOWNS.length];
    const type = MISSION_TYPES[(i + 2) % MISSION_TYPES.length];
    const street = pick(STREETS[town.name]);
    const responsible = i % 2 === 0 ? 'Ove' : 'Bertil';
    const coords = jitterAround(town, 0.09);
    const { date, startTime, endTime } = scheduleMission(
      responsible,
      DURATION_CATEGORY[type],
      usedByPersonDate,
      usedDaysByPerson
    );

    missions.push({
      ...coords,
      type,
      title: `${type} – ${street}, ${town.name}`,
      description: `${TYPE_DESCRIPTIONS[type]} Plats: ${street} i ${town.name}-området.`,
      status: statusForDate(date),
      responsible,
      date,
      startTime,
      endTime,
      notes: pick(NOTE_POOL),
    });
  }
  return missions;
}

// Använder den handskrivna statusen bara om uppdraget faktiskt landar på
// dagens datum efter helg/röd dag-justering – annars härleds status från
// om den slutgiltiga arbetsdagen ligger i dåtid eller framtid.
function resolveStatus(explicitStatus, date) {
  const todayStr = toIsoDate(new Date());
  return date === todayStr ? explicitStatus : statusForDate(date);
}

export function buildSeedMissions() {
  const heroResolved = HERO_MISSIONS.map((m) => ({ ...m, date: resolveWorkingDate(m.dateOffset) }));
  const clusterResolved = CLUSTER_MISSIONS.map((m) => ({ ...m, date: resolveWorkingDate(m.dateOffset) }));

  const usedByPersonDate = {};
  const usedDaysByPerson = Object.fromEntries(USERS.map((u) => [u, []]));
  for (const m of [...heroResolved, ...clusterResolved]) {
    const key = `${m.responsible}|${m.date}`;
    usedByPersonDate[key] = [...(usedByPersonDate[key] || []), { startTime: m.startTime, endTime: m.endTime }];
    if (!usedDaysByPerson[m.responsible].includes(m.date)) usedDaysByPerson[m.responsible].push(m.date);
  }

  const generated = buildGeneratedMissions(usedByPersonDate, usedDaysByPerson);
  const all = [...heroResolved, ...clusterResolved, ...generated];

  return all.map((m, i) => ({
    id: `mission-${i + 1}`,
    type: m.type,
    title: m.title,
    description: m.description,
    lat: m.lat,
    lon: m.lon,
    address: null,
    status: resolveStatus(m.status, m.date),
    responsible: m.responsible,
    date: m.date,
    startTime: m.startTime,
    endTime: m.endTime,
    notes: m.notes,
    machineIds: [],
    files: [],
    createdAt: new Date().toISOString(),
  }));
}

export function buildSeedMachines(missions, office = OFFICE_FALLBACK_COORDS) {
  return [
    {
      id: 'machine-1',
      name: 'Stor grävare',
      type: 'Stor grävare',
      lat: missions[1].lat,
      lon: missions[1].lon,
      locationLabel: 'På plats – ' + missions[1].title,
      status: 'Upptagen',
      assignedMissionId: missions[1].id,
    },
    {
      id: 'machine-2',
      name: 'Liten grävare',
      type: 'Liten grävare',
      lat: office.lat,
      lon: office.lon,
      locationLabel: 'Vid kontoret',
      status: 'Tillgänglig',
      assignedMissionId: null,
    },
    {
      id: 'machine-3',
      name: 'Väghyvel',
      type: 'Väghyvel',
      lat: office.lat,
      lon: office.lon,
      locationLabel: 'Vid kontoret',
      status: 'Tillgänglig',
      assignedMissionId: null,
    },
    {
      id: 'machine-4',
      name: 'Elverk 1',
      type: 'Elverk',
      lat: missions[4].lat,
      lon: missions[4].lon,
      locationLabel: 'På plats – ' + missions[4].title,
      status: 'Upptagen',
      assignedMissionId: missions[4].id,
    },
    {
      id: 'machine-5',
      name: 'Elverk 2',
      type: 'Elverk',
      lat: office.lat,
      lon: office.lon,
      locationLabel: 'Vid kontoret',
      status: 'Tillgänglig',
      assignedMissionId: null,
    },
    {
      id: 'machine-6',
      name: 'Vibratorstamp',
      type: 'Vibratorstamp',
      lat: office.lat,
      lon: office.lon,
      locationLabel: 'Vid kontoret',
      status: 'Tillgänglig',
      assignedMissionId: null,
    },
  ];
}

export async function seedIfNeeded(repository, officeLocation) {
  const seeded = await repository.isSeeded();
  if (seeded) return;

  const missions = buildSeedMissions();
  await repository.saveMissions(missions);
  await repository.saveMachines(buildSeedMachines(missions, officeLocation || OFFICE_FALLBACK_COORDS));
  await repository.markSeeded();
}

export { MISSION_TYPES, USERS };
