'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface CaloriesChartProps {
  data: Array<{ date: string; consumed: number; burned: number }>;
}

export default function CaloriesChart({ data }: CaloriesChartProps) {
  if (!data || data.length === 0) return null;

  const formatted = data.map(d => ({
    ...d,
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
  }));

  const totalConsumed = data.reduce((s, d) => s + d.consumed, 0);
  const totalBurned = data.reduce((s, d) => s + d.burned, 0);
  const balance = totalConsumed - totalBurned;
  const isDeficit = balance <= 0;

  const avgConsumed = Math.round(totalConsumed / data.length);
  const avgBurned = Math.round(totalBurned / data.length);

  return (
    <div>
      {/* Summary header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B5B5B' }}>
          Calories — 7 jours
        </h3>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF9500' }} />
            <span className="text-xs" style={{ color: '#6B5B5B' }}>Consommées</span>
            <span className="text-sm font-bold" style={{ color: '#FF9500' }}>{avgConsumed}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF2D55' }} />
            <span className="text-xs" style={{ color: '#6B5B5B' }}>Brûlées</span>
            <span className="text-sm font-bold" style={{ color: '#FF2D55' }}>{avgBurned}</span>
          </div>
        </div>
        <div className="text-right">
          <span
            className="text-lg font-bold"
            style={{ color: isDeficit ? '#2AC956' : '#FF2D55' }}
          >
            {isDeficit ? '' : '+'}{Math.round(balance / data.length)} kcal/j
          </span>
          <div className="text-[10px] font-medium" style={{ color: isDeficit ? '#2AC956' : '#FF2D55' }}>
            {isDeficit ? 'Déficit' : 'Surplus'}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="calConsumedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF9500" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#FF9500" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="calBurnedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF2D55" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#FF2D55" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis
              dataKey="label"
              stroke="rgba(0,0,0,0.3)"
              tick={{ fill: 'rgba(0,0,0,0.5)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
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
              formatter={(value: number, name: string) => {
                const label = name === 'consumed' ? 'Consommées' : 'Brûlées';
                return [`${value} kcal`, label];
              }}
            />
            <Area
              type="monotone"
              dataKey="burned"
              stroke="#FF2D55"
              strokeWidth={3}
              fill="url(#calBurnedGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#FF2D55', stroke: '#fff', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="consumed"
              stroke="#FF9500"
              strokeWidth={3}
              fill="url(#calConsumedGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#FF9500', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
