import { MISSION_TYPE_ICONS, WORKDAY_START, WORKDAY_END } from '../../lib/constants.js';

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toPercent(hhmm, startMin, totalMin) {
  return Math.min(100, Math.max(0, ((toMinutes(hhmm) - startMin) / totalMin) * 100));
}

// Visuell dagslinje 07:00-17:00 för en person: visar redan bokade uppdrag
// och det uppdrag som just håller på att läggas till (grönt om det verkar
// gå att boka, rött om det krockar med något).
export default function PersonDayTimeline({ person, date, missions, excludeId, candidate }) {
  const startMin = toMinutes(WORKDAY_START);
  const totalMin = toMinutes(WORKDAY_END) - startMin;

  const dayMissions = missions
    .filter((m) => m.id !== excludeId && m.responsible === person && m.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const candidateValid = candidate && candidate.startTime && candidate.endTime && candidate.startTime < candidate.endTime;

  return (
    <div className="day-timeline">
      <div className="day-timeline-header">
        <span>{person || 'Välj ansvarig'} – {date || 'välj datum'}</span>
        <span>{WORKDAY_START}–{WORKDAY_END}</span>
      </div>
      <div className="day-timeline-track">
        {dayMissions.map((m) => (
          <div
            key={m.id}
            className="day-timeline-block"
            style={{
              left: `${toPercent(m.startTime, startMin, totalMin)}%`,
              width: `${Math.max(1.5, toPercent(m.endTime, startMin, totalMin) - toPercent(m.startTime, startMin, totalMin))}%`,
            }}
            title={`${m.title} (${m.startTime}–${m.endTime})`}
          >
            <span aria-hidden="true">{MISSION_TYPE_ICONS[m.type] || '📍'}</span>
          </div>
        ))}
        {candidateValid && (
          <div
            className={'day-timeline-candidate' + (candidate.status === 'blocked' ? ' blocked' : '') + (candidate.status === 'ok' ? ' ok' : '')}
            style={{
              left: `${toPercent(candidate.startTime, startMin, totalMin)}%`,
              width: `${Math.max(1.5, toPercent(candidate.endTime, startMin, totalMin) - toPercent(candidate.startTime, startMin, totalMin))}%`,
            }}
            title={`${candidate.startTime}–${candidate.endTime} (nytt uppdrag)`}
          />
        )}
      </div>
      {dayMissions.length === 0 && <p className="day-timeline-empty">Inga andra uppdrag bokade den här dagen.</p>}
    </div>
  );
}
