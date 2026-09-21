import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { useApp } from '../context/AppContext.jsx';
import { missionIcon, machineIcon, officeIcon } from '../components/Map/icons.js';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { fetchOptimizedOrder, fetchDirections } from '../lib/ors.js';
import { formatDistance, formatDuration } from '../lib/geo.js';
import { todayIso } from '../lib/dateUtils.js';
import { MISSION_TYPE_ICONS, MISSION_TYPES, STATUS_COLORS, WORKDAY_START, WORKDAY_END } from '../lib/constants.js';

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lon]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, map]);
  return null;
}

export default function MapView() {
  const { office, missions, machines } = useApp();
  const navigate = useNavigate();

  const [date, setDate] = useState(todayIso());
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState('');
  const [routeInfo, setRouteInfo] = useState(null); // { geometry, distanceMeters, durationSeconds, order }

  const missionsForDate = useMemo(() => missions.filter((m) => m.date === date), [missions, date]);

  const allPoints = useMemo(() => {
    const pts = [];
    if (office) pts.push(office);
    missions.forEach((m) => pts.push({ lat: m.lat, lon: m.lon }));
    machines.forEach((m) => pts.push({ lat: m.lat, lon: m.lon }));
    return pts;
  }, [office, missions, machines]);

  useEffect(() => {
    setRouteInfo(null);
    setOptimizeError('');
  }, [date]);

  async function handleOptimize() {
    if (!office || missionsForDate.length === 0) return;
    setOptimizing(true);
    setOptimizeError('');
    try {
      const { order } = await fetchOptimizedOrder(office, missionsForDate, date, WORKDAY_START, WORKDAY_END);
      if (order.length === 0) throw new Error('Optimeringen returnerade ingen giltig rutt.');

      const orderedMissions = order.map((id) => missionsForDate.find((m) => m.id === id));
      const waypoints = [office, ...orderedMissions.map((m) => ({ lat: m.lat, lon: m.lon })), office];
      const directions = await fetchDirections(waypoints);

      setRouteInfo({
        geometry: directions.geometry,
        distanceMeters: directions.distanceMeters,
        durationSeconds: directions.durationSeconds,
        order: orderedMissions,
      });
    } catch (err) {
      setOptimizeError(err.message);
    } finally {
      setOptimizing(false);
    }
  }

  if (!office) return null;

  return (
    <div className="page page-map">
      <div className="page-header">
        <h1>Karta</h1>
        <div className="map-controls">
          <label className="filter-field">
            <span>Dag att optimera</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOptimize}
            disabled={optimizing || missionsForDate.length === 0}
          >
            {optimizing ? 'Optimerar…' : `Optimera dagsrutt (${missionsForDate.length})`}
          </button>
        </div>
      </div>

      {optimizeError && <div className="form-error">{optimizeError}</div>}

      {routeInfo && (
        <div className="route-summary">
          <strong>Optimerad rutt:</strong> {formatDistance(routeInfo.distanceMeters)} totalt · {formatDuration(routeInfo.durationSeconds)} körtid
          <ol className="route-order">
            {routeInfo.order.map((m, i) => (
              <li key={m.id}>{i + 1}. {m.title} ({m.startTime}–{m.endTime})</li>
            ))}
          </ol>
        </div>
      )}

      <div className="map-legend">
        {MISSION_TYPES.map((t) => (
          <span key={t} className="legend-item">{MISSION_TYPE_ICONS[t]} {t}</span>
        ))}
        <span className="legend-divider" />
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="legend-item">
            <span className="legend-dot" style={{ background: color }} /> {status}
          </span>
        ))}
      </div>

      <div className="map-container">
        <MapContainer center={[office.lat, office.lon]} zoom={9} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bidragsgivare'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={allPoints} />

          <Marker position={[office.lat, office.lon]} icon={officeIcon()}>
            <Popup>
              <strong>Kontor</strong>
              <br />
              {office.address}
            </Popup>
          </Marker>

          {missions.map((mission) => (
            <Marker
              key={mission.id}
              position={[mission.lat, mission.lon]}
              icon={missionIcon(mission)}
              eventHandlers={{ click: () => navigate(`/uppdrag/${mission.id}`) }}
            >
              <Popup>
                <strong>{mission.title}</strong>
                <br />
                {mission.type}
                <br />
                <StatusBadge status={mission.status} />
                <br />
                {mission.date}, {mission.startTime}–{mission.endTime}
                <br />
                Ansvarig: {mission.responsible}
              </Popup>
            </Marker>
          ))}

          {machines.map((machine) => (
            <Marker key={machine.id} position={[machine.lat, machine.lon]} icon={machineIcon(machine)}>
              <Popup>
                <strong>{machine.name}</strong>
                <br />
                {machine.locationLabel}
                <br />
                Status: {machine.status}
              </Popup>
            </Marker>
          ))}

          {routeInfo?.geometry && (
            <Polyline positions={routeInfo.geometry} pathOptions={{ color: '#1e3a5f', weight: 5, opacity: 0.85 }} />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
