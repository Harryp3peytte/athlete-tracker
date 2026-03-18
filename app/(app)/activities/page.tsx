'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dumbbell, Trash2, Trophy } from 'lucide-react';
import BarChartComponent from '@/components/charts/BarChartComponent';
import Modal from '@/components/ui/Modal';
import GlassCard from '@/components/ui/GlassCard';
import type { CardioLog } from '@/types';
import { CARDIO_TYPE_LABELS } from '@/types';
import { estimateCalories } from '@/lib/calorieEstimator';

type Period   = '7d' | '30d';
type CardioType = keyof typeof CARDIO_TYPE_LABELS;
type TypeFilter = CardioType | 'all';

interface RecordsData {
  longestActivity:    CardioLog | null;
  mostCaloriesBurned: CardioLog | null;
  longestDistance:    CardioLog | null;
}

type ActivityForm = {
  activity_type:    string;
  date:             string;
  duration_minutes: string;
  calories_burned:  string;
  distance_km:      string;
  notes:            string;
};

const today = () => new Date().toISOString().split('T')[0];

const EMPTY_FORM: ActivityForm = {
  activity_type:    'running',
  date:             today(),
  duration_minutes: '',
  calories_burned:  '',
  distance_km:      '',
  notes:            '',
};

// Group activities by ISO week (Mon–Sun) and return label "Sem. N"
const getWeekKey = (dateStr: string): string => {
  const d    = new Date(dateStr + 'T12:00:00');
  const day  = d.getDay() === 0 ? 7 : d.getDay(); // Mon=1 … Sun=7
  const mon  = new Date(d);
  mon.setDate(d.getDate() - day + 1);
  return mon.toISOString().split('T')[0];
};

const weekLabel = (key: string): string => {
  const d   = new Date(key + 'T12:00:00');
  const jan = new Date(d.getFullYear(), 0, 1);
  const wn  = Math.ceil(((d.getTime() - jan.getTime()) / 86400000 + jan.getDay() + 1) / 7);
  return `S${wn}`;
};

