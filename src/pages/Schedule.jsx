import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { MACHINE_TYPE_ICONS } from '../lib/constants.js';
import { addDays, formatDateLong, formatDateShort, startOfWeek, timesOverlap, toIso, todayIso, weekdayName } from '../lib/dateUtils.js';

function findConflicts(missions) {
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

function DayColumn({ date, missions, machines, conflicts, highlight }) {
  const dayMissions = missions
    .filter((m) => m.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className={'schedule-day' + (highlight ? ' schedule-day-today' : '')}>
      <div className="schedule-day-header">
        <div className="schedule-day-name">{weekdayName(date)}</div>
        <div className="schedule-day-date">{formatDateShort(date)}</div>
      </div>
      {dayMissions.length === 0 ? (
        <p className="empty-hint">Inga uppdrag.</p>
      ) : (
        <div className="schedule-mission-list">
          {dayMissions.map((mission) => (
            <Link
              key={mission.id}
              to={`/uppdrag/${mission.id}`}
              className={'schedule-mission' + (conflicts.has(mission.id) ? ' schedule-conflict' : '')}
            >
              <div className="schedule-mission-time">{mission.startTime}–{mission.endTime}</div>
              <div className="schedule-mission-title">{mission.title}</div>
              <div className="schedule-mission-meta">
                <StatusBadge status={mission.status} />
                <span>{mission.responsible}</span>
              </div>
              {(mission.machineIds || []).length > 0 && (
                <div className="schedule-mission-machines">
                  {mission.machineIds.map((id) => {
                    const machine = machines.find((m) => m.id === id);
                    if (!machine) return null;
                    return (
                      <span key={id} className="schedule-machine-chip">
                        {MACHINE_TYPE_ICONS[machine.type]} {machine.name}
                      </span>
                    );
                  })}
                </div>
              )}
              {conflicts.has(mission.id) && (
                <div className="schedule-conflict-warning">⚠ Maskinkrock – dubbelbokad tid</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Schedule() {
  const { missions, machines } = useApp();
  const [mode, setMode] = useState('week');
  const [refDate, setRefDate] = useState(todayIso());

  const conflicts = useMemo(() => findConflicts(missions), [missions]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(`${refDate}T00:00:00`));
    return Array.from({ length: 7 }, (_, i) => toIso(addDays(start, i)));
  }, [refDate]);

  function shift(days) {
    const step = mode === 'week' ? days * 7 : days;
    setRefDate(toIso(addDays(new Date(`${refDate}T00:00:00`), step)));
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Planering &amp; schema</h1>
        <div className="schedule-controls">
          <div className="view-toggle">
            <button type="button" className={mode === 'day' ? 'active' : ''} onClick={() => setMode('day')}>Dag</button>
            <button type="button" className={mode === 'week' ? 'active' : ''} onClick={() => setMode('week')}>Vecka</button>
          </div>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => shift(-1)}>← Föregående</button>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setRefDate(todayIso())}>Idag</button>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => shift(1)}>Nästa →</button>
        </div>
      </div>

      {conflicts.size > 0 && (
        <div className="form-error">
          ⚠ {conflicts.size} uppdrag har krockande maskinbokningar denna period – se markerade kort nedan.
        </div>
      )}

      {mode === 'day' ? (
        <>
          <h2 className="schedule-single-day-title">{formatDateLong(refDate)}</h2>
          <div className="schedule-grid schedule-grid-day">
            <DayColumn date={refDate} missions={missions} machines={machines} conflicts={conflicts} highlight={refDate === todayIso()} />
          </div>
        </>
      ) : (
        <div className="schedule-grid schedule-grid-week">
          {weekDays.map((date) => (
            <DayColumn
              key={date}
              date={date}
              missions={missions}
              machines={machines}
              conflicts={conflicts}
              highlight={date === todayIso()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
