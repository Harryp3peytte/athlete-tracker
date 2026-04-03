'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Plus, Moon, Flame, Dumbbell, Utensils, Scale, Droplets, Heart, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import AnimatedRing from '@/components/charts/AnimatedRing';
import TrendChart from '@/components/charts/TrendChart';
import WorkoutCalendar from '@/components/charts/WorkoutCalendar';
import type { DashboardData } from '@/types';

const quickActions = [
  { label: 'Repas', icon: Utensils, href: '/meals', color: '#FF9F0A' },
  { label: 'Cardio', icon: Dumbbell, href: '/activities', color: '#FF6B6B' },
  { label: 'Sommeil', icon: Moon, href: '/sleep', color: '#8E8AFF' },
  { label: 'Poids', icon: Scale, href: '/weight', color: '#30D158' },
  { label: 'Eau', icon: Droplets, href: '/hydration', color: '#64D2FF' },
  { label: 'Forme', icon: Heart, href: '/wellness', color: '#FF375F' },
  { label: 'Muscu', icon: Dumbbell, href: '/workouts', color: '#BF5AF2' },
];

const scoreBreakdown = [
  { key: 'sleep', label: 'Sommeil', color: '#8E8AFF', max: 20 },
  { key: 'calories', label: 'Calories', color: '#FF9F0A', max: 20 },
  { key: 'activity', label: 'Activité', color: '#FF6B6B', max: 20 },
  { key: 'hydration', label: 'Hydratation', color: '#64D2FF', max: 15 },
  { key: 'wellness', label: 'Bien-être', color: '#FF375F', max: 15 },
  { key: 'regularity', label: 'Régularité', color: '#2AC956', max: 10 },
] as const;

