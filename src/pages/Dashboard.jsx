import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import MissionCard from '../components/Missions/MissionCard.jsx';
import PersonRouteSchedule from '../components/Dashboard/PersonRouteSchedule.jsx';
import { MACHINE_TYPE_ICONS, USERS } from '../lib/constants.js';
import { isToday, todayIso, formatDateLong } from '../lib/dateUtils.js';
import { findPersonConflicts } from '../lib/conflicts.js';

export default function Dashboard() {
  const { missions, machines, office, personView } = useApp();

  const todaysMissions = missions
    .filter((m) => isToday(m.date))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const visibleMissions =
    personView === 'Alla' ? todaysMissions : todaysMissions.filter((m) => m.responsible === personView);

  const peopleToShow = personView === 'Alla' ? USERS : [personView];

  const statusCounts = visibleMissions.reduce(
    (acc, m) => ({ ...acc, [m.status]: (acc[m.status] || 0) + 1 }),
    {}
  );

  const personConflicts = findPersonConflicts(todaysMissions);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Översikt</h1>
          <p className="page-subtitle">
            {formatDateLong(todayIso())} · {personView === 'Alla' ? 'Bertil & Ove' : `Vy: ${personView}`}
          </p>
        </div>
        <Link to="/uppdrag" className="btn btn-primary">Alla uppdrag</Link>
      </div>

      <section className="stat-row">
        <div className="stat-card">
          <div className="stat-value">{visibleMissions.length}</div>
          <div className="stat-label">Uppdrag idag</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{statusCounts['Pågående'] || 0}</div>
          <div className="stat-label">Pågående</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{statusCounts['Klart'] || 0}</div>
          <div className="stat-label">Klara idag</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{machines.filter((m) => m.status === 'Tillgänglig').length}</div>
          <div className="stat-label">Lediga maskiner</div>
        </div>
      </section>

      {personConflicts.size > 0 && (
        <div className="form-error" style={{ marginTop: 16 }}>
          ⚠ Någon är dubbelbokad på överlappande tid idag – se{' '}
          <Link to="/planering">planeringen</Link> för detaljer.
        </div>
      )}

      <section className="page-section">
        <h2>Rutt-schema – var, när och hur</h2>
        <div className={'route-schedule-grid' + (peopleToShow.length === 1 ? ' route-schedule-single' : '')}>
          {peopleToShow.map((person) => (
            <PersonRouteSchedule key={person} person={person} missions={todaysMissions} office={office} />
          ))}
        </div>
      </section>

      <section className="page-section">
        <h2>Dagens uppdrag</h2>
        {visibleMissions.length === 0 ? (
          <p className="empty-hint">Inga uppdrag planerade idag.</p>
        ) : (
          <div className="mission-list">
            {visibleMissions.map((m) => (
              <MissionCard key={m.id} mission={m} />
            ))}
          </div>
        )}
      </section>

      <section className="page-section">
        <h2>Var maskinerna står</h2>
        <div className="machine-grid">
          {machines.map((machine) => (
            <div key={machine.id} className="machine-mini-card">
              <span className="machine-mini-icon" aria-hidden="true">
                {MACHINE_TYPE_ICONS[machine.type] || '🔧'}
              </span>
              <div>
                <div className="machine-mini-name">{machine.name}</div>
                <div className="machine-mini-location">{machine.locationLabel}</div>
              </div>
              <span className={'machine-status-pill status-' + machine.status.toLowerCase().replace(/[^a-zåäö]/g, '')}>
                {machine.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
