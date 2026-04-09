'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart } from 'lucide-react';
import TrendChart from '@/components/charts/TrendChart';
import Modal from '@/components/ui/Modal';
import GlassCard from '@/components/ui/GlassCard';
import type { WellnessLog } from '@/types';

const scoreColor = (score: number): string => {
  if (score >= 7) return '#2AC956';
  if (score >= 4) return '#FF9F0A';
  return '#FF375F';
};

const DIMENSIONS: Array<{ key: string; label: string; icon: string; color: string; inverted?: boolean }> = [
  { key: 'form_score', label: 'Forme générale', icon: '💪', color: '#FF375F' },
  { key: 'energy', label: 'Énergie', icon: '⚡', color: '#FF9500' },
  { key: 'stress', label: 'Stress', icon: '🧠', color: '#5E5CE6', inverted: true },
  { key: 'pain', label: 'Douleurs', icon: '🩹', color: '#FF2D55', inverted: true },
  { key: 'motivation', label: 'Motivation', icon: '🔥', color: '#2AC956' },
];

export default function WellnessPage() {
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');
  const [entries, setEntries] = useState<WellnessLog[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    form_score: '7', energy: '7', stress: '3', pain: '1', motivation: '7', notes: '',
  });

  const fetchData = useCallback(() => {
    fetch(`/api/wellness?period=${period}`).then(r => r.json()).then(setEntries).catch(console.error);
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const res = await fetch('/api/wellness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          form_score: parseInt(form.form_score),
          energy: parseInt(form.energy),
          stress: parseInt(form.stress),
          pain: parseInt(form.pain),
          motivation: parseInt(form.motivation),
          notes: form.notes || null,
        }),
      });
      if (!res.ok) { const data = await res.json(); alert(`Erreur: ${data.error}`); return; }
      setModal(false);
      setForm({ form_score: '7', energy: '7', stress: '3', pain: '1', motivation: '7', notes: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Erreur de connexion');
    }
  };

  const todayEntry = entries.find(e => e.date === new Date().toISOString().split('T')[0]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="title-apple flex items-center gap-2">
          <span style={{ background: '#FF375F15', borderRadius: '10px', padding: '6px' }}>
            <Heart size={24} style={{ color: '#FF375F' }} />
          </span>
          Bien-être
        </h1>
        <button onClick={() => setModal(true)} className="btn-primary">+ Évaluer</button>
      </div>

      {/* Today's scores - multi-dimensional */}
      <GlassCard>
        {todayEntry ? (
          <div className="space-y-3">
            <div className="text-center mb-2">
              <div className="num-highlight text-4xl" style={{ color: scoreColor(todayEntry.form_score) }}>
                {todayEntry.form_score}/10
              </div>
              <div className="text-xs" style={{ color: '#9B8A8A' }}>Score forme du jour</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DIMENSIONS.filter(d => d.key !== 'form_score').map(dim => {
                const val = todayEntry[dim.key as keyof WellnessLog] as number | null;
                if (val == null) return null;
                const displayVal = dim.inverted ? 10 - val + 1 : val;
                return (
                  <div key={dim.key} className="glass-subtle rounded-xl p-3 flex items-center gap-2">
                    <span className="text-lg">{dim.icon}</span>
                    <div className="flex-1">
                      <div className="text-[10px] font-medium" style={{ color: '#9B8A8A' }}>{dim.label}</div>
                      <div className="flex items-center gap-1">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
                          <div className="h-full rounded-full" style={{
                            width: `${(displayVal / 10) * 100}%`,
                            background: dim.color,
                          }} />
                        </div>
                        <span className="text-xs font-bold" style={{ color: dim.color }}>{val}/10</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {todayEntry.notes && (
              <div className="text-sm italic text-center" style={{ color: '#9B8A8A' }}>{todayEntry.notes}</div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center" style={{ color: '#9B8A8A' }}>Pas encore évalué aujourd&apos;hui</div>
        )}
      </GlassCard>

      {/* Period toggle */}
      <div className="flex gap-2">
        {(['7d', '30d'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={period === p
              ? { background: '#FF375F', color: '#fff' }
              : { background: 'var(--bg-input)', color: 'var(--text-secondary)' }
            }
          >
            {p === '7d' ? '7 jours' : '30 jours'}
          </button>
        ))}
      </div>

      {/* Trend chart */}
      <GlassCard>
        <h3 className="section-header">Évolution du score</h3>
        {entries.length > 0 ? (
          <TrendChart
            data={entries.map(e => ({ date: e.date, value: e.form_score }))}
            color="#FF375F"
            label="Score"
            height={250}
            formatValue={v => `${v}/10`}
          />
        ) : (
          <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>Pas de données</div>
        )}
      </GlassCard>

      {/* History */}
      <GlassCard>
        <h3 className="section-header">Historique</h3>
        <div className="space-y-2">
          {entries.slice().reverse().map(e => (
            <div key={e.id} className="glass-subtle rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold" style={{ color: scoreColor(e.form_score) }}>{e.form_score}/10</span>
                  <span className="text-xs" style={{ color: '#9B8A8A' }}>
                    {new Date(e.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 text-[10px]" style={{ color: '#9B8A8A' }}>
                {e.energy != null && <span>⚡ {e.energy}</span>}
                {e.stress != null && <span>🧠 {e.stress}</span>}
                {e.pain != null && <span>🩹 {e.pain}</span>}
                {e.motivation != null && <span>🔥 {e.motivation}</span>}
              </div>
              {e.notes && <p className="text-xs mt-1 italic" style={{ color: '#9B8A8A' }}>{e.notes}</p>}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Évaluer mon bien-être">
        <div className="space-y-4">
          {DIMENSIONS.map(dim => (
            <div key={dim.key}>
              <label className="label flex items-center gap-2">
                <span>{dim.icon}</span> {dim.label}
                {dim.inverted && <span className="text-[10px]" style={{ color: '#9B8A8A' }}>(1 = aucun, 10 = max)</span>}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  className="flex-1"
                  style={{ accentColor: dim.color }}
                  value={form[dim.key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [dim.key]: e.target.value }))}
                />
                <span className="text-lg font-bold w-8 text-center" style={{ color: dim.color }}>
                  {form[dim.key as keyof typeof form]}
                </span>
              </div>
            </div>
          ))}
          <div>
            <label className="label">Notes (optionnel)</label>
            <input
              className="input-field"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Comment te sens-tu ?"
            />
          </div>
          <button onClick={handleSubmit} className="btn-primary w-full">Enregistrer</button>
        </div>
      </Modal>
    </div>
  );
}
