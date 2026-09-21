import { useEffect, useState } from 'react';
import { MISSION_TYPES, MISSION_STATUSES, USERS, WORKDAY_START, WORKDAY_END } from '../../lib/constants.js';
import { checkAvailability } from '../../lib/availability.js';
import { nonWorkingDayReason } from '../../lib/holidays.js';
import PersonDayTimeline from './PersonDayTimeline.jsx';
import AddressAutocomplete from './AddressAutocomplete.jsx';

const EMPTY = {
  title: '',
  type: MISSION_TYPES[0],
  description: '',
  address: '',
  lat: null,
  lon: null,
  status: 'Planerat',
  responsible: USERS[0],
  date: new Date().toISOString().slice(0, 10),
  startTime: WORKDAY_START,
  endTime: WORKDAY_END,
  notes: '',
};

function initialState(initial) {
  const merged = { ...EMPTY, ...initial };
  if (!merged.address && merged.lat != null && merged.lon != null) {
    merged.address = `${Number(merged.lat).toFixed(5)}, ${Number(merged.lon).toFixed(5)} (befintlig plats)`;
  }
  return merged;
}

export default function MissionForm({
  initial,
  onCancel,
  onSubmit,
  submitLabel = 'Spara',
  missions = [],
  excludeId = null,
  office = null,
}) {
  const [form, setForm] = useState(() => initialState(initial));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Live-förhandsvisning av tillgänglighet för BÅDA personerna, så man kan
  // se vem som kan ta uppdraget först. Den slutgiltiga kontrollen för den
  // faktiskt valda ansvariga görs alltid på nytt vid inskick (se handleSubmit).
  const [previewByPerson, setPreviewByPerson] = useState({});

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleAddressSelect(suggestion) {
    if (!suggestion) {
      setForm((prev) => ({ ...prev, lat: null, lon: null }));
      return;
    }
    setForm((prev) => ({ ...prev, address: suggestion.label, lat: suggestion.lat, lon: suggestion.lon }));
  }

  useEffect(() => {
    const timesValid = form.startTime && form.endTime && form.startTime < form.endTime;
    const coordsValid = form.lat != null && form.lon != null;

    if (!timesValid || !coordsValid || !form.date) {
      setPreviewByPerson({});
      return;
    }

    let cancelled = false;
    setPreviewByPerson(Object.fromEntries(USERS.map((u) => [u, { status: 'checking' }])));
    const timeout = setTimeout(() => {
      Promise.all(
        USERS.map((person) =>
          checkAvailability({
            missions,
            office,
            candidate: { ...form, responsible: person },
            excludeId,
          }).then((result) => [person, result.ok ? { status: 'ok' } : { status: 'blocked', message: result.message }])
        )
      )
        .then((entries) => {
          if (!cancelled) setPreviewByPerson(Object.fromEntries(entries));
        })
        .catch(() => {
          if (!cancelled) setPreviewByPerson({});
        });
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.date, form.startTime, form.endTime, form.lat, form.lon, missions, office, excludeId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) return setError('Titel måste anges.');
    if (form.lat == null || form.lon == null) return setError('Välj en adress från förslagslistan.');
    if (form.startTime >= form.endTime) return setError('Sluttid måste vara efter starttid.');

    setSubmitting(true);
    try {
      const result = await checkAvailability({
        missions,
        office,
        candidate: form,
        excludeId,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  }

  const preview = previewByPerson[form.responsible] || { status: 'idle' };
  const blocked = preview.status === 'blocked';
  const dateIssue = form.date ? nonWorkingDayReason(form.date) : null;
  const addressConfirmed = form.lat != null && form.lon != null;

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

      <label className="form-field">
        <span>Adress</span>
        <AddressAutocomplete value={form.address} onSelect={handleAddressSelect} placeholder="T.ex. Storgatan 4, Hässleholm" />
        {form.lat != null && form.lon != null ? (
          <span className="field-hint">📍 {form.lat.toFixed(5)}, {form.lon.toFixed(5)}</span>
        ) : (
          <span className="field-hint field-hint-error">Välj en adress ur förslagslistan.</span>
        )}
      </label>

      <div className="form-row">
        <label className="form-field">
          <span>Datum</span>
          <input
            type="date"
            value={form.date}
            onChange={(e) => update('date', e.target.value)}
            className={dateIssue ? 'field-invalid' : ''}
          />
          {dateIssue && <span className="field-hint field-hint-error">🚫 Det är {dateIssue} – Bertil och Ove jobbar inte då.</span>}
        </label>
        <label className="form-field">
          <span>Ansvarig</span>
          <select value={form.responsible} onChange={(e) => update('responsible', e.target.value)}>
            {USERS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
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

      <div className="form-field">
        <span>Vem kan ta uppdraget först?</span>
        <div className="dual-timeline-grid">
          {USERS.map((person) => {
            const personPreview = previewByPerson[person] || { status: 'idle' };
            return (
              <div key={person} className="dual-timeline-column">
                <PersonDayTimeline
                  person={person}
                  date={form.date}
                  missions={missions}
                  excludeId={excludeId}
                  candidate={{ startTime: form.startTime, endTime: form.endTime, status: personPreview.status }}
                />
                <div className={'availability-status availability-' + personPreview.status}>
                  {personPreview.status === 'checking' && 'Kontrollerar…'}
                  {personPreview.status === 'ok' && '✅ Ledig – kan ta uppdraget.'}
                  {personPreview.status === 'blocked' && `🚫 ${personPreview.message}`}
                </div>
                <button
                  type="button"
                  className={'btn btn-small' + (form.responsible === person ? ' btn-primary' : ' btn-ghost')}
                  onClick={() => update('responsible', person)}
                >
                  {form.responsible === person ? '✓ Vald som ansvarig' : `Tilldela ${person}`}
                </button>
              </div>
            );
          })}
        </div>
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
        <button type="submit" className="btn btn-primary" disabled={submitting || blocked || !addressConfirmed}>
          {submitting ? 'Kontrollerar…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
