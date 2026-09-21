import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge.jsx';
import { MISSION_TYPE_ICONS } from '../../lib/constants.js';
import { formatDateShort } from '../../lib/dateUtils.js';

export default function MissionCard({ mission }) {
  return (
    <Link to={`/uppdrag/${mission.id}`} className="mission-card">
      <div className="mission-card-icon" aria-hidden="true">
        {MISSION_TYPE_ICONS[mission.type] || '📍'}
      </div>
      <div className="mission-card-body">
        <div className="mission-card-title-row">
          <h3>{mission.title}</h3>
          <StatusBadge status={mission.status} />
        </div>
        <div className="mission-card-meta">
          <span>{mission.type}</span>
          <span>·</span>
          <span>{formatDateShort(mission.date)}, {mission.startTime}–{mission.endTime}</span>
        </div>
        <div className="mission-card-meta">
          <span>Ansvarig: {mission.responsible}</span>
        </div>
      </div>
    </Link>
  );
}
