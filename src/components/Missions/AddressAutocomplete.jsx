import { useEffect, useRef, useState } from 'react';
import { searchAddressSuggestions } from '../../lib/ors.js';

// Textfält med adressökning i realtid mot OpenRouteService. Användaren
// skriver en adress, får förslag i en lista, och väljer ett för att sätta
// koordinater – inga latitud/longitud-fält behöver fyllas i manuellt.
export default function AddressAutocomplete({ value, onSelect, placeholder }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef(null);
  const selectedRef = useRef(value || '');

  useEffect(() => {
    setQuery(value || '');
    selectedRef.current = value || '';
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Sök inte igen om texten är exakt den vi själva satte vid ett val.
    if (query === selectedRef.current) return;
    if (query.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');
    const timeout = setTimeout(() => {
      searchAddressSuggestions(query)
        .then((results) => {
          if (cancelled) return;
          setSuggestions(results);
          setOpen(results.length > 0);
          setHighlighted(-1);
        })
        .catch((err) => {
          if (cancelled) return;
          setSuggestions([]);
          setError(err.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  function selectSuggestion(s) {
    selectedRef.current = s.label;
    setQuery(s.label);
    setOpen(false);
    setSuggestions([]);
    onSelect(s);
  }

  function handleKeyDown(e) {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="address-autocomplete" ref={containerRef}>
      <input
        type="text"
        value={query}
        placeholder={placeholder || 'Börja skriv en adress…'}
        onChange={(e) => {
          setQuery(e.target.value);
          if (e.target.value !== selectedRef.current) onSelect(null);
        }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {loading && <div className="address-autocomplete-status">Söker adress…</div>}
      {error && <div className="address-autocomplete-status text-error">{error}</div>}
      {open && suggestions.length > 0 && (
        <ul className="address-suggestions">
          {suggestions.map((s, i) => (
            <li key={`${s.lat},${s.lon}`}>
              <button
                type="button"
                className={i === highlighted ? 'highlighted' : ''}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(s)}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
