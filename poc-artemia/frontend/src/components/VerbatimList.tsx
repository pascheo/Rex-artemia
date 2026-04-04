import { useState } from 'react';

interface VerbatimItem {
  nom: string;
  direction: string;
  text: string | null;
}

interface Props {
  items: VerbatimItem[];
  title: string;
}

export default function VerbatimList({ items, title }: Props) {
  const [filter, setFilter] = useState('');
  const directions = [...new Set(items.map((i) => i.direction))].sort();
  const filtered = filter ? items.filter((i) => i.direction === filter) : items;

  if (items.length === 0) {
    return (
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>{title}</h4>
        <p style={{ color: '#9ca3af', fontSize: '13px', fontStyle: 'italic' }}>Aucun verbatim disponible.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>{title} ({items.length})</h4>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ fontSize: '12px', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
        >
          <option value="">Toutes les directions</option>
          {directions.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map((item, i) => (
          <div
            key={i}
            style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderLeft: '4px solid #2E4057',
              borderRadius: '8px',
              padding: '12px 16px',
            }}
          >
            <p style={{ fontSize: '13px', color: '#1f2937', lineHeight: '1.5', fontStyle: 'italic', marginBottom: '6px' }}>
              "{item.text}"
            </p>
            <p style={{ fontSize: '11px', color: '#6b7280' }}>
              {item.nom} — {item.direction}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
