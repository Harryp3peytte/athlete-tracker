'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarDay {
  date: string;
  type: 'workout' | 'cardio' | 'both';
  workout: string | null;
  cardio: string | null;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function WeekCalendar() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Calculate week dates
  const today = new Date();
  const currentDay = today.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset + weekOffset * 7);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const monthLabel = weekDates[0].toLocaleDateString('fr-FR', { month: 'long' });
  const yearLabel = weekDates[0].getFullYear();

  // Fetch activity data for this week's month
  useEffect(() => {
    const monthStr = `${weekDates[0].getFullYear()}-${String(weekDates[0].getMonth() + 1).padStart(2, '0')}`;
    fetch(`/api/dashboard/calendar?month=${monthStr}`)
      .then(r => r.json())
      .then(data => setDays(data.days || []))
      .catch(console.error);
  }, [weekOffset]);

  const dayMap = new Map(days.map(d => [d.date, d]));
  const todayStr = today.toISOString().split('T')[0];

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
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date, i) => {
          const dateStr = date.toISOString().split('T')[0];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const activity = dayMap.get(dateStr);

          return (
            <button
              key={i}
              onClick={() => setSelectedDate(dateStr)}
              className="flex flex-col items-center gap-1 py-2 rounded-xl transition-all"
              style={{
                background: isSelected ? 'rgba(255, 45, 85, 0.1)' : 'rgba(255, 255, 255, 0.5)',
                border: isSelected ? '1.5px solid #FF2D55' : '1px solid rgba(180, 130, 130, 0.15)',
                borderRadius: '12px',
              }}
            >
              <span className="text-[10px] font-medium" style={{ color: '#9B8A8A' }}>
                {WEEKDAYS[i]}
              </span>
              <span className="text-sm font-semibold" style={{
                color: isToday ? '#FF2D55' : isSelected ? '#1A1A1A' : '#6B5B5B',
              }}>
                {String(date.getDate()).padStart(2, '0')}
              </span>
              {/* Activity dots */}
              <div className="flex gap-0.5 h-2">
                {activity && (activity.type === 'workout' || activity.type === 'both') && (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#BF5AF2' }} />
                )}
                {activity && (activity.type === 'cardio' || activity.type === 'both') && (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#FF2D55' }} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
