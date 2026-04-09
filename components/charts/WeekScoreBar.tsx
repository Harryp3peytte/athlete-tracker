'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DayScore {
  date: string;
  dayLabel: string;
  dayNumber: number;
  score: number | null;
  isToday: boolean;
  isFuture: boolean;
  isSelected: boolean;
}

interface WeekScoreBarProps {
  onDayClick: (date: string) => void;
  selectedDate: string;
  onWeekChange?: (weekStart: string) => void;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function getScoreColor(score: number): string {
  if (score <= 30) return '#FF2D55';
  if (score <= 60) return '#FF9500';
  if (score <= 80) return '#FFD60A';
  return '#2AC956';
}

function MiniRing({ score, size = 42, isSelected, isFuture }: {
  score: number | null;
  size?: number;
  isSelected: boolean;
  isFuture: boolean;
}) {
  const strokeWidth = isSelected ? 4 : 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score != null ? Math.min(score / 100, 1) : 0;
  const offset = circumference - progress * circumference;
  const color = score != null ? getScoreColor(score) : 'rgba(0,0,0,0.08)';

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={isFuture ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.08)'}
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      {score != null && score > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 4px ${color}40)`,
          }}
        />
      )}
    </svg>
  );
}

export default function WeekScoreBar({ onDayClick, selectedDate, onWeekChange }: WeekScoreBarProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [scores, setScores] = useState<Array<{ date: string; score: number | null; dayOfWeek: number }>>([]);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentDay = today.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset + weekOffset * 7);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const weekStartStr = weekDates[0].toISOString().split('T')[0];
  const monthLabel = weekDates[0].toLocaleDateString('fr-FR', { month: 'long' });
  const yearLabel = weekDates[0].getFullYear();

  useEffect(() => {
    fetch(`/api/dashboard/week-scores?weekStart=${weekStartStr}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setScores(data);
      })
      .catch(console.error);
  }, [weekStartStr]);

  useEffect(() => {
    onWeekChange?.(weekStartStr);
  }, [weekStartStr, onWeekChange]);

  const days: DayScore[] = weekDates.map((date, i) => {
    const dateStr = date.toISOString().split('T')[0];
    const scoreEntry = scores.find(s => s.date === dateStr);
    return {
      date: dateStr,
      dayLabel: WEEKDAYS[i],
      dayNumber: date.getDate(),
      score: scoreEntry?.score ?? null,
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
      isSelected: dateStr === selectedDate,
    };
  });

  return (
    <div>
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-sm font-semibold capitalize" style={{ color: '#1A1A1A' }}>{monthLabel}</span>
          <span className="text-sm ml-1" style={{ color: '#9B8A8A' }}>{yearLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 rounded-lg transition-colors" style={{ background: 'rgba(255,255,255,0.5)' }}>
            <ChevronLeft size={16} style={{ color: '#6B5B5B' }} />
          </button>
          <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 rounded-lg transition-colors" style={{ background: 'rgba(255,255,255,0.5)' }}>
            <ChevronRight size={16} style={{ color: '#6B5B5B' }} />
          </button>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <button
            key={day.date}
            onClick={() => !day.isFuture && onDayClick(day.date)}
            className="flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all"
            style={{
              background: day.isSelected ? 'rgba(255, 45, 85, 0.08)' : 'transparent',
              opacity: day.isFuture ? 0.4 : 1,
              cursor: day.isFuture ? 'default' : 'pointer',
            }}
          >
            {/* Day label */}
            <span className="text-[10px] font-medium" style={{ color: '#9B8A8A' }}>
              {day.dayLabel}
            </span>

            {/* Mini ring with day number centered */}
            <div className="relative" style={{ width: 42, height: 42 }}>
              <MiniRing
                score={day.score}
                isSelected={day.isSelected}
                isFuture={day.isFuture}
              />
              {/* Day number centered */}
              <span
                className="absolute inset-0 flex items-center justify-center text-xs font-bold"
                style={{
                  color: day.isToday ? '#FF2D55' : day.isSelected ? '#1A1A1A' : '#6B5B5B',
                }}
              >
                {String(day.dayNumber).padStart(2, '0')}
              </span>
            </div>

            {/* Today indicator dot */}
            <div className="h-1.5">
              {day.isToday && (
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#FF2D55' }} />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
