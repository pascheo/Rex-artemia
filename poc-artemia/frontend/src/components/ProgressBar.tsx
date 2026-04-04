interface Props {
  current: number;
  total: number;
  label?: string;
}

export default function ProgressBar({ current, total, label }: Props) {
  const pct = Math.round((current / total) * 100);
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#6b7280' }}>
        <span>{label ?? `Étape ${current} sur ${total}`}</span>
        <span>{pct}%</span>
      </div>
      <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '99px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #2E4057, #3b82f6)',
            borderRadius: '99px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}
