import { useState } from 'react';
import { Icon } from './Icon';
import styles from './QtyStepper.module.css';

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
    <div className={styles.stepper}>
      <button type="button" onClick={() => step(-1)} className={styles.btnIcon}>
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
        className={styles.input}
      />
      <button type="button" onClick={() => step(1)} className={styles.btnIcon}>
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
};
