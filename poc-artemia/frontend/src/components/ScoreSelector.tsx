const LABELS: Record<number, string> = {
  1: 'Très insuffisant',
  2: 'Insuffisant',
  3: 'Acceptable',
  4: 'Bon',
};

const COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
  2: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
  3: { bg: '#d1fae5', text: '#065f46', border: '#10b981' },
  4: { bg: '#dbeafe', text: '#1e3a8a', border: '#3b82f6' },
};

interface Props {
  value: number | null;
  onChange: (v: number) => void;
  disabled?: boolean;
}

export default function ScoreSelector({ value, onChange, disabled }: Props) {
  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      {[1, 2, 3, 4].map((n) => {
        const color = COLORS[n];
        const selected = value === n;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: `2px solid ${selected ? color.border : '#d1d5db'}`,
              background: selected ? color.bg : '#ffffff',
              color: selected ? color.text : '#374151',
              fontWeight: selected ? 700 : 400,
              fontSize: '14px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s',
              minWidth: '110px',
              opacity: disabled ? 0.7 : 1,
            }}
          >
            <span style={{ fontSize: '22px', fontWeight: 700 }}>{n}</span>
            <span style={{ fontSize: '12px' }}>{LABELS[n]}</span>
          </button>
        );
      })}
    </div>
  );
}