export default function ActivitiesPage() {
  const [period, setPeriod]           = useState<Period>('7d');
  const [typeFilter, setTypeFilter]   = useState<TypeFilter>('all');
  const [activities, setActivities]   = useState<CardioLog[]>([]);
  const [records, setRecords]         = useState<RecordsData>({
    longestActivity:    null,
    mostCaloriesBurned: null,
    longestDistance:    null,
  });
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState<ActivityForm>(EMPTY_FORM);
  const [userWeight, setUserWeight] = useState<number>(75);

  // Fetch user weight for calorie estimation
  useEffect(() => {
    fetch('/api/weight?period=7d')
      .then(r => r.json())
      .then(data => { if (data?.current) setUserWeight(data.current); })
      .catch(() => {});
  }, []);

  // Auto-estimate calories when type or duration change
  useEffect(() => {
    if (form.activity_type && form.duration_minutes) {
      const dur = parseInt(form.duration_minutes, 10);
      if (dur > 0) {
        const est = estimateCalories(form.activity_type, dur, userWeight);
        setForm(f => ({ ...f, calories_burned: String(est) }));
      }
    }
  }, [form.activity_type, form.duration_minutes, userWeight]);

  // ── Fetchers ────────────────────────────────────────────────────────────────

  const fetchActivities = useCallback(async () => {
    try {
      const typeParam = typeFilter !== 'all' ? `&type=${typeFilter}` : '';
      const res  = await fetch(`/api/activities?period=${period}${typeParam}`);
      const data = await res.json();
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur chargement activités:', err);
    }
  }, [period, typeFilter]);

  const fetchRecords = useCallback(async () => {
    try {
      const res  = await fetch('/api/stats/records');
      if (res.ok) setRecords(await res.json());
    } catch (err) {
      console.error('Erreur chargement records:', err);
    }
  }, []);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);
  useEffect(() => { fetchRecords();    }, [fetchRecords]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.duration_minutes || !form.calories_burned) return;
    await fetch('/api/activities', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_type:    form.activity_type,
        date:             form.date || today(),
        duration_minutes: parseInt(form.duration_minutes, 10),
        calories_burned:  parseInt(form.calories_burned,  10),
        distance_km:      form.distance_km ? parseFloat(form.distance_km) : null,
        notes:            form.notes || null,
      }),
    });
    setModal(false);
    setForm({ ...EMPTY_FORM, date: today() });
    fetchActivities();
    fetchRecords();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/activities/${id}`, { method: 'DELETE' });
    fetchActivities();
    fetchRecords();
  };

  // ── Chart data — grouped by ISO week ────────────────────────────────────────

  const byWeek = activities.reduce<Record<string, { calories: number; duration: number }>>(
    (acc, a) => {
      const key = getWeekKey(a.date);
      if (!acc[key]) acc[key] = { calories: 0, duration: 0 };
      acc[key].calories += a.calories_burned;
      acc[key].duration += a.duration_minutes;
      return acc;
    },
    {}
  );

  const weeklyChartData = Object.entries(byWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({
      semaine:  weekLabel(key),
      calories: v.calories,
      duree:    v.duration,
    }));

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const typeLabel  = (t: string) => CARDIO_TYPE_LABELS[t as CardioType] ?? t;
  const formatDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'short',
    });

  const CARDIO_TYPES = Object.keys(CARDIO_TYPE_LABELS) as CardioType[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="title-apple flex items-center gap-2">
          <span style={{ background: '#FF6B6B15', borderRadius: '10px', padding: '6px' }}>
            <Dumbbell size={24} style={{ color: '#FF6B6B' }} />
          </span>
          Activités cardio
        </h1>
        <button onClick={() => setModal(true)} className="btn-primary">
          + Activité
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
                ? { background: '#FF6B6B', color: '#fff' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
            }
          >
            {p === '7d' ? '7 jours' : '30 jours'}
          </button>
        ))}
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTypeFilter('all')}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={
            typeFilter === 'all'
              ? { background: 'rgba(255,255,255,0.1)', color: '#fff' }
              : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)' }
          }
        >
          Toutes
        </button>
        {CARDIO_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={
              typeFilter === t
                ? { background: 'rgba(255,255,255,0.1)', color: '#fff' }
                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)' }
            }
          >
            {CARDIO_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Charts */}
      {weeklyChartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
              Calories brûlées / semaine
            </h3>
            <BarChartComponent
              data={weeklyChartData}
              bars={[{ dataKey: 'calories', color: '#FF6B6B', name: 'Calories (kcal)' }]}
              xKey="semaine"
              height={220}
            />
          </GlassCard>
          <GlassCard>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
              Durée / semaine (min)
            </h3>
            <BarChartComponent
              data={weeklyChartData}
              bars={[{ dataKey: 'duree', color: '#64D2FF', name: 'Durée (min)' }]}
              xKey="semaine"
              height={220}
            />
          </GlassCard>
        </div>
      )}

      {/* Personal records */}
      {(records.longestActivity || records.mostCaloriesBurned || records.longestDistance) && (
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
            <Trophy size={20} style={{ color: '#FF9F0A' }} /> Records personnels
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Longest duration */}
            <GlassCard>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                Activité la plus longue
              </p>
              {records.longestActivity ? (
                <>
                  <p className="num-highlight text-2xl" style={{ color: '#FF9F0A' }}>
                    {records.longestActivity.duration_minutes} min
                  </p>
                  <p className="text-sm text-white/40 mt-1">
                    {typeLabel(records.longestActivity.activity_type)}
                  </p>
                  <p className="text-xs text-white/20 mt-0.5">
                    {formatDate(records.longestActivity.date)}
                  </p>
                </>
              ) : (
                <p className="text-white/30 text-sm">Aucune donnée</p>
              )}
            </GlassCard>

            {/* Most calories */}
            <GlassCard>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                Plus de calories brûlées
              </p>
              {records.mostCaloriesBurned ? (
                <>
                  <p className="num-highlight text-2xl" style={{ color: '#FF9F0A' }}>
                    {records.mostCaloriesBurned.calories_burned} kcal
                  </p>
                  <p className="text-sm text-white/40 mt-1">
                    {typeLabel(records.mostCaloriesBurned.activity_type)}
                  </p>
                  <p className="text-xs text-white/20 mt-0.5">
                    {formatDate(records.mostCaloriesBurned.date)}
                  </p>
                </>
              ) : (
                <p className="text-white/30 text-sm">Aucune donnée</p>
              )}
            </GlassCard>

            {/* Longest distance */}
            <GlassCard>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                Distance la plus longue
              </p>
              {records.longestDistance ? (
                <>
                  <p className="num-highlight text-2xl" style={{ color: '#FF9F0A' }}>
                    {records.longestDistance.distance_km != null
                      ? records.longestDistance.distance_km.toFixed(2)
                      : '—'} km
                  </p>
                  <p className="text-sm text-white/40 mt-1">
                    {typeLabel(records.longestDistance.activity_type)}
                  </p>
                  <p className="text-xs text-white/20 mt-0.5">
                    {formatDate(records.longestDistance.date)}
                  </p>
                </>
              ) : (
                <p className="text-white/30 text-sm">Aucune donnée</p>
              )}
            </GlassCard>
          </div>
        </div>
      )}

      {/* Activity list */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Historique</h3>
        {activities.length === 0 ? (
          <GlassCard className="text-white/30 text-center py-10">
            <Dumbbell size={32} className="mx-auto mb-3 opacity-40" />
            Aucune activité pour cette période
          </GlassCard>
        ) : (
          activities.map(a => (
            <div
              key={a.id}
              className="glass-subtle rounded-xl px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{typeLabel(a.activity_type)}</span>
                  <span className="text-xs text-white/40">{formatDate(a.date)}</span>
                </div>
                <div className="flex gap-4 mt-1.5 text-xs text-white/40 flex-wrap">
                  <span>
                    <span className="font-semibold" style={{ color: '#64D2FF' }}>{a.duration_minutes} min</span>
                  </span>
                  {a.distance_km != null && (
                    <span>
                      <span className="font-semibold" style={{ color: '#2AC956' }}>{a.distance_km.toFixed(2)} km</span>
                    </span>
                  )}
                  <span>
                    <span className="font-semibold" style={{ color: '#FF6B6B' }}>{a.calories_burned} kcal</span>
                  </span>
                  {a.notes && (
                    <span className="text-white/20 italic truncate max-w-xs">{a.notes}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(a.id)}
                className="text-white/20 hover:text-[#FF6B6B] transition-colors p-1 shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add activity modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Ajouter une activité">
        <div className="space-y-4">
          <div>
            <label className="label">Type d&apos;activité</label>
            <select
              className="input-field"
              value={form.activity_type}
              onChange={e => setForm(f => ({ ...f, activity_type: e.target.value }))}
            >
              {CARDIO_TYPES.map(t => (
                <option key={t} value={t}>{CARDIO_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input-field"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Durée (min)</label>
              <input
                type="number"
                min="1"
                step="1"
                className="input-field"
                placeholder="Ex : 45"
                value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Calories brûlées</label>
              <input
                type="number"
                min="0"
                step="1"
                className="input-field"
                placeholder="Ex : 350"
                value={form.calories_burned}
                onChange={e => setForm(f => ({ ...f, calories_burned: e.target.value }))}
              />
              {form.duration_minutes && form.calories_burned && (
                <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Estimation basée sur {userWeight} kg
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="label">Distance (km) — optionnel</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input-field"
              placeholder="Ex : 5.2"
              value={form.distance_km}
              onChange={e => setForm(f => ({ ...f, distance_km: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Notes (optionnel)</label>
            <input
              className="input-field"
              placeholder="Ex : Séance en côtes"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <button onClick={handleSubmit} className="btn-primary w-full">
            Ajouter
          </button>
        </div>
      </Modal>
    </div>
  );
}
