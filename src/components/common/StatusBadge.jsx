import { STATUS_COLORS } from '../../lib/constants.js';

export default function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || '#64748b';
  return (
    <span className="status-badge" style={{ '--status-color': color }}>
      <span className="status-dot" />
      {status}
    </span>
  );
}
