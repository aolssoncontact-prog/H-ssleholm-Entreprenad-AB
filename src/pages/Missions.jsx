import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import MissionCard from '../components/Missions/MissionCard.jsx';
import MissionForm from '../components/Missions/MissionForm.jsx';
import Modal from '../components/common/Modal.jsx';
import { MISSION_TYPES, MISSION_STATUSES, USERS } from '../lib/constants.js';

export default function Missions() {
  const { missions, saveMission } = useApp();
  const navigate = useNavigate();

  const [typeFilter, setTypeFilter] = useState('Alla');
  const [statusFilter, setStatusFilter] = useState('Alla');
  const [responsibleFilter, setResponsibleFilter] = useState('Alla');
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    return missions
      .filter((m) => typeFilter === 'Alla' || m.type === typeFilter)
      .filter((m) => statusFilter === 'Alla' || m.status === statusFilter)
      .filter((m) => responsibleFilter === 'Alla' || m.responsible === responsibleFilter)
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  }, [missions, typeFilter, statusFilter, responsibleFilter]);

  async function handleCreate(form) {
    const mission = {
      ...form,
      id: `mission-${Date.now()}`,
      address: null,
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
        <h1>Uppdrag</h1>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Lägg till uppdrag
        </button>
      </div>

      <div className="filter-bar">
        <label className="filter-field">
          <span>Typ</span>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="Alla">Alla typer</option>
            {MISSION_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          <span>Status</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="Alla">Alla statusar</option>
            {MISSION_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          <span>Ansvarig</span>
          <select value={responsibleFilter} onChange={(e) => setResponsibleFilter(e.target.value)}>
            <option value="Alla">Alla</option>
            {USERS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="result-count">{filtered.length} uppdrag</p>

      {filtered.length === 0 ? (
        <p className="empty-hint">Inga uppdrag matchar filtren.</p>
      ) : (
        <div className="mission-list">
          {filtered.map((m) => (
            <MissionCard key={m.id} mission={m} />
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="Nytt uppdrag" onClose={() => setShowForm(false)}>
          <MissionForm
            onCancel={() => setShowForm(false)}
            onSubmit={handleCreate}
            submitLabel="Skapa uppdrag"
            missions={missions}
          />
        </Modal>
      )}
    </div>
  );
}
