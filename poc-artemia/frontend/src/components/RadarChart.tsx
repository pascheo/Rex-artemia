import {
  RadarChart as ReRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface Props {
  data: { axe: string; label: string; score: number }[];
}

export default function RadarChart({ data }: Props) {
  const chartData = data.map((d) => ({
    subject: `Axe ${d.axe}`,
    score: d.score,
    fullMark: 4,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ReRadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#374151' }} />
        <PolarRadiusAxis angle={30} domain={[0, 4]} tick={{ fontSize: 10 }} tickCount={5} />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#2E4057"
          fill="#2E4057"
          fillOpacity={0.3}
        />
        <Tooltip
          formatter={(value: number) => [`${value}/4`, 'Score']}
        />
      </ReRadarChart>
    </ResponsiveContainer>
  );
}
