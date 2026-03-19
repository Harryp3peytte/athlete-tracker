'use client';

import { useState, useEffect, useCallback } from 'react';
import { Scale, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import TrendChart from '@/components/charts/TrendChart';
import Modal from '@/components/ui/Modal';
import GlassCard from '@/components/ui/GlassCard';
import type { WeightLog } from '@/types';

type Period = '7d' | '30d' | '90d' | '6m' | '1y';

export default function WeightPage() {
  const [period, setPeriod] = useState<Period>('30d');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ weight: '', date: new Date().toISOString().split('T')[0], notes: '' });
  const [data, setData] = useState<{ entries: WeightLog[]; current: number | null; trend: string } | null>(null);

  const fetchData = useCallback(() => {
    fetch(`/api/weight?period=${period}`).then(r => r.json()).then(setData).catch(console.error);
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    if (!form.weight) return;
    try {
      const res = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight_kg: parseFloat(form.weight), date: form.date, notes: form.notes || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('API error:', data);
        alert(`Erreur: ${data.error || 'Échec de l\'enregistrement'}`);
        return;
      }
      setModal(false);
      setForm({ weight: '', date: new Date().toISOString().split('T')[0], notes: '' });
      fetchData();
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Erreur de connexion');
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/weight?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const entries = data?.entries || [];
  const trendIcon = data?.trend === 'up' ? <TrendingUp size={16} className="text-red-400" />
    : data?.trend === 'down' ? <TrendingDown size={16} className="text-emerald-500" />
    : <Minus size={16} className="text-white/40" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="title-apple flex items-center gap-2"><Scale size={24} /> Poids</h1>
          {data?.current && (
            <p className="text-white/40 flex items-center gap-2 mt-1">
              Actuel:&nbsp;
              <span className="num-highlight" style={{ color: '#30D158' }}>{data.current} kg</span>
              {trendIcon}
            </p>
          )}
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Ajouter</button>
      </div>

      {/* Period buttons */}
      <div className="flex gap-2">
        {(['7d', '30d', '90d', '6m', '1y'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={
              period === p
                ? { background: '#30D158', color: '#fff' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
            }
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chart */}
      <GlassCard>
        {entries.length > 0 ? (
          <TrendChart data={entries.map(e => ({ date: e.date, value: e.weight_kg }))} label="Poids (kg)" formatValue={v => `${v}kg`} />
        ) : (
          <div className="text-white/30 text-center py-12">Aucune entrée pour cette période</div>
        )}
      </GlassCard>

      {/* History */}
      <GlassCard>
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Historique</h3>
        <div className="space-y-2">
          {entries.slice().reverse().map(e => (
            <div key={e.id} className="glass-subtle rounded-xl flex items-center justify-between px-4 py-3">
              <div>
                <span className="num-highlight font-medium" style={{ color: '#30D158' }}>{e.weight_kg} kg</span>
                <span className="text-xs text-white/30 ml-3">
                  {new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
                {e.notes && <span className="text-xs text-white/20 ml-2">{e.notes}</span>}
              </div>
              <button
                onClick={() => handleDelete(e.id)}
                className="text-white/20 hover:text-[#FF6B6B] transition-colors p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </GlassCard>

      <Modal open={modal} onClose={() => setModal(false)} title="Ajouter le poids">
        <div className="space-y-4">
          <div>
            <label className="label">Poids (kg)</label>
            <input type="number" step="0.1" className="input-field" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input-field" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="label">Notes (optionnel)</label>
            <input className="input-field" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <button onClick={handleSubmit} className="btn-primary w-full">Enregistrer</button>
        </div>
      </Modal>
    </div>
  );
}