const tooltipStyle = {
  background: 'var(--tooltip-bg)',
  backdropFilter: 'blur(20px)',
  border: '0.5px solid var(--tooltip-border)',
  borderRadius: '12px',
  boxShadow: 'var(--tooltip-shadow)',
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData).catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass h-48 animate-pulse rounded-[16px]" />
        ))}
      </div>
    );
  }

  const target = data.calories.target || 2000;
  const balance = data.calories.consumed - data.calories.burned;

  const calorieTrendData = (data.calorieTrend || []).map(d => ({
    date: new Date(d.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    consumed: d.consumed,
    burned: d.burned,
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="title-apple text-[28px]" style={{ color: 'var(--text-primary)' }}>Bonjour, {data.athlete?.name || 'Athlète'} !</h1>
        <p className="text-sm mt-1 capitalize" style={{ color: 'var(--text-tertiary)' }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
        {quickActions.map(({ label, icon: Icon, href, color }) => (
          <Link key={href} href={href}>
            <GlassCard hover className="flex flex-col items-center gap-2 py-4 px-1">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${color}15` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
            </GlassCard>
          </Link>
        ))}
      </div>

      {/* Score + Calories summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Health Score */}
        <GlassCard className="flex items-center gap-6">
          <AnimatedRing score={data.healthScore.total} gradientFrom="#2AC956" gradientTo="#00C7BE" />
          <div className="flex-1 space-y-2.5">
            <h3 className="section-header">Score du jour</h3>
            {scoreBreakdown.map(({ key, label, color, max }) => {
              const val = data.healthScore.breakdown[key];
              return (
                <div key={key} className="flex items-center gap-2.5">
                  <span className="text-[11px] w-20" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${(val / max) * 100}%`, background: color,
                      boxShadow: `0 0 8px ${color}40`,
                      transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                  </div>
                  <span className="text-[11px] w-10 text-right" style={{ color: 'var(--text-tertiary)' }}>{val}/{max}</span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Today's Calories Summary */}
        <GlassCard className="space-y-4">
          <h3 className="section-header flex items-center gap-2">
            <Flame size={14} style={{ color: '#FF6B6B' }} /> Calories aujourd&apos;hui
          </h3>
          <div className="flex items-end justify-between">
            <div>
              <div className="num-highlight num-glow-orange text-4xl" style={{ color: '#FF9F0A' }}>{data.calories.consumed}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>kcal consommées</div>
            </div>
            <div className="text-right space-y-1.5">
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Brûlées: <span className="num-highlight num-glow-red" style={{ color: '#FF6B6B' }}>{data.calories.burned}</span>
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                dont {data.calories.metabolism} métabolisme + {data.calories.activities} activités
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                {balance < 0
                  ? <TrendingDown size={14} style={{ color: '#2AC956' }} />
                  : balance > 0
                  ? <TrendingUp size={14} style={{ color: '#FF6B6B' }} />
                  : <Minus size={14} style={{ color: '#64D2FF' }} />}
                <span className="num-highlight text-lg" style={{
                  color: balance < 0 ? '#2AC956' : balance > 0 ? '#FF6B6B' : '#64D2FF',
                  textShadow: balance < 0 ? '0 0 20px rgba(42,201,86,0.3)' : balance > 0 ? '0 0 20px rgba(255,107,107,0.3)' : 'none',
                }}>
                  {balance < 0 ? 'Déficit' : balance > 0 ? 'Surplus' : 'Équilibre'}
                </span>
              </div>
            </div>
          </div>
          {/* Hydration + Wellness mini */}
          <div className="flex gap-4 pt-3" style={{ borderTop: '0.5px solid var(--separator)' }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <Droplets size={13} style={{ color: '#64D2FF' }} /> <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{data.hydration.toFixed(1)}L</span> / 2L
            </div>
            {data.wellness && (
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <Heart size={13} style={{ color: '#FF375F' }} /> Forme: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{data.wellness.form_score}/10</span>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Calorie Trend Chart */}
      <GlassCard>
        <h3 className="section-header mb-4">
          Calories — 7 derniers jours
        </h3>
        {calorieTrendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={calorieTrendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorConsumed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF9F0A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF9F0A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorBurned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="date" stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'var(--tooltip-label)' }} />
              <Area type="monotone" dataKey="consumed" stroke="#FF9F0A" strokeWidth={2.5} fill="url(#colorConsumed)" name="Consommées"
                dot={{ fill: '#FF9F0A', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 6, fill: '#FF9F0A', stroke: 'rgba(255,159,10,0.3)', strokeWidth: 8 }}
                animationDuration={1200} />
              <Area type="monotone" dataKey="burned" stroke="#FF6B6B" strokeWidth={2.5} fill="url(#colorBurned)" name="Brûlées"
                dot={{ fill: '#FF6B6B', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 6, fill: '#FF6B6B', stroke: 'rgba(255,107,107,0.3)', strokeWidth: 8 }}
                animationDuration={1200} />
              <Legend formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{value}</span>} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>Pas de données sur cette période</div>
        )}
      </GlassCard>

      {/* Workout Calendar */}
      <GlassCard>
        <WorkoutCalendar />
      </GlassCard>

      {/* Weight + Sleep */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-header">Poids — 7 jours</h3>
            {data.weight.current && (
              <span className="num-highlight num-glow-green text-xl" style={{ color: '#30D158' }}>{data.weight.current} kg</span>
            )}
          </div>
          {data.weight.trend.length > 0 ? (
            <TrendChart data={data.weight.trend.map(w => ({ date: w.date, value: w.weight_kg }))}
              label="Poids (kg)" height={180} formatValue={v => `${v}kg`} color="#30D158" area />
          ) : <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>Pas de données</div>}
        </GlassCard>

        <GlassCard>
          <h3 className="section-header flex items-center gap-2 mb-4">
            <Moon size={14} style={{ color: '#8E8AFF' }} /> Dernière nuit
          </h3>
          {data.sleep ? (
            <div className="space-y-3">
              <div className="num-highlight num-glow-purple text-4xl" style={{ color: '#8E8AFF' }}>{data.sleep.hours}h</div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium glass-subtle"
                style={{ color: (data.sleep.quality || 0) >= 7 ? '#2AC956' : (data.sleep.quality || 0) >= 4 ? '#FF9F0A' : '#FF6B6B' }}>
                Qualité: {data.sleep.quality}/10
              </span>
            </div>
          ) : <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>Pas de données</div>}

          {data.wellness && (
            <div className="flex items-center justify-between pt-3 mt-4" style={{ borderTop: '0.5px solid var(--separator)' }}>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}><Heart size={13} style={{ color: '#FF375F' }} /> Forme</div>
              <span className="text-xs font-semibold" style={{ color: data.wellness.form_score >= 7 ? '#2AC956' : data.wellness.form_score >= 4 ? '#FF9F0A' : '#FF375F' }}>
                {data.wellness.form_score}/10
              </span>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Activities */}
      {(data.cardioActivities.length > 0 || data.workoutSessions.length > 0) && (
        <GlassCard>
          <h3 className="section-header mb-3">Activités du jour</h3>
          <div className="space-y-2">
            {data.cardioActivities.map(a => (
              <div key={a.id} className="flex items-center justify-between glass-subtle px-4 py-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#FF6B6B15' }}>
                    <Dumbbell size={14} style={{ color: '#FF6B6B' }} />
                  </div>
                  <div>
                    <span className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{a.activity_type}</span>
                    <span className="text-[11px] ml-2" style={{ color: 'var(--text-tertiary)' }}>{a.duration_minutes} min</span>
                  </div>
                </div>
                <span className="text-sm font-semibold" style={{ color: '#FF6B6B' }}>{a.calories_burned} kcal</span>
              </div>
            ))}
            {data.workoutSessions.map(w => (
              <div key={w.id} className="flex items-center justify-between glass-subtle px-4 py-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#BF5AF215' }}>
                    <Dumbbell size={14} style={{ color: '#BF5AF2' }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{w.name || 'Séance muscu'}</span>
                </div>
                <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{(w.workout_exercises || []).length} exercices</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
