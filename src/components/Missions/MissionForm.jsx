import { useState } from 'react';
import { MISSION_TYPES, MISSION_STATUSES, USERS, WORKDAY_START, WORKDAY_END } from '../../lib/constants.js';
import { findOverlappingMissionForPerson } from '../../lib/conflicts.js';

const EMPTY = {
  title: '',
  type: MISSION_TYPES[0],
  description: '',
  lat: '',
  lon: '',
  status: 'Planerat',
  responsible: USERS[0],
  date: new Date().toISOString().slice(0, 10),
  startTime: WORKDAY_START,
  endTime: WORKDAY_END,
  notes: '',
};

export default function MissionForm({ initial, onCancel, onSubmit, submitLabel = 'Spara', missions = [], excludeId = null }) {
  const [form, setForm] = useState(() => ({ ...EMPTY, ...initial }));
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) return setError('Titel måste anges.');
    const lat = Number(form.lat);
    const lon = Number(form.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return setError('Ange giltiga koordinater (lat, lon).');
    if (form.startTime >= form.endTime) return setError('Sluttid måste vara efter starttid.');

    const clash = findOverlappingMissionForPerson(missions, form, excludeId);
    if (clash) {
      return setError(
        `${form.responsible} är redan bokad ${clash.startTime}–${clash.endTime} på "${clash.title}" samma dag. Ändra tid, dag eller ansvarig.`
      );
    }

    onSubmit({ ...form, lat, lon });
  }

  return (
    <form className="mission-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <label className="form-field">
        <span>Titel</span>
        <input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="T.ex. Schaktarbete Storgatan 4" />
      </label>

      <div className="form-row">
        <label className="form-field">
          <span>Typ av uppdrag</span>
          <select value={form.type} onChange={(e) => update('type', e.target.value)}>
            {MISSION_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Status</span>
          <select value={form.status} onChange={(e) => update('status', e.target.value)}>
            {MISSION_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="form-field">
        <span>Beskrivning</span>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Vad ska göras på plats?"
        />
      </label>

      <div className="form-row">
        <label className="form-field">
          <span>Latitud</span>
          <input
            type="number"
            step="any"
            value={form.lat}
            onChange={(e) => update('lat', e.target.value)}
            placeholder="56.0596"
          />
        </label>
        <label className="form-field">
          <span>Longitud</span>
          <input
            type="number"
            step="any"
            value={form.lon}
            onChange={(e) => update('lon', e.target.value)}
            placeholder="13.7668"
          />
        </label>
      </div>

      <div className="form-row">
        <label className="form-field">
          <span>Ansvarig</span>
          <select value={form.responsible} onChange={(e) => update('responsible', e.target.value)}>
            {USERS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Datum</span>
          <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} />
        </label>
      </div>

      <div className="form-row">
        <label className="form-field">
          <span>Starttid</span>
          <input
            type="time"
            min={WORKDAY_START}
            max={WORKDAY_END}
            value={form.startTime}
            onChange={(e) => update('startTime', e.target.value)}
          />
        </label>
        <label className="form-field">
          <span>Sluttid</span>
          <input
            type="time"
            min={WORKDAY_START}
            max={WORKDAY_END}
            value={form.endTime}
            onChange={(e) => update('endTime', e.target.value)}
          />
        </label>
      </div>

      <label className="form-field">
        <span>Noteringar</span>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Fritext för personal och uppföljning"
        />
      </label>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Avbryt</button>
        <button type="submit" className="btn btn-primary">{submitLabel}</button>
      </div>
    </form>
  );
}
