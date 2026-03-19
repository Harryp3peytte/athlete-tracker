'use client';

import { useState, useEffect, useCallback } from 'react';
import { Moon, Trash2 } from 'lucide-react';
import BarChartComponent from '@/components/charts/BarChartComponent';
import Modal from '@/components/ui/Modal';
import GlassCard from '@/components/ui/GlassCard';
import type { SleepLog } from '@/types';

type Period = '7d' | '30d';

type SleepForm = {
  date:    string;
  hours:   string;
  quality: string;
  notes:   string;
};

const EMPTY_FORM: SleepForm = {
  date:    new Date().toISOString().split('T')[0],
  hours:   '',
  quality: '7',
  notes:   '',
};

// Returns inline style colors for quality badge
const qualityBadgeStyle = (q: number | null): { color: string } => {
  if (q == null) return { color: 'rgba(255,255,255,0.4)' };
  if (q >= 7)    return { color: '#2AC956' };
  if (q >= 4)    return { color: '#FF9F0A' };
  return { color: '#FF6B6B' };
};

export default function SleepPage() {
  const [period, setPeriod]   = useState<Period>('7d');
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState<SleepForm>(EMPTY_FORM);
  const [entries, setEntries] = useState<SleepLog[]>([]);
  const [avgHours, setAvgHours] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const res  = await fetch(`/api/sleep?period=${period}`);
      const data = await res.json();
      setEntries(Array.isArray(data.entries) ? data.entries : []);
      setAvgHours(typeof data.avgHours === 'number' ? data.avgHours : 0);
    } catch (err) {
      console.error('Erreur chargement sommeil:', err);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    if (!form.date || !form.hours) return;
    try {
      const res = await fetch('/api/sleep', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date:    form.date,
          hours:   parseFloat(form.hours),
          quality: form.quality ? parseInt(form.quality, 10) : null,
          notes:   form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('API error:', data);
        alert(`Erreur: ${data.error || 'Échec de l\'enregistrement'}`);
        return;
      }
      setModal(false);
      setForm(EMPTY_FORM);
      fetchData();
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Erreur de connexion');
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/sleep/${id}`, { method: 'DELETE' });
    fetchData();
  };

  // Chart data — chronological order (oldest → newest)
  const chartData = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(e => ({
      date:   new Date(e.date + 'T12:00:00').toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'short',
      }),
      heures: e.hours,
    }));

  // History list — most recent first
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="title-apple flex items-center gap-2">
            <Moon size={24} /> Sommeil
          </h1>
          {avgHours > 0 && (
            <p className="text-white/40 mt-1 text-sm">
              Moyenne&nbsp;:&nbsp;
              <span className="num-highlight font-semibold" style={{ color: '#8E8AFF' }}>
                {avgHours.toFixed(1)} h
              </span>
              &nbsp;/ nuit
            </p>
          )}
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">
          + Ajouter
        </button>
      </div>

      {/* Period toggle */}
      <div className="flex gap-2">
        {(['7d', '30d'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={
              period === p
                ? { background: '#8E8AFF', color: '#fff' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
            }
          >
            {p === '7d' ? '7 jours' : '30 jours'}
          </button>
        ))}
      </div>

      {/* Bar chart */}
      <GlassCard>
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
          Heures de sommeil par nuit
        </h3>
        {chartData.length > 0 ? (
          <BarChartComponent
            data={chartData}
            bars={[{ dataKey: 'heures', color: '#8E8AFF', name: 'Heures' }]}
            xKey="date"
            height={260}
          />
        ) : (
          <div className="text-white/30 text-center py-12">
            Aucune donnée pour cette période
          </div>
        )}
      </GlassCard>

      {/* History list */}
      <GlassCard>
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Historique</h3>
        {sortedEntries.length === 0 ? (
          <p className="text-white/30 text-center py-8">Aucune entrée enregistrée</p>
        ) : (
          <div className="space-y-2">
            {sortedEntries.map(e => (
              <div
                key={e.id}
                className="glass-subtle rounded-xl flex items-center justify-between px-4 py-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="num-highlight font-semibold" style={{ color: '#8E8AFF' }}>
                      {e.hours.toFixed(1)} h
                    </span>
                    {e.quality != null && (
                      <span
                        className="glass-subtle text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={qualityBadgeStyle(e.quality)}
                      >
                        Qualité {e.quality}/10
                      </span>
                    )}
                    <span className="text-xs text-white/30">
                      {new Date(e.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                        weekday: 'short', day: 'numeric', month: 'short',
                      })}
                    </span>
                  </div>
                  {e.notes && (
                    <p className="text-xs text-white/30 mt-1">{e.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="text-white/20 hover:text-[#FF6B6B] transition-colors p-1 ml-2"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Add sleep modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Ajouter une nuit de sommeil">
        <div className="space-y-4">
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input-field"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Durée (heures)</label>
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              className="input-field"
              placeholder="Ex : 7.5"
              value={form.hours}
              onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Qualité (1 – 10)</label>
            <input
              type="number"
              min="1"
              max="10"
              step="1"
              className="input-field"
              placeholder="Ex : 8"
              value={form.quality}
              onChange={e => setForm(f => ({ ...f, quality: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Notes (optionnel)</label>
            <input
              className="input-field"
              placeholder="Ex : Caféine le soir, bruit…"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <button onClick={handleSubmit} className="btn-primary w-full">
            Enregistrer
          </button>
        </div>
      </Modal>
    </div>
  );
}
