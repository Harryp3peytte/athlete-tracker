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

export default function WellnessPage() {
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');
  const [entries, setEntries] = useState<WellnessLog[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ score: '7', notes: '' });

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
        body: JSON.stringify({ date: today, form_score: parseInt(form.score), notes: form.notes || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('API error:', data);
        alert(`Erreur: ${data.error || 'Échec de l\'enregistrement'}`);
        return;
      }
      setModal(false);
      setForm({ score: '7', notes: '' });
      fetchData();
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Erreur de connexion');
    }
  };

  const todayEntry = entries.find(e => e.date === new Date().toISOString().split('T')[0]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="title-apple flex items-center gap-2">
          <span style={{ background: '#FF375F15', borderRadius: '10px', padding: '6px' }}>
            <Heart size={24} style={{ color: '#FF375F' }} />
          </span>
          Bien-être
        </h1>
        <button onClick={() => setModal(true)} className="btn-primary">+ Évaluer</button>
      </div>

      {/* Today's score */}
      <GlassCard className="text-center space-y-3">
        {todayEntry ? (
          <>
            <div
              className="num-highlight text-5xl"
              style={{ color: scoreColor(todayEntry.form_score) }}
            >
              {todayEntry.form_score}/10
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Score forme du jour</div>
            {todayEntry.notes && (
              <div className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>{todayEntry.notes}</div>
            )}
          </>
        ) : (
          <div className="py-4" style={{ color: 'var(--text-tertiary)' }}>Pas encore évalué aujourd&apos;hui</div>
        )}
      </GlassCard>

      {/* Period toggle */}
      <div className="flex gap-2">
        {(['7d', '30d'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={
              period === p
                ? { background: '#FF375F', color: 'var(--text-primary)' }
                : { background: 'var(--bg-input)', color: 'var(--text-secondary)' }
            }
          >
            {p === '7d' ? '7 jours' : '30 jours'}
          </button>
        ))}
      </div>

      {/* Trend chart */}
      <GlassCard>
        <h3 className="section-header">
          Évolution du score
        </h3>
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
        <h3 className="section-header">
          Historique
        </h3>
        <div className="space-y-2">
          {entries.slice().reverse().map(e => (
            <div
              key={e.id}
              className="glass-subtle rounded-xl px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold" style={{ color: scoreColor(e.form_score) }}>
                  {e.form_score}/10
                </span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(e.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              {e.notes && (
                <span className="text-xs truncate max-w-[200px]" style={{ color: 'var(--text-quaternary)' }}>{e.notes}</span>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Évaluer ma forme">
        <div className="space-y-4">
          <div>
            <label className="label">Score (1-10)</label>
            <input
              type="range"
              min="1"
              max="10"
              className="w-full accent-[#FF375F]"
              value={form.score}
              onChange={e => setForm(f => ({ ...f, score: e.target.value }))}
            />
            <div className="text-center text-2xl font-bold mt-1">{form.score}/10</div>
          </div>
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
