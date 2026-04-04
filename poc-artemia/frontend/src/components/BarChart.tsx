import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#2E4057', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface Props {
  data: Record<string, number | string>[];
  keys: string[];
  xKey: string;
  yMax?: number;
}

export default function BarChart({ data, keys, xKey, yMax = 4 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ReBarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis domain={[0, yMax]} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => `${v}/4`} />
        <Legend />
        {keys.map((k, i) => (
          <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />
        ))}
      </ReBarChart>
    </ResponsiveContainer>
  );
}
