'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface MacroPieChartProps {
  proteins: number;
  carbs: number;
  fats: number;
  height?: number;
}

const COLORS = ['#2AC956', '#32ADE6', '#FF9500'];

const tooltipStyle = {
  background: 'rgba(255, 255, 255, 0.92)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(180, 130, 130, 0.2)',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(139, 58, 74, 0.12)',
};

export default function MacroPieChart({ proteins, carbs, fats, height = 250 }: MacroPieChartProps) {
  const data = [
    { name: 'Protéines', value: Math.round(proteins) },
    { name: 'Glucides', value: Math.round(carbs) },
    { name: 'Lipides', value: Math.round(fats) },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return <div className="flex items-center justify-center" style={{ height, color: '#9B8A8A' }}>Pas de données</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" animationDuration={1200}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i]} style={{ filter: `drop-shadow(0 0 6px ${COLORS[i]}40)` }} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value}g`, '']} />
        <Legend formatter={(value) => <span style={{ color: '#6B5B5B', fontSize: '12px' }}>{value}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}
