'use client';

import { useState, useEffect, useCallback } from 'react';
import { Ruler, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import GlassCard from '@/components/ui/GlassCard';

interface Measurement {
  id: string;
  date: string;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  left_arm_cm: number | null;
  right_arm_cm: number | null;
  left_thigh_cm: number | null;
  right_thigh_cm: number | null;
  left_calf_cm: number | null;
  right_calf_cm: number | null;
  shoulders_cm: number | null;
  neck_cm: number | null;
  notes: string | null;
}

const FIELDS: Array<{ key: keyof Measurement; label: string; icon: string }> = [
  { key: 'chest_cm', label: 'Poitrine', icon: '🫁' },
  { key: 'shoulders_cm', label: 'Épaules', icon: '💪' },
  { key: 'waist_cm', label: 'Taille', icon: '📏' },
  { key: 'hips_cm', label: 'Hanches', icon: '🍑' },
  { key: 'left_arm_cm', label: 'Bras gauche', icon: '💪' },
  { key: 'right_arm_cm', label: 'Bras droit', icon: '💪' },
  { key: 'left_thigh_cm', label: 'Cuisse gauche', icon: '🦵' },
  { key: 'right_thigh_cm', label: 'Cuisse droite', icon: '🦵' },
  { key: 'left_calf_cm', label: 'Mollet gauche', icon: '🦶' },
  { key: 'right_calf_cm', label: 'Mollet droit', icon: '🦶' },
  { key: 'neck_cm', label: 'Cou', icon: '🧣' },
];

export default function MeasurementsPage() {
  const [entries, setEntries] = useState<Measurement[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ date: new Date().toISOString().split('T')[0] });

  const fetchData = useCallback(() => {
    fetch('/api/measurements?period=1y').then(r => r.json()).then(setEntries).catch(console.error);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    const body: Record<string, string | number | null> = { date: form.date };
    FIELDS.forEach(f => {
      body[f.key] = form[f.key] ? parseFloat(form[f.key]) : null;
    });
    body.notes = form.notes || null;

    await fetch('/api/measurements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setModal(false);
    setForm({ date: new Date().toISOString().split('T')[0] });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/measurements?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const latest = entries.length > 0 ? entries[entries.length - 1] : null;
  const previous = entries.length > 1 ? entries[entries.length - 2] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="title-apple flex items-center gap-2">
          <span style={{ background: '#32ADE615', borderRadius: '10px', padding: '6px' }}>
            <Ruler size={24} style={{ color: '#32ADE6' }} />
          </span>
          Mensurations
        </h1>
        <button onClick={() => setModal(true)} className="btn-primary">+ Mesurer</button>
      </div>

      {/* Latest measurements */}
      {latest && (
        <GlassCard>
          <h3 className="section-header text-xs font-semibold uppercase tracking-wider mb-3">
            Dernière mesure — {new Date(latest.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {FIELDS.map(f => {
              const val = latest[f.key] as number | null;
              if (val == null) return null;
              const prevVal = previous ? (previous[f.key] as number | null) : null;
              const diff = prevVal != null ? val - prevVal : null;
              return (
                <div key={f.key} className="glass-subtle rounded-xl p-3 flex items-center gap-2">
                  <span className="text-lg">{f.icon}</span>
                  <div className="flex-1">
                    <div className="text-[10px] font-medium" style={{ color: '#9B8A8A' }}>{f.label}</div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold" style={{ color: '#1A1A1A' }}>{val} cm</span>
                      {diff != null && diff !== 0 && (
                        <span className="text-[10px] font-medium" style={{ color: diff > 0 ? '#FF9500' : '#2AC956' }}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {latest.notes && (
            <p className="text-xs italic mt-2" style={{ color: '#9B8A8A' }}>{latest.notes}</p>
          )}
        </GlassCard>
      )}

      {/* History */}
      <GlassCard>
        <h3 className="section-header text-xs font-semibold uppercase tracking-wider mb-3">Historique</h3>
        {entries.length === 0 ? (
          <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>Aucune mesure enregistrée</p>
        ) : (
          <div className="space-y-2">
            {[...entries].reverse().map(e => {
              const filledFields = FIELDS.filter(f => e[f.key] != null);
              return (
                <div key={e.id} className="glass-subtle rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold" style={{ color: '#32ADE6' }}>
                      {new Date(e.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <div className="text-[10px] mt-0.5" style={{ color: '#9B8A8A' }}>
                      {filledFields.map(f => `${f.label}: ${e[f.key]}cm`).join(' | ')}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(e.id)} className="text-quaternary hover:text-[#FF6B6B] transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Add modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nouvelle mesure">
        <div className="space-y-3">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input-field" value={form.date || ''} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map(f => (
              <div key={f.key}>
                <label className="label text-xs">{f.icon} {f.label} (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field"
                  placeholder="-"
                  value={form[f.key] || ''}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="input-field" placeholder="Optionnel" value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <button onClick={handleSubmit} className="btn-primary w-full">Enregistrer</button>
        </div>
      </Modal>
    </div>
  );
}
