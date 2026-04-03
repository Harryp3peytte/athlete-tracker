'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface BarChartProps {
  data: Array<Record<string, unknown>>;
  bars: Array<{ dataKey: string; color: string; name: string }>;
  xKey?: string;
  height?: number;
  stacked?: boolean;
}

const tooltipStyle = {
  background: 'rgba(255, 255, 255, 0.92)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(180, 130, 130, 0.2)',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(139, 58, 74, 0.12)',
};

export default function BarChartComponent({ data, bars, xKey = 'label', height = 300, stacked = false }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.05)" />
        <XAxis dataKey={xKey} stroke="rgba(0, 0, 0, 0.3)" fontSize={11} tickLine={false} tick={{ fill: '#6B5B5B' }} />
        <YAxis stroke="rgba(0, 0, 0, 0.3)" fontSize={11} tickLine={false} tick={{ fill: '#6B5B5B' }} />
        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#6B5B5B' }} cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }} />
        <Legend formatter={(value) => <span style={{ color: '#6B5B5B', fontSize: '12px' }}>{value}</span>} />
        {bars.map((bar) => (
          <Bar key={bar.dataKey} dataKey={bar.dataKey} fill={bar.color} name={bar.name}
            stackId={stacked ? 'stack' : undefined} radius={[6, 6, 0, 0]}
            animationDuration={1200} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
