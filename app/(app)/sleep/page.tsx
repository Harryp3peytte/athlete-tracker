'use client';

import { useState, useEffect, useCallback } from 'react';
import { Moon, Trash2 } from 'lucide-react';
import BarChartComponent from '@/components/charts/BarChartComponent';
import Modal from '@/components/ui/Modal';
import GlassCard from '@/components/ui/GlassCard';
import type { SleepLog } from '@/types';

type Period = '7d' | '30d';

type SleepForm = {
  date: string;
  hours: string;
  quality: string;
  bedtime: string;
  waketime: string;
  notes: string;
};

const EMPTY_FORM: SleepForm = {
  date: new Date().toISOString().split('T')[0],
  hours: '',
  quality: '7',
  bedtime: '23:00',
  waketime: '07:00',
  notes: '',
};

const qualityBadgeStyle = (q: number | null): { color: string } => {
  if (q == null) return { color: 'var(--text-secondary)' };
  if (q >= 7) return { color: '#2AC956' };
  if (q >= 4) return { color: '#FF9F0A' };
  return { color: '#FF6B6B' };
};

function calcHoursFromTimes(bedtime: string, waketime: string): number {
  if (!bedtime || !waketime) return 0;
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = waketime.split(':').map(Number);
  let bedMinutes = bh * 60 + bm;
  let wakeMinutes = wh * 60 + wm;
  if (wakeMinutes <= bedMinutes) wakeMinutes += 24 * 60; // crossed midnight
  return +((wakeMinutes - bedMinutes) / 60).toFixed(1);
}

export default function SleepPage() {
  const [period, setPeriod] = useState<Period>('7d');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<SleepForm>(EMPTY_FORM);
  const [entries, setEntries] = useState<SleepLog[]>([]);
  const [avgHours, setAvgHours] = useState(0);
  const [useTimeMode, setUseTimeMode] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/sleep?period=${period}`);
      const data = await res.json();
      setEntries(Array.isArray(data.entries) ? data.entries : []);
      setAvgHours(typeof data.avgHours === 'number' ? data.avgHours : 0);
    } catch (err) { console.error(err); }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-calculate hours when times change
  useEffect(() => {
    if (useTimeMode && form.bedtime && form.waketime) {
      const h = calcHoursFromTimes(form.bedtime, form.waketime);
      if (h > 0) setForm(f => ({ ...f, hours: h.toString() }));
    }
  }, [form.bedtime, form.waketime, useTimeMode]);

  const handleSubmit = async () => {
    if (!form.date || !form.hours) return;
    try {
      const res = await fetch('/api/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: form.date,
          hours: parseFloat(form.hours),
          quality: form.quality ? parseInt(form.quality, 10) : null,
          bedtime: form.bedtime || null,
          waketime: form.waketime || null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) { const data = await res.json(); alert(`Erreur: ${data.error}`); return; }
      setModal(false);
      setForm(EMPTY_FORM);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Erreur de connexion');
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/sleep/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const chartData = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(e => ({
      date: new Date(e.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      heures: e.hours,
    }));

  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="title-apple flex items-center gap-2"><Moon size={24} /> Sommeil</h1>
          {avgHours > 0 && (
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Moyenne : <span className="num-highlight font-semibold" style={{ color: '#8E8AFF' }}>{avgHours.toFixed(1)} h</span> / nuit
            </p>
          )}
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Ajouter</button>
      </div>

      <div className="flex gap-2">
        {(['7d', '30d'] as Period[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={period === p ? { background: '#8E8AFF', color: '#fff' } : { background: 'var(--bg-input)', color: 'var(--text-secondary)' }}
          >
            {p === '7d' ? '7 jours' : '30 jours'}
          </button>
        ))}
      </div>

      <GlassCard>
        <h3 className="section-header text-xs font-semibold uppercase tracking-wider mb-3">Heures de sommeil par nuit</h3>
        {chartData.length > 0 ? (
          <BarChartComponent data={chartData} bars={[{ dataKey: 'heures', color: '#8E8AFF', name: 'Heures' }]} xKey="date" height={260} />
        ) : (
          <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>Aucune donnée</div>
        )}
      </GlassCard>

      <GlassCard>
        <h3 className="section-header text-xs font-semibold uppercase tracking-wider mb-3">Historique</h3>
        {sortedEntries.length === 0 ? (
          <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>Aucune entrée</p>
        ) : (
          <div className="space-y-2">
            {sortedEntries.map(e => (
              <div key={e.id} className="glass-subtle rounded-xl flex items-center justify-between px-4 py-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="num-highlight font-semibold" style={{ color: '#8E8AFF' }}>{e.hours.toFixed(1)} h</span>
                    {e.quality != null && (
                      <span className="glass-subtle text-xs font-semibold px-2 py-0.5 rounded-full" style={qualityBadgeStyle(e.quality)}>
                        Qualité {e.quality}/10
                      </span>
                    )}
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(e.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex gap-3 mt-0.5">
                    {e.bedtime && <span className="text-[10px]" style={{ color: '#9B8A8A' }}>🛏 {e.bedtime}</span>}
                    {e.waketime && <span className="text-[10px]" style={{ color: '#9B8A8A' }}>⏰ {e.waketime}</span>}
                  </div>
                  {e.notes && <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{e.notes}</p>}
                </div>
                <button onClick={() => handleDelete(e.id)} className="hover:text-[#FF6B6B] transition-colors p-1 ml-2" style={{ color: 'var(--text-quaternary)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <Modal open={modal} onClose={() => setModal(false)} title="Ajouter une nuit de sommeil">
        <div className="space-y-4">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input-field" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setUseTimeMode(true)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={useTimeMode ? { background: '#8E8AFF', color: '#fff' } : { background: 'var(--bg-input)', color: 'var(--text-secondary)' }}
            >
              Heures coucher/réveil
            </button>
            <button
              onClick={() => setUseTimeMode(false)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={!useTimeMode ? { background: '#8E8AFF', color: '#fff' } : { background: 'var(--bg-input)', color: 'var(--text-secondary)' }}
            >
              Durée manuelle
            </button>
          </div>

          {useTimeMode ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Coucher</label>
                <input type="time" className="input-field" value={form.bedtime} onChange={e => setForm(f => ({ ...f, bedtime: e.target.value }))} />
              </div>
              <div>
                <label className="label">Réveil</label>
                <input type="time" className="input-field" value={form.waketime} onChange={e => setForm(f => ({ ...f, waketime: e.target.value }))} />
              </div>
              {form.hours && (
                <div className="col-span-2 text-center text-sm font-semibold" style={{ color: '#8E8AFF' }}>
                  = {form.hours} h de sommeil
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="label">Durée (heures)</label>
              <input type="number" min="0" max="24" step="0.5" className="input-field" placeholder="Ex : 7.5" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} />
            </div>
          )}

          <div>
            <label className="label">Qualité (1 – 10)</label>
            <div className="flex items-center gap-3">
              <input type="range" min="1" max="10" className="flex-1" style={{ accentColor: '#8E8AFF' }} value={form.quality} onChange={e => setForm(f => ({ ...f, quality: e.target.value }))} />
              <span className="text-lg font-bold w-8 text-center" style={{ color: '#8E8AFF' }}>{form.quality}</span>
            </div>
          </div>

          <div>
            <label className="label">Notes (optionnel)</label>
            <input className="input-field" placeholder="Ex : Caféine le soir, bruit…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <button onClick={handleSubmit} className="btn-primary w-full">Enregistrer</button>
        </div>
      </Modal>
    </div>
  );
}
