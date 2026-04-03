'use client';

import { useState, useEffect, useCallback } from 'react';
import { Droplets } from 'lucide-react';
import BarChartComponent from '@/components/charts/BarChartComponent';
import GlassCard from '@/components/ui/GlassCard';

interface HydrationData {
  entries: Array<{ id: string; date: string; liters: number }>;
  byDate: Record<string, number>;
  todayTotal: number;
}

export default function HydrationPage() {
  const [data, setData] = useState<HydrationData | null>(null);
  const today = new Date().toISOString().split('T')[0];

  const fetchData = useCallback(() => {
    fetch('/api/hydration?period=7d').then(r => r.json()).then(setData).catch(console.error);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addWater = async (liters: number) => {
    await fetch('/api/hydration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today, liters }),
    });
    fetchData();
  };

  const todayTotal = data?.todayTotal || 0;
  const goal = 2;
  const pct = Math.min((todayTotal / goal) * 100, 100);

  const barData = Object.entries(data?.byDate || {}).map(([date, liters]) => ({
    label: new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    liters: Math.round(liters * 100) / 100,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="title-apple flex items-center gap-2">
        <span style={{ background: '#64D2FF15', borderRadius: '10px', padding: '6px' }}>
          <Droplets size={24} style={{ color: '#64D2FF' }} />
        </span>
        Hydratation
      </h1>

      {/* Today's progress */}
      <GlassCard className="text-center space-y-4">
        <div className="num-highlight text-5xl" style={{ color: '#64D2FF' }}>
          {todayTotal.toFixed(1)}L
        </div>
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Objectif : {goal}L</div>

        {/* Progress bar */}
        <div
          className="rounded-full h-4 mx-auto max-w-xs overflow-hidden"
          style={{ background: 'var(--bg-input)' }}
        >
          <div
            className="h-4 rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: pct >= 100 ? '#2AC956' : '#64D2FF',
            }}
          />
        </div>
        {pct >= 100 && (
          <div className="text-sm font-medium" style={{ color: '#2AC956' }}>
            Objectif atteint !
          </div>
        )}

        {/* Quick add buttons */}
        <div className="flex justify-center gap-3 pt-2">
          {[0.25, 0.5, 1].map(amount => (
            <button
              key={amount}
              onClick={() => addWater(amount)}
              className="glass-subtle rounded-xl px-4 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors hover:brightness-110"
            >
              <Droplets size={14} style={{ color: '#64D2FF' }} />
              +{amount}L
            </button>
          ))}
        </div>
      </GlassCard>

      {/* 7-day chart */}
      <GlassCard>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 section-header">
          7 derniers jours
        </h3>
        {barData.length > 0 ? (
          <BarChartComponent
            data={barData}
            bars={[{ dataKey: 'liters', color: '#64D2FF', name: 'Litres' }]}
            height={250}
          />
        ) : (
          <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>Pas de données</div>
        )}
      </GlassCard>
    </div>
  );
}
