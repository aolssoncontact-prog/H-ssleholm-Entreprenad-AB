import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { MACHINE_TYPE_ICONS } from '../lib/constants.js';
import { findMachineConflicts, findPersonConflicts } from '../lib/conflicts.js';
import { addDays, formatDateLong, formatDateShort, startOfWeek, toIso, todayIso, weekdayName } from '../lib/dateUtils.js';

function DayColumn({ date, missions, machines, machineConflicts, personConflicts, highlight }) {
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
          {dayMissions.map((mission) => {
            const hasMachineConflict = machineConflicts.has(mission.id);
            const hasPersonConflict = personConflicts.has(mission.id);
            return (
              <Link
                key={mission.id}
                to={`/uppdrag/${mission.id}`}
                className={'schedule-mission' + (hasMachineConflict || hasPersonConflict ? ' schedule-conflict' : '')}
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
                {hasPersonConflict && (
                  <div className="schedule-conflict-warning">⚠ {mission.responsible} är dubbelbokad – överlappande tid</div>
                )}
                {hasMachineConflict && (
                  <div className="schedule-conflict-warning">⚠ Maskinkrock – dubbelbokad tid</div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Schedule() {
  const { missions, machines, personView } = useApp();
  const [mode, setMode] = useState('week');
  const [refDate, setRefDate] = useState(todayIso());

  const visibleMissions = useMemo(
    () => (personView === 'Alla' ? missions : missions.filter((m) => m.responsible === personView)),
    [missions, personView]
  );

  // Krockar räknas ut på alla uppdrag (en persons dubbelbokning berör bara
  // den personen, men en maskinkrock kan involvera någon som är dold av
  // personfiltret – varningen är ändå korrekt för de uppdrag som visas).
  const machineConflicts = useMemo(() => findMachineConflicts(missions), [missions]);
  const personConflicts = useMemo(() => findPersonConflicts(missions), [missions]);

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
        <div>
          <h1>Planering &amp; schema</h1>
          <p className="page-subtitle">{personView === 'Alla' ? 'Bertil & Ove' : `Vy: ${personView}`}</p>
        </div>
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

      {(personConflicts.size > 0 || machineConflicts.size > 0) && (
        <div className="form-error">
          {personConflicts.size > 0 && <div>⚠ {personConflicts.size} uppdrag har en person dubbelbokad på överlappande tid.</div>}
          {machineConflicts.size > 0 && <div>⚠ {machineConflicts.size} uppdrag har krockande maskinbokningar denna period.</div>}
        </div>
      )}

      {mode === 'day' ? (
        <>
          <h2 className="schedule-single-day-title">{formatDateLong(refDate)}</h2>
          <div className="schedule-grid schedule-grid-day">
            <DayColumn
              date={refDate}
              missions={visibleMissions}
              machines={machines}
              machineConflicts={machineConflicts}
              personConflicts={personConflicts}
              highlight={refDate === todayIso()}
            />
          </div>
        </>
      ) : (
        <div className="schedule-grid schedule-grid-week">
          {weekDays.map((date) => (
            <DayColumn
              key={date}
              date={date}
              missions={visibleMissions}
              machines={machines}
              machineConflicts={machineConflicts}
              personConflicts={personConflicts}
              highlight={date === todayIso()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
