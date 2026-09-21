import { Fragment, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { missionIcon, officeIcon } from '../Map/icons.js';
import RouteArrows from '../Map/RouteArrows.jsx';
import MapAutoSize from '../Map/MapAutoSize.jsx';
import { fetchDirections } from '../../lib/ors.js';

const PERSON_COLORS = {
  Bertil: '#1e3a5f',
  Ove: '#7c3aed',
};

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lon]));
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [points, map]);
  return null;
}

// Kompakt karta för Översikten: visar dagens uppdrag och den körväg varje
// person tar (i den ordning uppdragen är schemalagda), med riktningspilar
// så man ser åt vilket håll man ska åka.
export default function DashboardRouteMap({ missions, office, peopleToShow }) {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState({});

  const byPerson = useMemo(() => {
    const map = {};
    for (const person of peopleToShow) {
      map[person] = missions
        .filter((m) => m.responsible === person)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [missions, peopleToShow]);

  const routeKey = peopleToShow.map((p) => `${p}:${byPerson[p].map((m) => m.id).join(',')}`).join('|');

  useEffect(() => {
    if (!office) return;
    let cancelled = false;
    setRoutes({});

    (async () => {
      const entries = await Promise.all(
        peopleToShow.map(async (person) => {
          const list = byPerson[person];
          if (list.length === 0) return [person, null];
          const waypoints = [office, ...list.map((m) => ({ lat: m.lat, lon: m.lon })), office];
          try {
            const res = await fetchDirections(waypoints);
            return [person, { geometry: res.geometry, estimated: false }];
          } catch {
            // Kunde inte hämta en riktig väg (t.ex. saknad ORS_API_KEY i
            // produktion) – rita en rak, streckad linje mellan stoppen
            // istället för att inte visa något alls.
            return [person, { geometry: waypoints.map((p) => [p.lat, p.lon]), estimated: true }];
          }
        })
      );
      if (!cancelled) setRoutes(Object.fromEntries(entries));
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey, office]);

  const allMissions = peopleToShow.flatMap((p) => byPerson[p]);
  const allPoints = office
    ? [office, ...allMissions.map((m) => ({ lat: m.lat, lon: m.lon }))]
    : allMissions.map((m) => ({ lat: m.lat, lon: m.lon }));

  // Ordningen uppdragen ska köras till under dagen – ett nummer per person
  // (räknat från deras schemalagda starttid), oberoende av de andras.
  const orderByMissionId = {};
  for (const person of peopleToShow) {
    byPerson[person].forEach((m, i) => {
      orderByMissionId[m.id] = i + 1;
    });
  }

  if (!office) return null;

  return (
    <div className="dashboard-map-wrap">
      <div className="map-container dashboard-map-container">
        <MapContainer center={[office.lat, office.lon]} zoom={9} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bidragsgivare'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={allPoints} />
          <MapAutoSize />

          <Marker position={[office.lat, office.lon]} icon={officeIcon()}>
            <Popup>
              <strong>Kontor</strong>
              <br />
              {office.address}
            </Popup>
          </Marker>

          {allMissions.map((mission) => (
            <Marker
              key={mission.id}
              position={[mission.lat, mission.lon]}
              icon={missionIcon(mission, orderByMissionId[mission.id] ?? null)}
              eventHandlers={{ click: () => navigate(`/uppdrag/${mission.id}`) }}
            >
              <Popup>
                <strong>{mission.title}</strong>
                <br />
                {mission.startTime}–{mission.endTime}
                <br />
                Ansvarig: {mission.responsible}
              </Popup>
            </Marker>
          ))}

          {peopleToShow.map((person) => {
            const route = routes[person];
            if (!route?.geometry) return null;
            const color = PERSON_COLORS[person] || '#1e3a5f';
            return (
              <Fragment key={person}>
                <Polyline
                  positions={route.geometry}
                  pathOptions={{ color, weight: 5, opacity: 0.8, dashArray: route.estimated ? '2 10' : null }}
                />
                <RouteArrows geometry={route.geometry} color={color} count={route.estimated ? 1 : 5} />
              </Fragment>
            );
          })}
        </MapContainer>
      </div>

      {(peopleToShow.length > 1 || Object.values(routes).some((r) => r?.estimated)) && (
        <div className="map-legend">
          {peopleToShow.length > 1 &&
            peopleToShow.map((person) => (
              <span key={person} className="legend-item">
                <span className="legend-dot" style={{ background: PERSON_COLORS[person] || '#1e3a5f' }} /> {person}s rutt
              </span>
            ))}
          {Object.values(routes).some((r) => r?.estimated) && (
            <span className="legend-item text-error">
              ⚠ Prickad linje = fågelvägen (kunde inte hämta verklig körväg)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
