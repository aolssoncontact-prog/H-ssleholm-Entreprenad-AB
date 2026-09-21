import { useEffect, useState } from 'react';
import { MISSION_TYPES, MISSION_STATUSES, USERS, WORKDAY_START, WORKDAY_END } from '../../lib/constants.js';
import { checkAvailability } from '../../lib/availability.js';
import PersonDayTimeline from './PersonDayTimeline.jsx';

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

export default function MissionForm({
  initial,
  onCancel,
  onSubmit,
  submitLabel = 'Spara',
  missions = [],
  excludeId = null,
  office = null,
}) {
  const [form, setForm] = useState(() => ({ ...EMPTY, ...initial }));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Live-förhandsvisning av tillgänglighet medan användaren fyller i formuläret.
  // Den slutgiltiga kontrollen görs alltid på nytt vid inskick (se handleSubmit).
  const [preview, setPreview] = useState({ status: 'idle' });

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    const lat = Number(form.lat);
    const lon = Number(form.lon);
    const timesValid = form.startTime && form.endTime && form.startTime < form.endTime;
    const coordsValid = form.lat !== '' && form.lon !== '' && !Number.isNaN(lat) && !Number.isNaN(lon);

    if (!timesValid || !coordsValid || !form.responsible || !form.date) {
      setPreview({ status: 'idle' });
      return;
    }

    let cancelled = false;
    setPreview({ status: 'checking' });
    const timeout = setTimeout(() => {
      checkAvailability({
        missions,
        office,
        candidate: { ...form, lat, lon },
        excludeId,
      })
        .then((result) => {
          if (cancelled) return;
          setPreview(result.ok ? { status: 'ok' } : { status: 'blocked', message: result.message });
        })
        .catch(() => {
          if (!cancelled) setPreview({ status: 'idle' });
        });
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.responsible, form.date, form.startTime, form.endTime, form.lat, form.lon, missions, office, excludeId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) return setError('Titel måste anges.');
    const lat = Number(form.lat);
    const lon = Number(form.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return setError('Ange giltiga koordinater (lat, lon).');
    if (form.startTime >= form.endTime) return setError('Sluttid måste vara efter starttid.');

    setSubmitting(true);
    try {
      const result = await checkAvailability({
        missions,
        office,
        candidate: { ...form, lat, lon },
        excludeId,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onSubmit({ ...form, lat, lon });
    } finally {
      setSubmitting(false);
    }
  }

  const blocked = preview.status === 'blocked';

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

      <PersonDayTimeline
        person={form.responsible}
        date={form.date}
        missions={missions}
        excludeId={excludeId}
        candidate={{ startTime: form.startTime, endTime: form.endTime, status: preview.status }}
      />

      <div className={'availability-status availability-' + preview.status}>
        {preview.status === 'checking' && 'Kontrollerar tillgänglighet (arbetstid och restid)…'}
        {preview.status === 'ok' && '✅ Tiden går att boka – arbetstid och restid räcker.'}
        {preview.status === 'blocked' && `🚫 ${preview.message}`}
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
        <button type="submit" className="btn btn-primary" disabled={submitting || blocked}>
          {submitting ? 'Kontrollerar…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
