import { WORKDAY_START, WORKDAY_END } from './constants.js';
import { timesOverlap } from './dateUtils.js';
import { estimateTravel } from './travel.js';
import { nonWorkingDayReason } from './holidays.js';

// Extra säkerhetsmarginal utöver den rena körtiden, för av- och pålastning
// samt att inte behöva räkna på sekunden.
const BUFFER_MINUTES = 10;

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function minutesToLabel(minutes) {
  return `${Math.round(minutes)} min`;
}

// Kontrollerar om `candidate` ({ responsible, date, startTime, endTime, lat, lon })
// går att boka in för personen, givet:
//  1. Datumet får inte vara en lördag, söndag eller svensk röd dag – Bertil
//     och Ove jobbar inte då.
//  2. Inga andra uppdrag för samma person samma dag får krocka tidsmässigt.
//  3. Det måste finnas tid nog att köra dit från föregående stopp den dagen
//     (föregående uppdrag, eller kontoret om det är dagens första stopp).
//  4. Det måste finnas tid nog att köra vidare till nästa stopp (nästa
//     uppdrag, eller tillbaka till kontoret senast kl. 17:00 om det är
//     dagens sista stopp).
// Returnerar { ok: true } eller { ok: false, reason, message }.
export async function checkAvailability({ missions, office, candidate, excludeId }) {
  const nonWorking = nonWorkingDayReason(candidate.date);
  if (nonWorking) {
    return {
      ok: false,
      reason: 'non-working-day',
      message: `${candidate.date} är en ${nonWorking} – Bertil och Ove jobbar inte då. Välj en vardag.`,
    };
  }

  const dayMissions = missions
    .filter((m) => m.id !== excludeId && m.responsible === candidate.responsible && m.date === candidate.date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const overlapping = dayMissions.find((m) =>
    timesOverlap(m.startTime, m.endTime, candidate.startTime, candidate.endTime)
  );
  if (overlapping) {
    return {
      ok: false,
      reason: 'overlap',
      message: `${candidate.responsible} är redan bokad ${overlapping.startTime}–${overlapping.endTime} på "${overlapping.title}" samma dag.`,
    };
  }

  const prev = [...dayMissions].reverse().find((m) => m.endTime <= candidate.startTime);
  const next = dayMissions.find((m) => m.startTime >= candidate.endTime);

  if (!prev && office) {
    const travel = await estimateTravel(office, candidate);
    const travelMinutes = travel.durationSeconds / 60;
    const earliestPossibleStart = toMinutes(WORKDAY_START) + travelMinutes;
    if (toMinutes(candidate.startTime) < earliestPossibleStart) {
      return {
        ok: false,
        reason: 'office-departure',
        message: `Hinner inte dit i tid – avfärd från kontoret tidigast ${WORKDAY_START}, och körtiden dit är ca ${minutesToLabel(travelMinutes)}.`,
      };
    }
  }

  if (prev) {
    const travel = await estimateTravel(prev, candidate);
    const travelMinutes = travel.durationSeconds / 60;
    const gapMinutes = toMinutes(candidate.startTime) - toMinutes(prev.endTime);
    const neededMinutes = travelMinutes + BUFFER_MINUTES;
    if (gapMinutes < neededMinutes) {
      return {
        ok: false,
        reason: 'travel-before',
        message: `För kort tid efter "${prev.title}" (slutar ${prev.endTime}) – körtiden dit är ca ${minutesToLabel(travelMinutes)}, endast ${minutesToLabel(gapMinutes)} tillgängligt.`,
      };
    }
  }

  if (next) {
    const travel = await estimateTravel(candidate, next);
    const travelMinutes = travel.durationSeconds / 60;
    const gapMinutes = toMinutes(next.startTime) - toMinutes(candidate.endTime);
    const neededMinutes = travelMinutes + BUFFER_MINUTES;
    if (gapMinutes < neededMinutes) {
      return {
        ok: false,
        reason: 'travel-after',
        message: `För kort tid innan "${next.title}" (börjar ${next.startTime}) – körtiden dit är ca ${minutesToLabel(travelMinutes)}, endast ${minutesToLabel(gapMinutes)} tillgängligt.`,
      };
    }
  }

  if (!next && office) {
    const travel = await estimateTravel(candidate, office);
    const travelMinutes = travel.durationSeconds / 60;
    const latestPossibleEnd = toMinutes(WORKDAY_END) - travelMinutes;
    if (toMinutes(candidate.endTime) > latestPossibleEnd) {
      return {
        ok: false,
        reason: 'office-return',
        message: `Hinner inte tillbaka till kontoret innan ${WORKDAY_END} – körtiden dit är ca ${minutesToLabel(travelMinutes)}.`,
      };
    }
  }

  return { ok: true };
}
