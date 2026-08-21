import { useState } from 'react';
import { Icon } from './Icon';

interface QtyStepperProps {
  value: number;
  onChange: (newQty: number) => void;
}

export const QtyStepper = ({ value, onChange }: QtyStepperProps) => {
  const [draft, setDraft] = useState<string | null>(null);
  const parsed = draft !== null && draft !== '' ? parseInt(draft, 10) : NaN;

  const step = (delta: number) => {
    const base = isNaN(parsed) ? value : parsed;
    setDraft(null);
    onChange(base + delta);
  };

  const commit = () => {
    if (draft === null) return;
    if (draft === '' || isNaN(parsed)) { setDraft(null); return; }
    setDraft(null);
    onChange(parsed);
  };

  return (
    <div className="stepper">
      <button type="button" onClick={() => step(-1)} className="btn-icon" style={{ color: 'var(--color-on-surface)' }}>
        <Icon name="minus" size={16} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={draft ?? String(value)}
        onChange={e => setDraft(e.target.value.replace(/\D/g, '').slice(0, 5))}
        onFocus={e => e.currentTarget.select()}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        style={{ width: 42, height: 26, border: '1px solid var(--color-outline-variant)', borderRadius: 6, background: '#fff', fontSize: 14, fontWeight: 700, textAlign: 'center', padding: 0 }}
      />
      <button type="button" onClick={() => step(1)} className="btn-icon" style={{ color: 'var(--color-on-surface)' }}>
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
};
