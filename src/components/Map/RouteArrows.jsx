import { Marker } from 'react-leaflet';
import L from 'leaflet';

function bearing([lat1, lon1], [lat2, lon2]) {
  const toRad = (d) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function arrowIcon(angle, color) {
  return L.divIcon({
    className: 'route-arrow-icon',
    html: `<div class="route-arrow" style="transform: rotate(${angle}deg); --arrow-color:${color}">▲</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

// Ritar ut riktningspilar längs en ruttgeometri ([lat, lon]-punkter) så att
// man ser åt vilket håll man ska köra. `count` styr ungefär hur många pilar
// som placeras ut jämnt fördelat längs rutten.
export default function RouteArrows({ geometry, color = '#1e3a5f', count = 6 }) {
  if (!geometry || geometry.length < 2) return null;

  const step = Math.max(1, Math.floor(geometry.length / (count + 1)));
  const arrows = [];
  for (let i = step; i < geometry.length - 1; i += step) {
    const angle = bearing(geometry[i - 1] || geometry[i], geometry[i + 1] || geometry[i]);
    arrows.push({ pos: geometry[i], angle, key: i });
  }

  return (
    <>
      {arrows.map((a) => (
        <Marker key={a.key} position={a.pos} icon={arrowIcon(a.angle, color)} interactive={false} />
      ))}
    </>
  );
}
