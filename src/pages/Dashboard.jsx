import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import MissionCard from '../components/Missions/MissionCard.jsx';
import { MACHINE_TYPE_ICONS } from '../lib/constants.js';
import { isToday, todayIso, formatDateLong } from '../lib/dateUtils.js';

export default function Dashboard() {
  const { missions, machines, currentUser } = useApp();

  const todaysMissions = missions
    .filter((m) => isToday(m.date))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const myMissions = todaysMissions.filter((m) => m.responsible === currentUser);

  const statusCounts = todaysMissions.reduce(
    (acc, m) => ({ ...acc, [m.status]: (acc[m.status] || 0) + 1 }),
    {}
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Översikt</h1>
          <p className="page-subtitle">{formatDateLong(todayIso())} · Hej {currentUser}!</p>
        </div>
        <Link to="/uppdrag" className="btn btn-primary">Alla uppdrag</Link>
      </div>

      <section className="stat-row">
        <div className="stat-card">
          <div className="stat-value">{todaysMissions.length}</div>
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

      <section className="page-section">
        <h2>Dagens uppdrag – {currentUser}</h2>
        {myMissions.length === 0 ? (
          <p className="empty-hint">Inga uppdrag tilldelade dig idag.</p>
        ) : (
          <div className="mission-list">
            {myMissions.map((m) => (
              <MissionCard key={m.id} mission={m} />
            ))}
          </div>
        )}
      </section>

      <section className="page-section">
        <h2>Alla uppdrag idag</h2>
        {todaysMissions.length === 0 ? (
          <p className="empty-hint">Inga uppdrag planerade idag.</p>
        ) : (
          <div className="mission-list">
            {todaysMissions.map((m) => (
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
