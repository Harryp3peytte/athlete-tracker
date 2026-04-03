'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart, Area, ResponsiveContainer,
} from 'recharts';
import { Plus, Utensils, Moon, Dumbbell, Scale, Droplets, Heart, Activity } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import BottomSheet from '@/components/ui/BottomSheet';
import ActivityRings from '@/components/charts/ActivityRings';
import WeekCalendar from '@/components/charts/WeekCalendar';
import { useProfile } from '@/hooks/useProfile';
import type { DashboardData } from '@/types';
import Link from 'next/link';

const scoreBreakdown = [
  { key: 'sleep', label: 'Sommeil', color: '#5E5CE6', max: 20 },
  { key: 'calories', label: 'Calories', color: '#FF9500', max: 20 },
  { key: 'activity', label: 'Activité', color: '#FF2D55', max: 20 },
  { key: 'hydration', label: 'Hydratation', color: '#32ADE6', max: 15 },
  { key: 'wellness', label: 'Bien-être', color: '#FF375F', max: 15 },
  { key: 'regularity', label: 'Régularité', color: '#2AC956', max: 10 },
] as const;

const quickAddItems = [
  { label: 'Repas', icon: Utensils, href: '/meals', emoji: '🍽' },
  { label: 'Cardio', icon: Activity, href: '/activities', emoji: '🏃' },
  { label: 'Musculation', icon: Dumbbell, href: '/workouts', emoji: '💪' },
  { label: 'Sommeil', icon: Moon, href: '/sleep', emoji: '😴' },
  { label: 'Poids', icon: Scale, href: '/weight', emoji: '⚖️' },
  { label: 'Eau', icon: Droplets, href: '/hydration', emoji: '💧' },
  { label: 'Bien-être', icon: Heart, href: '/wellness', emoji: '❤️' },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const { profile } = useProfile();

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData).catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass h-40 animate-pulse rounded-[20px]" />
        ))}
      </div>
    );
  }

  const target = data.calories.target || 2000;

  const calorieTrendData = (data.calorieTrend || []).map(d => ({
    date: new Date(d.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric' }),
    consumed: d.consumed,
  }));

  const weightTrendData = (data.weight.trend || []).map(w => ({
    date: w.date,
    value: w.weight_kg,
  }));

  const activityMinutes = data.cardioActivities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0)
    + data.workoutSessions.length * 45;

  return (
    <div className="space-y-4">
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold shrink-0"
            style={{
              background: 'linear-gradient(135deg, #FF2D55, #FF6B8A)',
              color: '#fff',
            }}
          >
            {profile?.name ? profile.name.slice(0, 2).toUpperCase() : '?'}
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>
              {data.athlete?.name || profile?.name || 'Athlète'}
            </h1>
            <p className="text-sm capitalize" style={{ color: '#6B5B5B' }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
        {/* "+" button */}
        <button
          onClick={() => setQuickAddOpen(true)}
          className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95"
          style={{
            background: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(180, 130, 130, 0.3)',
          }}
        >
          <Plus size={20} style={{ color: '#1A1A1A' }} />
        </button>
      </div>

      {/* 2. Week Calendar */}
      <GlassCard>
        <WeekCalendar />
      </GlassCard>

      {/* 3. Widgets: Mini charts + Activity Rings */}
      <GlassCard className="!p-4">
        <div className="flex gap-3">
          {/* Left: 2 mini charts stacked */}
          <div className="flex-1 flex flex-col gap-3">
            {/* Mini chart: Calories */}
            <div className="rounded-2xl p-3" style={{ background: 'rgba(255, 255, 255, 0.4)', border: '1px solid rgba(255,255,255,0.5)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-sm" style={{ background: '#FF9500' }} />
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6B5B5B' }}>Calories</span>
              </div>
              <div className="text-lg font-bold" style={{ color: '#1A1A1A' }}>{data.calories.consumed}<span className="text-[10px] font-normal ml-0.5" style={{ color: '#9B8A8A' }}>/{target}</span></div>
              {calorieTrendData.length > 1 && (
                <div className="h-10 -mx-1 mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={calorieTrendData}>
                      <defs>
                        <linearGradient id="miniCalGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FF9500" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#FF9500" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="consumed" stroke="#FF9500" strokeWidth={2} fill="url(#miniCalGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Mini chart: Poids */}
            <div className="rounded-2xl p-3" style={{ background: 'rgba(255, 255, 255, 0.4)', border: '1px solid rgba(255,255,255,0.5)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-sm" style={{ background: '#30D158' }} />
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6B5B5B' }}>Poids</span>
              </div>
              <div className="text-lg font-bold" style={{ color: '#1A1A1A' }}>
                {data.weight.current ? `${data.weight.current}` : '-'}
                <span className="text-[10px] font-normal ml-0.5" style={{ color: '#9B8A8A' }}>kg</span>
              </div>
              {weightTrendData.length > 1 && (
                <div className="h-10 -mx-1 mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weightTrendData}>
                      <defs>
                        <linearGradient id="miniWeightGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#30D158" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#30D158" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="value" stroke="#30D158" strokeWidth={2} fill="url(#miniWeightGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Right: Activity Rings */}
          <div className="flex items-center justify-center" style={{ minWidth: 150 }}>
            <ActivityRings
              size={140}
              rings={[
                {
                  value: data.calories.burned,
                  max: target,
                  color: '#FF2D55',
                  label: 'Calories',
                },
                {
                  value: activityMinutes,
                  max: 30,
                  color: '#2AC956',
                  label: 'Activité',
                },
                {
                  value: data.hydration,
                  max: 2,
                  color: '#00C7BE',
                  label: 'Hydratation',
                },
              ]}
            />
          </div>
        </div>
        {/* Ring legend */}
        <div className="flex justify-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.4)' }}>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF2D55' }} />
            <span className="text-[10px]" style={{ color: '#6B5B5B' }}>Calories</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#2AC956' }} />
            <span className="text-[10px]" style={{ color: '#6B5B5B' }}>Activité</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#00C7BE' }} />
            <span className="text-[10px]" style={{ color: '#6B5B5B' }}>Hydratation</span>
          </div>
        </div>
      </GlassCard>

      {/* 4. Score du jour */}
      <GlassCard>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#6B5B5B' }}>
          Score du jour
        </h3>
        <div className="space-y-3">
          {scoreBreakdown.map(({ key, label, color, max }) => {
            const val = data.healthScore.breakdown[key];
            const pct = (val / max) * 100;
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-[12px] font-medium w-24" style={{ color: '#6B5B5B' }}>{label}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0, 0, 0, 0.05)' }}>
                  <div className="h-full rounded-full" style={{
                    width: `${pct}%`,
                    background: color,
                    boxShadow: `0 0 8px ${color}30`,
                    transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                </div>
                <span className="text-[12px] font-semibold w-12 text-right" style={{ color: '#1A1A1A' }}>{val}/{max}</span>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Quick Add Bottom Sheet */}
      <BottomSheet isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} title="Que voulez-vous ajouter ?">
        <div className="space-y-1 py-2">
          {quickAddItems.map(({ label, href, emoji }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setQuickAddOpen(false)}
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors active:bg-[rgba(255,45,85,0.06)]"
            >
              <span className="text-xl">{emoji}</span>
              <span className="text-[15px] font-medium" style={{ color: '#1A1A1A' }}>{label}</span>
            </Link>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
