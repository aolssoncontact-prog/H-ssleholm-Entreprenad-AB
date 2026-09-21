import { timesOverlap } from './dateUtils.js';

// Hittar uppdrag där samma maskin är bokad på överlappande tider samma dag.
export function findMachineConflicts(missions) {
  const conflicts = new Set();
  const byMachine = {};

  for (const mission of missions) {
    for (const machineId of mission.machineIds || []) {
      if (!byMachine[machineId]) byMachine[machineId] = [];
      byMachine[machineId].push(mission);
    }
  }

  for (const machineMissions of Object.values(byMachine)) {
    for (let i = 0; i < machineMissions.length; i++) {
      for (let j = i + 1; j < machineMissions.length; j++) {
        const a = machineMissions[i];
        const b = machineMissions[j];
        if (a.date === b.date && timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) {
          conflicts.add(a.id);
          conflicts.add(b.id);
        }
      }
    }
  }

  return conflicts;
}

// Hittar uppdrag där samma ansvariga person är bokad på överlappande tider
// samma dag (en person kan inte vara på två platser samtidigt).
export function findPersonConflicts(missions) {
  const conflicts = new Set();
  const byPerson = {};

  for (const mission of missions) {
    if (!mission.responsible) continue;
    if (!byPerson[mission.responsible]) byPerson[mission.responsible] = [];
    byPerson[mission.responsible].push(mission);
  }

  for (const personMissions of Object.values(byPerson)) {
    for (let i = 0; i < personMissions.length; i++) {
      for (let j = i + 1; j < personMissions.length; j++) {
        const a = personMissions[i];
        const b = personMissions[j];
        if (a.date === b.date && timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) {
          conflicts.add(a.id);
          conflicts.add(b.id);
        }
      }
    }
  }

  return conflicts;
}

// Returnerar det uppdrag (om något) som gör att `candidate` skulle krocka
// tidsmässigt med ett redan bokat uppdrag för samma ansvariga person samma
// dag. `excludeId` utesluter uppdraget som eventuellt redigeras.
export function findOverlappingMissionForPerson(missions, candidate, excludeId) {
  return missions.find(
    (m) =>
      m.id !== excludeId &&
      m.responsible === candidate.responsible &&
      m.date === candidate.date &&
      timesOverlap(m.startTime, m.endTime, candidate.startTime, candidate.endTime)
  );
}
