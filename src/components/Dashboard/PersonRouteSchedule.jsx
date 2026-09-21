import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDirections } from '../../lib/ors.js';
import { formatDistance, formatDuration } from '../../lib/geo.js';
import { MISSION_TYPE_ICONS, WORKDAY_END } from '../../lib/constants.js';
import StatusBadge from '../common/StatusBadge.jsx';

function minutesSinceMidnight(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function addMinutesToTime(hhmm, minutes) {
  const total = minutesSinceMidnight(hhmm) + minutes;
  const h = Math.floor(total / 60) % 24;
  const m = Math.round(total % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Beräknar restid/sträcka för varje etapp i personens dagsrutt:
// kontor -> uppdrag 1 -> uppdrag 2 -> ... -> kontor.
// Flaggar etapper där tiden mellan två uppdrag är kortare än beräknad körtid.
export default function PersonRouteSchedule({ person, missions, office }) {
  const dayMissions = useMemo(
    () => missions.filter((m) => m.responsible === person).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [missions, person]
  );

  const stopKey = dayMissions.map((m) => m.id).join(',');
  const [legs, setLegs] = useState([]);

  useEffect(() => {
    if (dayMissions.length === 0 || !office) {
      setLegs([]);
      return;
    }
    let cancelled = false;

    const points = [office, ...dayMissions.map((m) => ({ lat: m.lat, lon: m.lon })), office];
    const pairs = [];
    for (let i = 0; i < points.length - 1; i++) pairs.push([points[i], points[i + 1]]);

    setLegs(pairs.map(() => ({ loading: true })));

    Promise.all(
      pairs.map(([from, to]) =>
        fetchDirections([from, to])
          .then((res) => ({ loading: false, distanceMeters: res.distanceMeters, durationSeconds: res.durationSeconds }))
          .catch((err) => ({ loading: false, error: err.message }))
      )
    ).then((results) => {
      if (!cancelled) setLegs(results);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopKey, office]);

  if (dayMissions.length === 0) {
    return (
      <div className="route-card">
        <h3>{person}</h3>
        <p className="empty-hint">Inga uppdrag planerade idag – ledig kapacitet.</p>
      </div>
    );
  }

  const lastMission = dayMissions[dayMissions.length - 1];
  const lastLeg = legs[legs.length - 1];
  const estimatedReturn =
    lastLeg && !lastLeg.loading && !lastLeg.error
      ? addMinutesToTime(lastMission.endTime, Math.round(lastLeg.durationSeconds / 60))
      : null;
  const lateReturn = estimatedReturn && estimatedReturn > WORKDAY_END;

  return (
    <div className="route-card">
      <h3>{person} <span className="route-card-count">({dayMissions.length} uppdrag)</span></h3>

      <ol className="route-timeline">
        <li className="route-stop route-stop-office">
          <span className="route-stop-icon" aria-hidden="true">🏢</span>
          <div className="route-stop-body">
            <div className="route-stop-title">Kontoret – avfärd</div>
          </div>
        </li>

        {dayMissions.map((mission, i) => {
          const leg = legs[i];
          const nextLeg = legs[i + 1];
          const nextMission = dayMissions[i + 1];

          let gapWarning = null;
          if (nextMission && leg && !leg.loading) {
            const gapMinutes = minutesSinceMidnight(nextMission.startTime) - minutesSinceMidnight(mission.endTime);
            const travelMinutes = nextLeg && !nextLeg.loading && !nextLeg.error ? Math.round(nextLeg.durationSeconds / 60) : null;
            if (travelMinutes != null && gapMinutes < travelMinutes) {
              gapWarning = `⚠ Endast ${gapMinutes} min mellan uppdragen – körtid beräknas till ${travelMinutes} min.`;
            }
          }

          return (
            <li key={mission.id}>
              <div className="route-leg">
                {leg?.loading && <span className="route-leg-text">Beräknar körsträcka…</span>}
                {leg?.error && <span className="route-leg-text text-error">Kunde inte hämta rutt</span>}
                {leg && !leg.loading && !leg.error && (
                  <span className="route-leg-text">
                    ↓ {formatDuration(leg.durationSeconds)} · {formatDistance(leg.distanceMeters)}
                  </span>
                )}
              </div>
              <Link to={`/uppdrag/${mission.id}`} className="route-stop">
                <span className="route-stop-icon" aria-hidden="true">{MISSION_TYPE_ICONS[mission.type] || '📍'}</span>
                <div className="route-stop-body">
                  <div className="route-stop-time">{mission.startTime}–{mission.endTime}</div>
                  <div className="route-stop-title">{mission.title}</div>
                  <div className="route-stop-meta">
                    <StatusBadge status={mission.status} />
                    <span>{mission.type}</span>
                  </div>
                  {gapWarning && <div className="schedule-conflict-warning">{gapWarning}</div>}
                </div>
              </Link>
            </li>
          );
        })}

        <li>
          <div className="route-leg">
            {lastLeg?.loading && <span className="route-leg-text">Beräknar körsträcka…</span>}
            {lastLeg?.error && <span className="route-leg-text text-error">Kunde inte hämta rutt</span>}
            {lastLeg && !lastLeg.loading && !lastLeg.error && (
              <span className="route-leg-text">
                ↓ {formatDuration(lastLeg.durationSeconds)} · {formatDistance(lastLeg.distanceMeters)}
              </span>
            )}
          </div>
          <div className="route-stop route-stop-office">
            <span className="route-stop-icon" aria-hidden="true">🏢</span>
            <div className="route-stop-body">
              <div className="route-stop-title">
                Kontoret – beräknad ankomst {estimatedReturn ? `ca ${estimatedReturn}` : ''}
              </div>
              {lateReturn && (
                <div className="schedule-conflict-warning">⚠ Beräknas komma tillbaka efter {WORKDAY_END}.</div>
              )}
            </div>
          </div>
        </li>
      </ol>
    </div>
  );
}
