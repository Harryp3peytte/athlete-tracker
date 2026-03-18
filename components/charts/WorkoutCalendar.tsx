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

export default function WorkoutCalendar() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [hoveredDay, setHoveredDay] = useState<CalendarDay | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    fetch(`/api/dashboard/calendar?month=${monthStr}`)
      .then(r => r.json())
      .then(data => setDays(data.days || []))
      .catch(console.error);
  }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  // Monday = 0, Sunday = 6
  let startDay = firstDayOfMonth.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const today = new Date().toISOString().split('T')[0];
  const dayMap = new Map(days.map(d => [d.date, d]));

  const cells: Array<{ dayNum: number | null; dateStr: string | null }> = [];
  for (let i = 0; i < startDay; i++) cells.push({ dayNum: null, dateStr: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ dayNum: d, dateStr });
  }

  const monthLabel = new Date(year, month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Calendrier entraînements
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1 rounded-lg transition-colors hover:bg-white/[0.06]">
            <ChevronLeft size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
          </button>
          <span className="text-xs font-medium capitalize min-w-[120px] text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {monthLabel}
          </span>
          <button onClick={nextMonth} className="p-1 rounded-lg transition-colors hover:bg-white/[0.06]">
            <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-medium py-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell.dayNum) return <div key={i} />;
          const isToday = cell.dateStr === today;
          const activity = cell.dateStr ? dayMap.get(cell.dateStr) : null;

          return (
            <div
              key={i}
              className="relative flex flex-col items-center py-1.5 rounded-lg cursor-default transition-colors"
              style={{
                background: isToday ? 'rgba(42,201,86,0.12)' : 'transparent',
              }}
              onMouseEnter={e => {
                if (activity) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoverPos({ x: rect.left + rect.width / 2, y: rect.top });
                  setHoveredDay(activity);
                }
              }}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <span className="text-xs" style={{
                color: isToday ? '#2AC956' : activity ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)',
                fontWeight: isToday || activity ? 600 : 400,
              }}>
                {cell.dayNum}
              </span>
              {/* Activity dots */}
              {activity && (
                <div className="flex gap-0.5 mt-0.5">
                  {(activity.type === 'workout' || activity.type === 'both') && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#BF5AF2', boxShadow: '0 0 4px #BF5AF240' }} />
                  )}
                  {(activity.type === 'cardio' || activity.type === 'both') && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#FF6B6B', boxShadow: '0 0 4px #FF6B6B40' }} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 px-3 py-2 rounded-xl text-xs pointer-events-none"
          style={{
            left: hoverPos.x,
            top: hoverPos.y - 8,
            transform: 'translate(-50%, -100%)',
            background: 'rgba(15,23,42,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {hoveredDay.workout && <div style={{ color: '#BF5AF2' }}>{hoveredDay.workout}</div>}
          {hoveredDay.cardio && <div style={{ color: '#FF6B6B' }} className="capitalize">{hoveredDay.cardio}</div>}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: '#BF5AF2' }} />
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Muscu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: '#FF6B6B' }} />
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Cardio</span>
        </div>
      </div>
    </div>
  );
}
