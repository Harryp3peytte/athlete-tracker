'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Utensils, Moon, Dumbbell, Scale, Droplets, Heart, Activity, Flame, TrendingUp, TrendingDown } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import BottomSheet from '@/components/ui/BottomSheet';
import ActivityRings from '@/components/charts/ActivityRings';
import WeekScoreBar from '@/components/charts/WeekScoreBar';
import CaloriesChart from '@/components/charts/CaloriesChart';
import WeightChart from '@/components/charts/WeightChart';
import { useProfile } from '@/hooks/useProfile';
import type { DashboardData } from '@/types';
import Link from 'next/link';

interface InsightsData {
  streak: number;
  weekly: {
    avgCalories: number; prevAvgCalories: number;
    avgSleep: number; prevAvgSleep: number;
    totalHydration: number; prevTotalHydration: number;
    workoutCount: number; prevWorkoutCount: number;
    cardioMinutes: number; prevCardioMinutes: number;
  };
}

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
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const { profile } = useProfile();

  useEffect(() => {
    fetch('/api/dashboard/insights').then(r => r.json()).then(setInsights).catch(console.error);
  }, []);

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

      {/* Goal progress widget */}
      {data.athlete?.goal_type && data.athlete?.target_weight && data.weight.current && (
        <GlassCard className="!p-4">
          {(() => {
            const current = data.weight.current!;
            const target = data.athlete.target_weight!;
            const goalType = data.athlete.goal_type;
            const diff = current - target;
            const isLosing = goalType === 'LOSE_WEIGHT';
            const progress = isLosing
              ? Math.max(0, Math.min(100, ((current - target) > 0 ? (1 - Math.abs(diff) / Math.max(current, 1)) * 100 : 100)))
              : goalType === 'GAIN_MUSCLE'
                ? Math.max(0, Math.min(100, diff >= 0 ? 100 : (current / target) * 100))
                : 100;
            const remaining = Math.abs(diff).toFixed(1);
            const reached = (isLosing && diff <= 0) || (!isLosing && goalType === 'GAIN_MUSCLE' && diff >= 0);
            const goalColor = goalType === 'LOSE_WEIGHT' ? '#FF2D55' : goalType === 'GAIN_MUSCLE' ? '#BF5AF2' : '#2AC956';
            const goalLabel = goalType === 'LOSE_WEIGHT' ? 'Perte de poids' : goalType === 'GAIN_MUSCLE' ? 'Prise de muscle' : 'Maintien';

            return (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${goalColor}15` }}>
                  <span className="text-lg">{reached ? '🎉' : '🎯'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold" style={{ color: goalColor }}>{goalLabel}</span>
                    <span className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>{current} kg → {target} kg</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${Math.min(progress, 100)}%`,
                      background: reached ? '#2AC956' : goalColor,
                    }} />
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: '#9B8A8A' }}>
                    {reached ? 'Objectif atteint !' : `Encore ${remaining} kg`}
                  </div>
                </div>
              </div>
            );
          })()}
        </GlassCard>
      )}

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
        <GlassCard className="!p-4 mb-4">
          <WeightChart />
        </GlassCard>

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
                  { value: data.hydration, max: data.athlete?.hydration_goal || 2, color: '#00C7BE', label: 'Hydratation' },
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

        {/* 6. Streak + Weekly Summary */}
        {insights && (
          <>
            {/* Streak */}
            {insights.streak > 0 && (
              <GlassCard className="!p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255, 149, 0, 0.1)' }}>
                    <Flame size={24} style={{ color: '#FF9500' }} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold" style={{ color: '#FF9500' }}>
                      {insights.streak} jour{insights.streak > 1 ? 's' : ''}
                    </div>
                    <div className="text-xs" style={{ color: '#9B8A8A' }}>de suite avec du tracking</div>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Weekly Summary */}
            <GlassCard>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B5B5B' }}>
                Bilan de la semaine
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <WeeklyStat label="Calories/j" value={`${insights.weekly.avgCalories}`} unit="kcal" prev={insights.weekly.prevAvgCalories} current={insights.weekly.avgCalories} color="#FF9500" />
                <WeeklyStat label="Sommeil/nuit" value={`${insights.weekly.avgSleep}`} unit="h" prev={insights.weekly.prevAvgSleep} current={insights.weekly.avgSleep} color="#5E5CE6" inverted />
                <WeeklyStat label="Séances muscu" value={`${insights.weekly.workoutCount}`} unit="" prev={insights.weekly.prevWorkoutCount} current={insights.weekly.workoutCount} color="#BF5AF2" inverted />
                <WeeklyStat label="Cardio" value={`${insights.weekly.cardioMinutes}`} unit="min" prev={insights.weekly.prevCardioMinutes} current={insights.weekly.cardioMinutes} color="#FF2D55" inverted />
                <WeeklyStat label="Hydratation" value={`${insights.weekly.totalHydration}`} unit="L" prev={insights.weekly.prevTotalHydration} current={insights.weekly.totalHydration} color="#32ADE6" inverted />
              </div>
            </GlassCard>
          </>
        )}
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

function WeeklyStat({ label, value, unit, prev, current, color, inverted }: {
  label: string; value: string; unit: string; prev: number; current: number; color: string; inverted?: boolean;
}) {
  const diff = current - prev;
  // For inverted metrics (sleep, workouts, cardio), "up" is good
  const isGood = inverted ? diff >= 0 : diff <= 0;
  return (
    <div className="glass-subtle rounded-xl p-3">
      <div className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: '#9B8A8A' }}>{label}</div>
      <div className="flex items-end gap-1">
        <span className="text-lg font-bold" style={{ color }}>{value}</span>
        {unit && <span className="text-[10px] mb-0.5" style={{ color: '#9B8A8A' }}>{unit}</span>}
      </div>
      {diff !== 0 && (
        <div className="flex items-center gap-0.5 mt-1">
          {diff > 0 ? <TrendingUp size={10} style={{ color: isGood ? '#2AC956' : '#FF9500' }} /> : <TrendingDown size={10} style={{ color: isGood ? '#2AC956' : '#FF9500' }} />}
          <span className="text-[10px] font-medium" style={{ color: isGood ? '#2AC956' : '#FF9500' }}>
            {diff > 0 ? '+' : ''}{typeof current === 'number' && current % 1 !== 0 ? diff.toFixed(1) : Math.round(diff)}
          </span>
          <span className="text-[10px]" style={{ color: '#9B8A8A' }}>vs sem. préc.</span>
        </div>
      )}
    </div>
  );
}
