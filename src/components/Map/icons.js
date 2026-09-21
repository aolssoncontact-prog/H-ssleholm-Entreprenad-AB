import L from 'leaflet';
import { STATUS_COLORS, MISSION_TYPE_ICONS, MACHINE_TYPE_ICONS } from '../../lib/constants.js';

function divIcon(emoji, color, size = 34) {
  return L.divIcon({
    className: 'map-marker',
    html: `<div class="map-marker-pin" style="--pin-color:${color}"><span>${emoji}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

export function missionIcon(mission) {
  const emoji = MISSION_TYPE_ICONS[mission.type] || '📍';
  const color = STATUS_COLORS[mission.status] || '#64748b';
  return divIcon(emoji, color);
}

export function machineIcon(machine) {
  const emoji = MACHINE_TYPE_ICONS[machine.type] || '🔧';
  return divIcon(emoji, '#475569', 30);
}

export function officeIcon() {
  return divIcon('🏢', '#1e3a5f', 36);
}
