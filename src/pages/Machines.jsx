import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { MACHINE_TYPE_ICONS } from '../lib/constants.js';
import { fetchDirections } from '../lib/ors.js';
import { formatDistance, formatDuration } from '../lib/geo.js';
import { formatDateShort } from '../lib/dateUtils.js';

export default function Machines() {
  const { machines, missions, office } = useApp();
  const [transport, setTransport] = useState({});

  const bookingsByMachine = useMemo(() => {
    const map = {};
    for (const machine of machines) map[machine.id] = [];
    for (const mission of missions) {
      for (const machineId of mission.machineIds || []) {
        if (map[machineId]) map[machineId].push(mission);
      }
    }
    for (const list of Object.values(map)) list.sort((a, b) => a.date.localeCompare(b.date));
    return map;
  }, [machines, missions]);

  async function computeReturnTrip(machine) {
    if (!office) return;
    setTransport((t) => ({ ...t, [machine.id]: { loading: true } }));
    try {
      const res = await fetchDirections([{ lat: machine.lat, lon: machine.lon }, office]);
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
        <h1>Maskiner &amp; resurser</h1>
      </div>

      <div className="machine-list">
        {machines.map((machine) => {
          const bookings = bookingsByMachine[machine.id] || [];
          const t = transport[machine.id];
          return (
            <div key={machine.id} className="card machine-card">
              <div className="machine-card-header">
                <span className="machine-card-icon" aria-hidden="true">{MACHINE_TYPE_ICONS[machine.type] || '🔧'}</span>
                <div>
                  <h3>{machine.name}</h3>
                  <span className={'machine-status-pill status-' + machine.status.toLowerCase().replace(/[^a-zåäö]/g, '')}>
                    {machine.status}
                  </span>
                </div>
              </div>

              <dl className="detail-list">
                <dt>Aktuell plats</dt>
                <dd>{machine.locationLabel}</dd>
                <dt>Koordinater</dt>
                <dd>{machine.lat.toFixed(5)}, {machine.lon.toFixed(5)}</dd>
              </dl>

              <div className="machine-transport">
                {t?.loading && 'Beräknar transportsträcka till kontoret…'}
                {t?.error && <span className="text-error">Fel: {t.error}</span>}
                {t?.distanceMeters != null && (
                  <span>Till kontoret: {formatDistance(t.distanceMeters)} · {formatDuration(t.durationSeconds)}</span>
                )}
                {!t && (
                  <button type="button" className="btn btn-ghost btn-small" onClick={() => computeReturnTrip(machine)}>
                    Beräkna transport till kontoret
                  </button>
                )}
              </div>

              <div className="machine-bookings">
                <h4>Bokningar</h4>
                {bookings.length === 0 ? (
                  <p className="empty-hint">Inga uppdrag bokade.</p>
                ) : (
                  <ul>
                    {bookings.map((m) => (
                      <li key={m.id}>
                        <Link to={`/uppdrag/${m.id}`}>
                          {formatDateShort(m.date)} · {m.startTime}–{m.endTime} · {m.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
