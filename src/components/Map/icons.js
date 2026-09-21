import L from 'leaflet';
import { STATUS_COLORS, MISSION_TYPE_ICONS, MACHINE_TYPE_ICONS } from '../../lib/constants.js';

function divIcon(emoji, color, size = 34, order = null) {
  const badge = order != null ? `<span class="map-marker-order">${order}</span>` : '';
  return L.divIcon({
    className: 'map-marker',
    html: `<div class="map-marker-pin" style="--pin-color:${color}"><span>${emoji}</span></div>${badge}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

// `order` (1, 2, 3, …) visar i vilken ordning uppdragen ska köras till
// under dagen – t.ex. efter en optimerad rutt eller i schemalagd
// tidsordning. Utelämnas ordningen visas bara typ-ikonen som vanligt.
export function missionIcon(mission, order = null) {
  const emoji = MISSION_TYPE_ICONS[mission.type] || '📍';
  const color = STATUS_COLORS[mission.status] || '#64748b';
  return divIcon(emoji, color, 34, order);
}

export function machineIcon(machine) {
  const emoji = MACHINE_TYPE_ICONS[machine.type] || '🔧';
  return divIcon(emoji, '#475569', 30);
}

export function officeIcon() {
  return divIcon('🏢', '#1e3a5f', 36);
}
