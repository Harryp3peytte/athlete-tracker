'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Plus, Utensils, Moon, Dumbbell, Scale, Droplets, Heart, Activity } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import BottomSheet from '@/components/ui/BottomSheet';
import ActivityRings from '@/components/charts/ActivityRings';
import WeekScoreBar from '@/components/charts/WeekScoreBar';
import CaloriesChart from '@/components/charts/CaloriesChart';
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
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [data, setData] = useState<DashboardData | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const { profile } = useProfile();

  const fetchDashboardData = useCallback(async (date: string) => {
    setTransitioning(true);
    try {
      const res = await fetch(`/api/dashboard?date=${date}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    }
    setTimeout(() => setTransitioning(false), 150);
  }, []);

  useEffect(() => {
    fetchDashboardData(selectedDate);
  }, [selectedDate, fetchDashboardData]);

  const handleDayClick = useCallback((date: string) => {
    setSelectedDate(date);
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

  const activityMinutes = data.cardioActivities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0)
    + data.workoutSessions.length * 45;

  const isToday = selectedDate === todayStr;
  const selectedDateLabel = isToday
    ? new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    : new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

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
              {selectedDateLabel}
            </p>
          </div>
        </div>
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

      {/* 2. Week Score Bar (interactive days with ring gauges) */}
      <GlassCard>
        <WeekScoreBar
          selectedDate={selectedDate}
          onDayClick={handleDayClick}
        />
      </GlassCard>

      {/* Content area with fade transition */}
      <div
        style={{
          opacity: transitioning ? 0.4 : 1,
          transition: 'opacity 0.2s ease',
        }}
      >
        {/* 3. Calories Chart (full width, big) */}
        <GlassCard className="!p-4 mb-4">
          <CaloriesChart data={data.calorieTrend || []} />
        </GlassCard>

        {/* 3b. Weight Trend Chart */}
        {data.weight.trend && data.weight.trend.length > 1 && (() => {
          const weightData = data.weight.trend.map(w => ({
            date: new Date(w.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
            weight: w.weight_kg,
          }));
          const weights = data.weight.trend.map(w => w.weight_kg);
          const minW = Math.min(...weights);
          const maxW = Math.max(...weights);
          const diff = weights[weights.length - 1] - weights[0];
          const isDown = diff <= 0;

          return (
            <GlassCard className="!p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#30D158' }} />
                  <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B5B5B' }}>
                    Poids — 7 jours
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold" style={{ color: '#1A1A1A' }}>
                    {data.weight.current} <span className="text-xs font-normal" style={{ color: '#9B8A8A' }}>kg</span>
                  </span>
                  {diff !== 0 && (
                    <div className="text-xs font-semibold" style={{ color: isDown ? '#2AC956' : '#FF9500' }}>
                      {isDown ? '' : '+'}{diff.toFixed(1)} kg
                    </div>
                  )}
                </div>
              </div>
              <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#weightGrad)"
                      dot={{ r: 3, fill: '#30D158', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: '#30D158', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          );
        })()}

        {/* 4. Activity Rings + Weight */}
        <GlassCard className="!p-4 mb-4">
          <div className="flex gap-3">
            {/* Left: Weight mini chart */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="rounded-2xl p-3" style={{ background: 'rgba(255, 255, 255, 0.4)', border: '1px solid rgba(255,255,255,0.5)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-sm" style={{ background: '#30D158' }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6B5B5B' }}>Poids</span>
                </div>
                <div className="text-lg font-bold" style={{ color: '#1A1A1A' }}>
                  {data.weight.current ? `${data.weight.current}` : '-'}
                  <span className="text-[10px] font-normal ml-0.5" style={{ color: '#9B8A8A' }}>kg</span>
                </div>
              </div>

              {/* Today's calories summary */}
              <div className="rounded-2xl p-3 mt-3" style={{ background: 'rgba(255, 255, 255, 0.4)', border: '1px solid rgba(255,255,255,0.5)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-sm" style={{ background: '#FF9500' }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6B5B5B' }}>Calories</span>
                </div>
                <div className="text-lg font-bold" style={{ color: '#1A1A1A' }}>
                  {data.calories.consumed}
                  <span className="text-[10px] font-normal ml-0.5" style={{ color: '#9B8A8A' }}>/{target}</span>
                </div>
              </div>
            </div>

            {/* Right: Activity Rings */}
            <div className="flex items-center justify-center" style={{ minWidth: 150 }}>
              <ActivityRings
                size={140}
                rings={[
                  { value: data.calories.burned, max: target, color: '#FF2D55', label: 'Calories' },
                  { value: activityMinutes, max: 30, color: '#2AC956', label: 'Activité' },
                  { value: data.hydration, max: 2, color: '#00C7BE', label: 'Hydratation' },
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

        {/* 5. Score du jour */}
        <GlassCard>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#6B5B5B' }}>
            Score du jour — {data.healthScore.total}/100
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
      </div>

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
