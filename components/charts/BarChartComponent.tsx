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
  background: 'rgba(30,30,30,0.9)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
};

export default function BarChartComponent({ data, bars, xKey = 'label', height = 300, stacked = false }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey={xKey} stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} />
        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'rgba(255,255,255,0.5)' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Legend formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{value}</span>} />
        {bars.map((bar) => (
          <Bar key={bar.dataKey} dataKey={bar.dataKey} fill={bar.color} name={bar.name}
            stackId={stacked ? 'stack' : undefined} radius={[6, 6, 0, 0]}
            animationDuration={1200} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
