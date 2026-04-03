'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trophy, Crown, Medal } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import type { LeaderboardEntry } from '@/types';

type Metric = 'health' | 'calories' | 'time' | 'sleep';

const METRIC_LABELS: Record<Metric, string> = {
  health: 'Score hygiène',
  calories: 'Calories brûlées',
  time: 'Temps d\'activité',
  sleep: 'Régularité sommeil',
};

const METRIC_UNITS: Record<Metric, string> = {
  health: 'pts', calories: 'kcal', time: 'min', sleep: 'écart-type',
};

const PODIUM_COLORS = ['text-amber-400', 'text-gray-400', 'text-amber-700'];

interface GroupData {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  members: Array<{
    id: string;
    role: string;
    athlete_id: string;
    athletes: { id: string; name: string } | null;
  }>;
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [metric, setMetric] = useState<Metric>('health');
  const [group, setGroup] = useState<GroupData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (id) fetch(`/api/groups/${id}`).then(r => r.json()).then(setGroup).catch(console.error);
  }, [id]);

  useEffect(() => {
    if (id) fetch(`/api/groups/${id}/leaderboard?metric=${metric}`).then(r => r.json()).then(setLeaderboard).catch(console.error);
  }, [id, metric]);

  if (!group) return (
    <div className="animate-pulse">
      <div className="glass h-64 rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/groups" className="p-2 rounded-lg transition-colors" onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="title-apple">{group.name}</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{group.members.length} membres</p>
        </div>
      </div>

      {/* Members */}
      <GlassCard>
        <h3 className="section-header mb-3">Membres</h3>
        <div className="flex flex-wrap gap-3">
          {group.members.map(m => (
            <div key={m.id} className="flex items-center gap-2 glass-subtle rounded-xl px-3 py-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: '#00C7BE15', color: '#00C7BE' }}
              >
                {(m.athletes?.name || '?').charAt(0)}
              </div>
              <span className="text-sm">{m.athletes?.name || 'Inconnu'}</span>
              {m.role === 'admin' && <Crown size={12} style={{ color: '#FF9F0A' }} />}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Leaderboard */}
      <GlassCard>
        <h3 className="section-header mb-4 flex items-center gap-2">
          <Trophy size={16} className="text-amber-400" /> Classement hebdomadaire
        </h3>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(Object.entries(METRIC_LABELS) as [Metric, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={metric === key
                ? { background: '#2AC956', color: '#fff' }
                : { background: 'var(--bg-input)', color: 'var(--text-secondary)' }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {leaderboard.length > 0 && (
          <>
            {/* Podium */}
            <div className="flex justify-center items-end gap-4 mb-8">
              {leaderboard.slice(0, 3).map((entry, i) => (
                <div key={entry.athlete.id} className={`flex flex-col items-center ${i === 0 ? 'order-2' : i === 1 ? 'order-1' : 'order-3'}`}>
                  <Medal size={24} className={PODIUM_COLORS[i]} />
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold mt-2"
                    style={i === 0
                      ? { background: 'rgba(251,191,36,0.10)', color: '#FBBF24' }
                      : { background: 'var(--bg-input)', color: 'var(--text-secondary)' }
                    }
                  >
                    {entry.athlete.name.charAt(0)}
                  </div>
                  <span className="text-xs font-medium mt-1">{entry.athlete.name.split(' ')[0]}</span>
                  <span className={`text-sm font-bold mt-0.5 ${PODIUM_COLORS[i]}`}>{entry.value} {METRIC_UNITS[metric]}</span>
                  <div
                    className={`w-16 mt-2 rounded-t-lg glass-subtle ${i === 0 ? 'h-20' : i === 1 ? 'h-14' : 'h-10'}`}
                  />
                </div>
              ))}
            </div>

            {/* Full list */}
            <div className="space-y-2">
              {leaderboard.map((entry, i) => (
                <div key={entry.athlete.id} className="flex items-center justify-between glass-subtle rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 text-center font-bold text-sm ${i < 3 ? PODIUM_COLORS[i] : ''}`} style={i >= 3 ? { color: 'var(--text-tertiary)' } : undefined}>{i + 1}</span>
                    <span className="text-sm font-medium">{entry.athlete.name}</span>
                  </div>
                  <span className="text-sm font-semibold">{entry.value} {METRIC_UNITS[metric]}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}
