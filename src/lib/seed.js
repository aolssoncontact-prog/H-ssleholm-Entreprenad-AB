import { MISSION_TYPES, USERS, OFFICE_FALLBACK_COORDS } from './constants.js';

function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const RAW_MISSIONS = [
  { lat: 56.09600445454126, lon: 13.669358856640757 },
  { lat: 56.3325484214752, lon: 13.947911106305941 },
  { lat: 56.32265006011826, lon: 13.430867095805649 },
  { lat: 56.22161643818717, lon: 13.881306499375626 },
  { lat: 55.93222421538359, lon: 13.926562896546796 },
  { lat: 55.87795195076183, lon: 13.502215996891856 },
];

const MISSION_DETAILS = [
  {
    type: 'Schaktarbete',
    title: 'Schaktarbete inför garageuppfart',
    description: 'Schaktning och iordningställande av mark inför ny garageuppfart. Ca 40 m² ska grävas ur till 30 cm djup och fyllas med bärlager.',
    status: 'Planerat',
    responsible: 'Bertil',
    dateOffset: 0,
    startTime: '07:30',
    endTime: '11:00',
    notes: 'Kund har hund på tomten – ring innan ankomst.',
  },
  {
    type: '3-kammarbrunn',
    title: 'Installation av 3-kammarbrunn',
    description: 'Gräva ur och installera ny 3-kammarbrunn för enskilt avlopp enligt kommunens tillstånd. Anslutning till befintligt spillvattenrör.',
    status: 'Pågående',
    responsible: 'Ove',
    dateOffset: 0,
    startTime: '07:00',
    endTime: '15:00',
    notes: 'Tillstånd från miljöförvaltningen finns i pärm på kontoret. Kontrollera nivåer innan igenfyllning.',
  },
  {
    type: 'Jordvärme',
    title: 'Grävning för jordvärmeslingor',
    description: 'Gräva ner kollektorslang för jordvärme, ca 300 meter slinga fördelat på tre schakt. Samordnas med VVS-firma som ansluter värmepumpen.',
    status: 'Planerat',
    responsible: 'Bertil',
    dateOffset: 1,
    startTime: '07:00',
    endTime: '16:00',
    notes: 'Beställ markeringsspray för att markera slingans sträckning innan igenfyllning.',
  },
  {
    type: 'Plattsättning',
    title: 'Plattsättning av uteplats',
    description: 'Förberedelse och plattsättning av ca 25 m² uteplats, inklusive avjämning med stenmjöl och kantstöd.',
    status: 'Klart',
    responsible: 'Ove',
    dateOffset: -2,
    startTime: '08:00',
    endTime: '16:00',
    notes: 'Kund nöjd, fotodokumentation uppladdad. Fakturaunderlag skickat till kontoret.',
  },
  {
    type: 'Gjutning (grund)',
    title: 'Gjutning av husgrund',
    description: 'Formsättning och gjutning av platta på mark för nytt komplementbostadshus, ca 60 m².',
    status: 'Pågående',
    responsible: 'Bertil',
    dateOffset: 0,
    startTime: '07:00',
    endTime: '17:00',
    notes: 'Betongbil bokad till kl. 09:00. Väderprognos bra hela dagen.',
  },
  {
    type: 'Hyvling av väg',
    title: 'Hyvling av grusväg',
    description: 'Hyvling och profilering av ca 800 meter enskild grusväg samt påfyllning av grus i sättningar.',
    status: 'Planerat',
    responsible: 'Ove',
    dateOffset: 2,
    startTime: '07:00',
    endTime: '13:00',
    notes: 'Väghållningsförening har informerat boende om avstängning under arbetet.',
  },
];

export function buildSeedMissions() {
  return RAW_MISSIONS.map((coords, i) => {
    const details = MISSION_DETAILS[i];
    return {
      id: `mission-${i + 1}`,
      type: details.type,
      title: details.title,
      description: details.description,
      lat: coords.lat,
      lon: coords.lon,
      address: null,
      status: details.status,
      responsible: details.responsible,
      date: todayPlus(details.dateOffset),
      startTime: details.startTime,
      endTime: details.endTime,
      notes: details.notes,
      machineIds: [],
      files: [],
      createdAt: new Date().toISOString(),
    };
  });
}

export function buildSeedMachines(office = OFFICE_FALLBACK_COORDS) {
  const missions = buildSeedMissions();
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
  await repository.saveMachines(buildSeedMachines(officeLocation || OFFICE_FALLBACK_COORDS));
  await repository.markSeeded();
}

export { MISSION_TYPES, USERS };
