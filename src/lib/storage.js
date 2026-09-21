// Repository-lager för all applikationsdata.
//
// I detta skede lagras allt i localStorage, men gränssnittet nedan
// (getMissions/saveMissions/... ) är medvetet skrivet som async-funktioner
// så att implementationen senare kan bytas mot t.ex. fetch-anrop mot en
// hostad databas/API utan att någon komponent i appen behöver ändras –
// bara innehållet i den här filen.

const KEYS = {
  missions: 'hea_missions_v2',
  machines: 'hea_machines_v2',
  personView: 'hea_person_view_v1',
  office: 'hea_office_location_v1',
  seeded: 'hea_seeded_v2',
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const repository = {
  async isSeeded() {
    return readJson(KEYS.seeded, false);
  },
  async markSeeded() {
    writeJson(KEYS.seeded, true);
  },

  async getMissions() {
    return readJson(KEYS.missions, []);
  },
  async saveMissions(missions) {
    writeJson(KEYS.missions, missions);
    return missions;
  },
  async saveMission(mission) {
    const missions = await this.getMissions();
    const idx = missions.findIndex((m) => m.id === mission.id);
    if (idx >= 0) missions[idx] = mission;
    else missions.push(mission);
    await this.saveMissions(missions);
    return mission;
  },
  async deleteMission(id) {
    const missions = await this.getMissions();
    await this.saveMissions(missions.filter((m) => m.id !== id));
  },

  async getMachines() {
    return readJson(KEYS.machines, []);
  },
  async saveMachines(machines) {
    writeJson(KEYS.machines, machines);
    return machines;
  },
  async saveMachine(machine) {
    const machines = await this.getMachines();
    const idx = machines.findIndex((m) => m.id === machine.id);
    if (idx >= 0) machines[idx] = machine;
    else machines.push(machine);
    await this.saveMachines(machines);
    return machine;
  },

  async getPersonView() {
    return readJson(KEYS.personView, null);
  },
  async setPersonView(view) {
    writeJson(KEYS.personView, view);
  },

  async getOfficeLocation() {
    return readJson(KEYS.office, null);
  },
  async setOfficeLocation(location) {
    writeJson(KEYS.office, location);
  },
};
