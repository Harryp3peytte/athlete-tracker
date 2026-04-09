'use client';

import { useState, useEffect, useCallback } from 'react';
import { Utensils, Trash2, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import MacroPieChart from '@/components/charts/MacroPieChart';
import BarChartComponent from '@/components/charts/BarChartComponent';
import Modal from '@/components/ui/Modal';
import GlassCard from '@/components/ui/GlassCard';
import FoodSearch from '@/components/forms/FoodSearch';
import type { NutritionLog } from '@/types';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER } from '@/types';

// Normalizes any variant of a meal type key to a canonical snake_case/accent-free form
// so 'petit-déjeuner' groups with 'petit_dejeuner', etc.
const normalizeMealType = (t: string) =>
  t.replace(/-/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Canonical keys used internally (always ASCII snake_case)
const CANONICAL_KEYS = MEAL_TYPE_ORDER.map(normalizeMealType);
// ['petit_dejeuner', 'dejeuner', 'gouter', 'diner', 'collation']

// Color per canonical key
const MEAL_COLORS: Record<string, string> = {
  petit_dejeuner: '#F59E0B',
  dejeuner:       '#10B981',
  gouter:         '#8B5CF6',
  diner:          '#3B82F6',
  collation:      '#EC4899',
};

// Display label per canonical key (look up via the first matching MEAL_TYPE_ORDER entry)
const labelForCanonical = (canonical: string): string => {
  const original = MEAL_TYPE_ORDER.find(k => normalizeMealType(k) === canonical);
  return original ? (MEAL_TYPE_LABELS[original] ?? canonical) : canonical;
};

interface MealTotals {
  description: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}

type MealForm = {
  meal_type: string;
};

export default function MealsPage() {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [meals, setMeals] = useState<NutritionLog[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<MealForm>({ meal_type: 'petit_dejeuner' });
  const [foodTotals, setFoodTotals] = useState<MealTotals>({ description: '', calories: 0, proteins: 0, carbs: 0, fats: 0 });

  const fetchMeals = useCallback(async () => {
    try {
      const res = await fetch(`/api/meals?date=${date}`);
      const data = await res.json();
      setMeals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur chargement repas:', err);
    }
  }, [date]);

  useEffect(() => { fetchMeals(); }, [fetchMeals]);

  const shiftDate = (dir: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + dir);
    setDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async () => {
    if (!foodTotals.calories && !foodTotals.description) return;
    await fetch('/api/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        meal_type:   form.meal_type,
        description: foodTotals.description,
        calories:    foodTotals.calories,
        proteins:    foodTotals.proteins,
        carbs:       foodTotals.carbs,
        fats:        foodTotals.fats,
      }),
    });
    setModal(false);
    setForm({ meal_type: 'petit_dejeuner' });
    setFoodTotals({ description: '', calories: 0, proteins: 0, carbs: 0, fats: 0 });
    fetchMeals();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/meals/${id}`, { method: 'DELETE' });
    fetchMeals();
  };

  const handleCopyYesterday = async () => {
    const yesterday = new Date(date + 'T12:00:00');
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    try {
      const res = await fetch(`/api/meals?date=${yesterdayStr}`);
      const yesterdayMeals: NutritionLog[] = await res.json();
      if (!Array.isArray(yesterdayMeals) || yesterdayMeals.length === 0) {
        alert('Aucun repas trouvé hier');
        return;
      }
      for (const m of yesterdayMeals) {
        await fetch('/api/meals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            meal_type: m.meal_type,
            description: m.description,
            calories: m.calories,
            proteins: m.proteins,
            carbs: m.carbs,
            fats: m.fats,
          }),
        });
      }
      fetchMeals();
    } catch (err) { console.error(err); }
  };

  // Totals
  const totalCal  = meals.reduce((s, m) => s + m.calories, 0);
  const totalP    = meals.reduce((s, m) => s + m.proteins, 0);
  const totalC    = meals.reduce((s, m) => s + m.carbs,    0);
  const totalF    = meals.reduce((s, m) => s + m.fats,     0);

  // Bar chart: calories per canonical meal type
  const barData = CANONICAL_KEYS.map(canonical => ({
    label:    labelForCanonical(canonical),
    calories: meals
      .filter(m => m.meal_type && normalizeMealType(m.meal_type) === canonical)
      .reduce((s, m) => s + m.calories, 0),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="title-apple flex items-center gap-2">
          <Utensils size={24} /> Alimentation
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleCopyYesterday}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
            style={{ background: 'rgba(255,149,0,0.1)', color: '#FF9500' }}
            title="Copier les repas de la veille"
          >
            <Copy size={14} /> Copier hier
          </button>
          <button onClick={() => setModal(true)} className="btn-primary">
            + Repas
          </button>
        </div>
      </div>

      {/* Date navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => shiftDate(-1)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ChevronLeft size={20} />
        </button>
        <span className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
          {new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', {
            weekday: 'long',
            day:     'numeric',
            month:   'long',
          })}
        </span>
        <button
          onClick={() => shiftDate(1)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Totals grid */}
      <div className="grid grid-cols-4 gap-3">
        <div className="glass-subtle rounded-xl p-4 text-center">
          <div className="num-highlight text-2xl font-bold" style={{ color: '#FF9F0A' }}>{totalCal}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>kcal</div>
        </div>
        <div className="glass-subtle rounded-xl p-4 text-center">
          <div className="num-highlight text-2xl font-bold" style={{ color: '#2AC956' }}>{Math.round(totalP)}g</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Protéines</div>
        </div>
        <div className="glass-subtle rounded-xl p-4 text-center">
          <div className="num-highlight text-2xl font-bold" style={{ color: '#64D2FF' }}>{Math.round(totalC)}g</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Glucides</div>
        </div>
        <div className="glass-subtle rounded-xl p-4 text-center">
          <div className="num-highlight text-2xl font-bold" style={{ color: '#FF9F0A' }}>{Math.round(totalF)}g</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Lipides</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 section-header">Répartition par repas</h3>
          <BarChartComponent
            data={barData}
            bars={[{ dataKey: 'calories', color: '#FF9F0A', name: 'Calories (kcal)' }]}
            height={220}
          />
        </GlassCard>
        <GlassCard>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 section-header">Macronutriments</h3>
          <MacroPieChart proteins={totalP} carbs={totalC} fats={totalF} height={220} />
        </GlassCard>
      </div>

      {/* Meals grouped by canonical type */}
      <div className="space-y-3">
        {CANONICAL_KEYS.map(canonical => {
          const group = meals.filter(
            m => m.meal_type && normalizeMealType(m.meal_type) === canonical
          );
          if (group.length === 0) return null;
          return (
            <GlassCard key={canonical}>
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: MEAL_COLORS[canonical] ?? 'var(--text-secondary)' }}
              >
                {labelForCanonical(canonical)}
              </h3>
              <div className="space-y-2">
                {group.map(m => (
                  <div
                    key={m.id}
                    className="glass-subtle rounded-xl flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{m.description ?? '—'}</span>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {Math.round(m.proteins)}g P &nbsp;|&nbsp;
                        {Math.round(m.carbs)}g G &nbsp;|&nbsp;
                        {Math.round(m.fats)}g L
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium" style={{ color: '#FF9F0A' }}>{m.calories} kcal</span>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="hover:text-[#FF6B6B] transition-colors"
                        style={{ color: 'var(--text-quaternary)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          );
        })}
        {meals.length === 0 && (
          <GlassCard>
            <div className="text-center py-10" style={{ color: 'var(--text-tertiary)' }}>
              Aucun repas enregistré pour ce jour
            </div>
          </GlassCard>
        )}
      </div>

      {/* Add meal modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Ajouter un repas">
        <div className="space-y-4">
          <div>
            <label className="label">Type de repas</label>
            <select
              className="input-field"
              value={form.meal_type}
              onChange={e => setForm(f => ({ ...f, meal_type: e.target.value }))}
            >
              {MEAL_TYPE_ORDER.map(key => (
                <option key={key} value={key}>
                  {MEAL_TYPE_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Aliments</label>
            <FoodSearch onTotalsChange={setFoodTotals} />
          </div>

          <button onClick={handleSubmit} className="btn-primary w-full">
            Ajouter
          </button>
        </div>
      </Modal>
    </div>
  );
}
