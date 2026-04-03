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
  background: 'var(--tooltip-bg)',
  backdropFilter: 'blur(20px)',
  border: '0.5px solid var(--tooltip-border)',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
};

export default function BarChartComponent({ data, bars, xKey = 'label', height = 300, stacked = false }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
        <XAxis dataKey={xKey} stroke="var(--text-tertiary)" fontSize={11} tickLine={false} tick={{ fill: 'var(--text-secondary)' }} />
        <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} tick={{ fill: 'var(--text-secondary)' }} />
        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'var(--text-secondary)' }} cursor={{ fill: 'var(--bg-input)' }} />
        <Legend formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{value}</span>} />
        {bars.map((bar) => (
          <Bar key={bar.dataKey} dataKey={bar.dataKey} fill={bar.color} name={bar.name}
            stackId={stacked ? 'stack' : undefined} radius={[6, 6, 0, 0]}
            animationDuration={1200} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
