import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { repository } from '../lib/storage.js';
import { seedIfNeeded } from '../lib/seed.js';
import { ensureOfficeLocation } from '../lib/office.js';
import { USERS } from '../lib/constants.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [office, setOffice] = useState(null);
  const [missions, setMissions] = useState([]);
  const [machines, setMachines] = useState([]);
  const [currentUser, setCurrentUserState] = useState(USERS[0]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const officeLocation = await ensureOfficeLocation();
      if (cancelled) return;
      setOffice(officeLocation);

      await seedIfNeeded(repository, officeLocation);

      const [savedMissions, savedMachines, savedUser] = await Promise.all([
        repository.getMissions(),
        repository.getMachines(),
        repository.getCurrentUser(),
      ]);
      if (cancelled) return;
      setMissions(savedMissions);
      setMachines(savedMachines);
      setCurrentUserState(savedUser || USERS[0]);
      setLoading(false);
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrentUser = useCallback((user) => {
    setCurrentUserState(user);
    repository.setCurrentUser(user);
  }, []);

  const saveMission = useCallback(async (mission) => {
    const saved = await repository.saveMission(mission);
    setMissions((prev) => {
      const idx = prev.findIndex((m) => m.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    return saved;
  }, []);

  const deleteMission = useCallback(async (id) => {
    await repository.deleteMission(id);
    setMissions((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const saveMachine = useCallback(async (machine) => {
    const saved = await repository.saveMachine(machine);
    setMachines((prev) => {
      const idx = prev.findIndex((m) => m.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    return saved;
  }, []);

  const value = useMemo(
    () => ({
      loading,
      office,
      missions,
      machines,
      currentUser,
      setCurrentUser,
      saveMission,
      deleteMission,
      saveMachine,
    }),
    [loading, office, missions, machines, currentUser, setCurrentUser, saveMission, deleteMission, saveMachine]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp måste användas inom en AppProvider.');
  return ctx;
}
