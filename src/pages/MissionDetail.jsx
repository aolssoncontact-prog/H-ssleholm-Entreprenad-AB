import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import MissionForm from '../components/Missions/MissionForm.jsx';
import Modal from '../components/common/Modal.jsx';
import FileUpload from '../components/common/FileUpload.jsx';
import { fetchDirections, reverseGeocode } from '../lib/ors.js';
import { formatDistance, formatDuration, haversineMeters } from '../lib/geo.js';
import { formatDateLong } from '../lib/dateUtils.js';
import { MISSION_TYPE_ICONS, MACHINE_TYPE_ICONS } from '../lib/constants.js';

export default function MissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { missions, machines, office, saveMission, deleteMission, saveMachine } = useApp();

  const mission = missions.find((m) => m.id === id);

  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(mission?.notes || '');
  const [route, setRoute] = useState({ loading: false, error: '', distanceMeters: null, durationSeconds: null });
  const [address, setAddress] = useState(mission?.address || null);
  const [transport, setTransport] = useState({}); // machineId -> { loading, distanceMeters, durationSeconds, error }

  useEffect(() => {
    setNotes(mission?.notes || '');
    setAddress(mission?.address || null);
  }, [mission?.id]);

  useEffect(() => {
    if (!mission || !office) return;
    let cancelled = false;
    setRoute((r) => ({ ...r, loading: true, error: '' }));
    fetchDirections([office, { lat: mission.lat, lon: mission.lon }])
      .then((res) => {
        if (cancelled) return;
        setRoute({ loading: false, error: '', distanceMeters: res.distanceMeters, durationSeconds: res.durationSeconds });
      })
      .catch((err) => {
        if (cancelled) return;
        setRoute({ loading: false, error: err.message, distanceMeters: null, durationSeconds: null });
      });
    return () => {
      cancelled = true;
    };
  }, [mission?.id, mission?.lat, mission?.lon, office]);

  useEffect(() => {
    if (!mission || mission.address) return;
    let cancelled = false;
    reverseGeocode(mission.lat, mission.lon)
      .then((label) => {
        if (cancelled || !label) return;
        setAddress(label);
        saveMission({ ...mission, address: label });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission?.id]);

  const neededMachines = useMemo(
    () => machines.filter((m) => (mission?.machineIds || []).includes(m.id)),
    [machines, mission?.machineIds]
  );
  const otherMachines = useMemo(
    () => machines.filter((m) => !(mission?.machineIds || []).includes(m.id)),
    [machines, mission?.machineIds]
  );

  if (!mission) {
    return (
      <div className="page">
        <p className="empty-hint">Uppdraget hittades inte.</p>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/uppdrag')}>
          Till uppdragslistan
        </button>
      </div>
    );
  }

  async function handleUpdate(form) {
    await saveMission({ ...mission, ...form });
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(`Ta bort uppdraget "${mission.title}"?`)) return;
    await deleteMission(mission.id);
    navigate('/uppdrag');
  }

  async function handleNotesBlur() {
    if (notes !== mission.notes) {
      await saveMission({ ...mission, notes });
    }
  }

  async function handleFilesChange(files) {
    await saveMission({ ...mission, files });
  }

  async function toggleMachine(machine) {
    const isAssigned = (mission.machineIds || []).includes(machine.id);
    const machineIds = isAssigned
      ? mission.machineIds.filter((mid) => mid !== machine.id)
      : [...(mission.machineIds || []), machine.id];
    await saveMission({ ...mission, machineIds });

    if (!isAssigned) {
      await saveMachine({ ...machine, assignedMissionId: mission.id, status: 'Under transport' });
    } else if (machine.assignedMissionId === mission.id) {
      await saveMachine({ ...machine, assignedMissionId: null, status: 'Tillgänglig' });
    }
  }

  async function computeTransport(machine) {
    setTransport((t) => ({ ...t, [machine.id]: { loading: true } }));
    try {
      const res = await fetchDirections([{ lat: machine.lat, lon: machine.lon }, { lat: mission.lat, lon: mission.lon }]);
      setTransport((t) => ({
        ...t,
        [machine.id]: { loading: false, distanceMeters: res.distanceMeters, durationSeconds: res.durationSeconds },
      }));
    } catch (err) {
      setTransport((t) => ({ ...t, [machine.id]: { loading: false, error: err.message } }));
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="mission-detail-title">
          <span className="mission-detail-icon" aria-hidden="true">{MISSION_TYPE_ICONS[mission.type] || '📍'}</span>
          <div>
            <h1>{mission.title}</h1>
            <div className="mission-detail-meta">
              <StatusBadge status={mission.status} />
              <span>{mission.type}</span>
            </div>
          </div>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>Redigera</button>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>Ta bort</button>
        </div>
      </div>

      <div className="detail-grid">
        <section className="card">
          <h2>Platsinformation</h2>
          <dl className="detail-list">
            <dt>Koordinater</dt>
            <dd>{mission.lat.toFixed(6)}, {mission.lon.toFixed(6)}</dd>
            <dt>Adress</dt>
            <dd>{address || 'Hämtar adress…'}</dd>
            <dt>Från kontoret</dt>
            <dd>
              {route.loading && 'Beräknar körsträcka…'}
              {route.error && <span className="text-error">Kunde inte hämta rutt: {route.error}</span>}
              {!route.loading && !route.error && route.distanceMeters != null && (
                <>{formatDistance(route.distanceMeters)} · {formatDuration(route.durationSeconds)} körtid</>
              )}
            </dd>
          </dl>
        </section>

        <section className="card">
          <h2>Beskrivning</h2>
          <p className="mission-description">{mission.description || 'Ingen beskrivning tillagd.'}</p>
        </section>

        <section className="card">
          <h2>Tidsplanering</h2>
          <dl className="detail-list">
            <dt>Datum</dt>
            <dd>{formatDateLong(mission.date)}</dd>
            <dt>Tid</dt>
            <dd>{mission.startTime} – {mission.endTime}</dd>
            <dt>Ansvarig</dt>
            <dd>{mission.responsible}</dd>
          </dl>
        </section>

        <section className="card card-wide">
          <h2>Resurser &amp; transportplanering</h2>
          {neededMachines.length === 0 ? (
            <p className="empty-hint">Inga maskiner tilldelade uppdraget ännu.</p>
          ) : (
            <ul className="resource-list">
              {neededMachines.map((machine) => {
                const t = transport[machine.id];
                const quickDistance = haversineMeters(
                  { lat: machine.lat, lon: machine.lon },
                  { lat: mission.lat, lon: mission.lon }
                );
                return (
                  <li key={machine.id} className="resource-item">
                    <span className="machine-mini-icon" aria-hidden="true">{MACHINE_TYPE_ICONS[machine.type] || '🔧'}</span>
                    <div className="resource-item-body">
                      <div className="resource-item-name">{machine.name}</div>
                      <div className="resource-item-location">Nu: {machine.locationLabel}</div>
                      <div className="resource-item-location">
                        {t?.loading && 'Beräknar transportsträcka…'}
                        {t?.error && <span className="text-error">Fel: {t.error}</span>}
                        {t?.distanceMeters != null && (
                          <>Transport: {formatDistance(t.distanceMeters)} · {formatDuration(t.durationSeconds)}</>
                        )}
                        {!t && `Fågelvägen ca ${formatDistance(quickDistance)}`}
                      </div>
                    </div>
                    <div className="resource-item-actions">
                      {!t?.distanceMeters && (
                        <button type="button" className="btn btn-ghost btn-small" onClick={() => computeTransport(machine)}>
                          Beräkna körväg
                        </button>
                      )}
                      <button type="button" className="btn btn-ghost btn-small" onClick={() => toggleMachine(machine)}>
                        Ta bort
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <details className="add-resource">
            <summary>+ Lägg till maskin</summary>
            <ul className="resource-list">
              {otherMachines.map((machine) => (
                <li key={machine.id} className="resource-item">
                  <span className="machine-mini-icon" aria-hidden="true">{MACHINE_TYPE_ICONS[machine.type] || '🔧'}</span>
                  <div className="resource-item-body">
                    <div className="resource-item-name">{machine.name}</div>
                    <div className="resource-item-location">Nu: {machine.locationLabel}</div>
                  </div>
                  <button type="button" className="btn btn-secondary btn-small" onClick={() => toggleMachine(machine)}>
                    Tilldela
                  </button>
                </li>
              ))}
            </ul>
          </details>
        </section>

        <section className="card card-wide">
          <h2>Noteringar</h2>
          <textarea
            className="notes-textarea"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Fritext för personal och uppföljning…"
          />
        </section>

        <section className="card card-wide">
          <h2>Dokumentation</h2>
          <FileUpload files={mission.files || []} onChange={handleFilesChange} />
        </section>
      </div>

      {editing && (
        <Modal title="Redigera uppdrag" onClose={() => setEditing(false)}>
          <MissionForm
            initial={mission}
            onCancel={() => setEditing(false)}
            onSubmit={handleUpdate}
            submitLabel="Spara ändringar"
            missions={missions}
            excludeId={mission.id}
            office={office}
          />
        </Modal>
      )}
    </div>
  );
}
