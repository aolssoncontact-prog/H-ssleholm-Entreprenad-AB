import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import MissionCard from '../components/Missions/MissionCard.jsx';
import PersonRouteSchedule from '../components/Dashboard/PersonRouteSchedule.jsx';
import DashboardRouteMap from '../components/Dashboard/DashboardRouteMap.jsx';
import MissionForm from '../components/Missions/MissionForm.jsx';
import Modal from '../components/common/Modal.jsx';
import { STATUS_COLORS, USERS } from '../lib/constants.js';
import { isToday, todayIso, formatDateLong } from '../lib/dateUtils.js';
import { findPersonConflicts } from '../lib/conflicts.js';

export default function Dashboard() {
  const { missions, office, personView, saveMission } = useApp();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

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

  async function handleCreate(form) {
    const mission = {
      ...form,
      id: `mission-${Date.now()}`,
      machineIds: [],
      files: [],
      createdAt: new Date().toISOString(),
    };
    await saveMission(mission);
    setShowForm(false);
    navigate(`/uppdrag/${mission.id}`);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Översikt</h1>
          <p className="page-subtitle">
            {formatDateLong(todayIso())} · {personView === 'Alla' ? 'Bertil & Ove' : `Vy: ${personView}`}
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Lägg till nytt uppdrag
        </button>
      </div>

      <section className="stat-row">
        <div className="stat-card">
          <div className="stat-value">{visibleMissions.length}</div>
          <div className="stat-label">Uppdrag idag</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': STATUS_COLORS['Pågående'] }}>
          <div className="stat-value stat-value-colored">{statusCounts['Pågående'] || 0}</div>
          <div className="stat-label">Pågående</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': STATUS_COLORS['Klart'] }}>
          <div className="stat-value stat-value-colored">{statusCounts['Klart'] || 0}</div>
          <div className="stat-label">Klara idag</div>
        </div>
      </section>

      {personConflicts.size > 0 && (
        <div className="form-error" style={{ marginTop: 16 }}>
          ⚠ Någon är dubbelbokad på överlappande tid idag – se{' '}
          <Link to="/planering">planeringen</Link> för detaljer.
        </div>
      )}

      <section className="page-section">
        <h2>Dagens körväg</h2>
        <DashboardRouteMap missions={todaysMissions} office={office} peopleToShow={peopleToShow} />
      </section>

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

      {showForm && (
        <Modal title="Nytt uppdrag" onClose={() => setShowForm(false)}>
          <MissionForm
            onCancel={() => setShowForm(false)}
            onSubmit={handleCreate}
            submitLabel="Skapa uppdrag"
            missions={missions}
            office={office}
            initial={personView === 'Alla' ? undefined : { responsible: personView }}
          />
        </Modal>
      )}
    </div>
  );
}
