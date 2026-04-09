'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { WeightLog } from '@/types';

const PERIODS = [
  { key: '7d', label: '7J' },
  { key: '30d', label: '1M' },
  { key: '6m', label: '6M' },
  { key: '1y', label: '1A' },
  { key: 'all', label: 'Tout' },
] as const;

export default function WeightChart() {
  const [period, setPeriod] = useState<string>('7d');
  const [entries, setEntries] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const param = period === 'all' ? '3650d' : period;
    fetch(`/api/weight?period=${param}`)
      .then(r => r.json())
      .then(data => setEntries(data.entries || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  if (entries.length < 2 && !loading) return null;

  const weightData = entries.map(w => ({
    date: new Date(w.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    weight: w.weight_kg,
  }));

  const weights = entries.map(w => w.weight_kg);
  const minW = weights.length > 0 ? Math.min(...weights) : 0;
  const maxW = weights.length > 0 ? Math.max(...weights) : 100;
  const current = weights.length > 0 ? weights[weights.length - 1] : null;
  const diff = weights.length >= 2 ? weights[weights.length - 1] - weights[0] : 0;
  const isDown = diff <= 0;

  return (
    <div>
      {/* Header with period selector */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#30D158' }} />
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B5B5B' }}>
            Poids
          </h3>
        </div>
        <div className="text-right">
          {current != null && (
            <span className="text-lg font-bold" style={{ color: '#1A1A1A' }}>
              {current} <span className="text-xs font-normal" style={{ color: '#9B8A8A' }}>kg</span>
            </span>
          )}
          {diff !== 0 && (
            <div className="text-xs font-semibold" style={{ color: isDown ? '#2AC956' : '#FF9500' }}>
              {isDown ? '' : '+'}{diff.toFixed(1)} kg
            </div>
          )}
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 mb-3">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
            style={{
              background: period === p.key ? '#30D158' : 'rgba(0,0,0,0.04)',
              color: period === p.key ? '#fff' : '#9B8A8A',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div style={{ height: 160, opacity: loading ? 0.4 : 1, transition: 'opacity 0.2s' }}>
        {weightData.length >= 2 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weightData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="weightChartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#30D158" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#30D158" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis
                dataKey="date"
                stroke="rgba(0,0,0,0.3)"
                tick={{ fill: 'rgba(0,0,0,0.5)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[Math.floor(minW - 0.5), Math.ceil(maxW + 0.5)]}
                stroke="rgba(0,0,0,0.3)"
                tick={{ fill: 'rgba(0,0,0,0.5)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  fontSize: 12,
                }}
                formatter={(value: number) => [`${value} kg`, 'Poids']}
              />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#30D158"
                strokeWidth={3}
                fill="url(#weightChartGrad)"
                dot={weightData.length <= 30 ? { r: 3, fill: '#30D158', stroke: '#fff', strokeWidth: 2 } : false}
                activeDot={{ r: 5, fill: '#30D158', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
