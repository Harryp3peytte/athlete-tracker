'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';

interface TrendChartProps {
  data: Array<{ date: string; value: number }>;
  color?: string;
  label?: string;
  referenceLine?: number;
  referenceLabel?: string;
  height?: number;
  formatValue?: (v: number) => string;
  area?: boolean;
}

const tooltipStyle = {
  background: 'rgba(255, 255, 255, 0.92)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(180, 130, 130, 0.2)',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(139, 58, 74, 0.12)',
};

export default function TrendChart({
  data, color = '#30D158', label = 'Valeur',
  referenceLine, referenceLabel, height = 300,
  formatValue = (v) => `${v}`, area = false,
}: TrendChartProps) {
  const formatted = data.map(d => ({
    ...d,
    dateLabel: new Date(d.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
  }));

  if (area) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id={`areaGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.05)" />
          <XAxis dataKey="dateLabel" stroke="rgba(0, 0, 0, 0.3)" fontSize={11} tickLine={false} tick={{ fill: '#6B5B5B' }} />
          <YAxis stroke="rgba(0, 0, 0, 0.3)" fontSize={11} tickLine={false} domain={['auto', 'auto']} tickFormatter={formatValue} tick={{ fill: '#6B5B5B' }} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#6B5B5B' }}
            formatter={(value: number) => [formatValue(value), label]} />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5}
            fill={`url(#areaGrad-${color.replace('#', '')})`} animationDuration={1200}
            dot={{ fill: color, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, stroke: color, strokeWidth: 2, fill: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.05)" />
        <XAxis dataKey="dateLabel" stroke="rgba(0, 0, 0, 0.3)" fontSize={11} tickLine={false} tick={{ fill: '#6B5B5B' }} />
        <YAxis stroke="rgba(0, 0, 0, 0.3)" fontSize={11} tickLine={false} domain={['auto', 'auto']} tickFormatter={formatValue} tick={{ fill: '#6B5B5B' }} />
        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#6B5B5B' }}
          formatter={(value: number) => [formatValue(value), label]} />
        {referenceLine !== undefined && (
          <ReferenceLine y={referenceLine} stroke="rgba(180, 130, 130, 0.3)" strokeDasharray="5 5"
            label={{ value: referenceLabel || '', position: 'right', fill: '#9B8A8A', fontSize: 10 }} />
        )}
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} animationDuration={1200}
          dot={{ fill: color, r: 3, strokeWidth: 0, filter: `drop-shadow(0 0 4px ${color}60)` }}
          activeDot={{ r: 5, stroke: color, strokeWidth: 2, fill: '#fff' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
