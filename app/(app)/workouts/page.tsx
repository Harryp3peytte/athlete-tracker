'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dumbbell, Trash2, Plus, Play, ChevronUp, ChevronDown, Minus, Edit3, X, Check, Timer, SkipForward } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import BottomSheet from '@/components/ui/BottomSheet';
import GlassCard from '@/components/ui/GlassCard';
import type { WorkoutSession, WorkoutTemplate, WorkoutTemplateExercise, ExerciseHistory, SeriesData } from '@/types';
import { WEEKDAY_LABELS } from '@/types';
import { useTimer } from '@/hooks/useTimer';
import { useCountdown } from '@/hooks/useCountdown';

type Tab = 'programme' | 'seances' | 'historique';

type TemplateFormExercise = {
  exercise_name: string;
  sets: string;
  reps: string;
  sort_order: number;
};

type ActiveSeries = {
  setNumber: number;
  reps: number;
  weight_kg: string;
  completed: boolean;
};

type ActiveExercise = {
  exercise_name: string;
  targetSets: number;
  targetReps: number;
  series: ActiveSeries[];
  notes: string;
  lastWeight: string | null;
  lastDate: string | null;
};

type ProgramDay = {
  weekday: number;
  template_id: string | null;
  template: WorkoutTemplate | null;
  id: string | null;
};

const REST_PRESETS = [30, 60, 90, 120, 150, 180];

export default function WorkoutsPage() {
  const [tab, setTab] = useState<Tab>('programme');

  // Data
  const [program, setProgram] = useState<ProgramDay[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  // Modals
  const [templateModal, setTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [assignModal, setAssignModal] = useState<number | null>(null);
  const [launchOtherModal, setLaunchOtherModal] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  // Active session
  const [activeSession, setActiveSession] = useState<{
    templateName: string;
    templateId: string;
    exercises: ActiveExercise[];
  } | null>(null);
  const [sessionSummary, setSessionSummary] = useState<{
    name: string;
    duration: number;
    totalVolume: number;
    exercises: Array<{
      name: string;
      series: SeriesData[];
      notes: string;
      diff: 'up' | 'down' | 'same' | 'new';
    }>;
  } | null>(null);

  // Rest timer
  const [restTimerOpen, setRestTimerOpen] = useState(false);
  const [restDuration, setRestDuration] = useState(90);
  const countdown = useCountdown(90);
  const sessionTimer = useTimer();

  // Template form
  const [templateForm, setTemplateForm] = useState({
    name: '',
    exercises: [{ exercise_name: '', sets: '3', reps: '10', sort_order: 0 }] as TemplateFormExercise[],
  });

  // Fetchers
  const fetchProgram = useCallback(async () => {
    try {
      const res = await fetch('/api/workouts/program');
      if (res.ok) setProgram(await res.json());
    } catch (err) { console.error('Program fetch error:', err); }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/workouts/templates');
      if (res.ok) setTemplates(await res.json());
    } catch (err) { console.error('Templates fetch error:', err); }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/workouts/sessions');
      if (res.ok) setSessions(await res.json());
    } catch (err) { console.error('Sessions fetch error:', err); }
  }, []);

  useEffect(() => {
    fetchProgram();
    fetchTemplates();
    fetchSessions();
  }, [fetchProgram, fetchTemplates, fetchSessions]);

  const jsDow = new Date().getDay();
  const todayWeekday = jsDow === 0 ? 6 : jsDow - 1;

  // ── Template CRUD ──
  const openCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({ name: '', exercises: [{ exercise_name: '', sets: '3', reps: '10', sort_order: 0 }] });
    setTemplateModal(true);
  };

  const openEditTemplate = (t: WorkoutTemplate) => {
    setEditingTemplate(t);
    setTemplateForm({
      name: t.name,
      exercises: (t.workout_template_exercises || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((e, i) => ({ exercise_name: e.exercise_name, sets: String(e.sets), reps: String(e.reps), sort_order: i })),
    });
    setTemplateModal(true);
  };

  const addTemplateExercise = () => {
    setTemplateForm(f => ({
      ...f,
      exercises: [...f.exercises, { exercise_name: '', sets: '3', reps: '10', sort_order: f.exercises.length }],
    }));
  };

  const removeTemplateExercise = (index: number) => {
    setTemplateForm(f => ({
      ...f,
      exercises: f.exercises.filter((_, i) => i !== index).map((e, i) => ({ ...e, sort_order: i })),
    }));
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    setTemplateForm(f => {
      const exs = [...f.exercises];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= exs.length) return f;
      [exs[index], exs[target]] = [exs[target], exs[index]];
      return { ...f, exercises: exs.map((e, i) => ({ ...e, sort_order: i })) };
    });
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name) return;
    const payload = {
      name: templateForm.name,
      exercises: templateForm.exercises
        .filter(e => e.exercise_name)
        .map((e, i) => ({ exercise_name: e.exercise_name, sets: parseInt(e.sets) || 3, reps: parseInt(e.reps) || 10, sort_order: i })),
    };
    try {
      const url = editingTemplate ? `/api/workouts/templates/${editingTemplate.id}` : '/api/workouts/templates';
      const method = editingTemplate ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const data = await res.json(); alert(`Erreur: ${data.error}`); return; }
      setTemplateModal(false);
      setEditingTemplate(null);
      fetchTemplates();
      fetchProgram();
    } catch (err) { console.error('Template save error:', err); }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Supprimer cette séance type ?')) return;
    await fetch(`/api/workouts/templates/${id}`, { method: 'DELETE' });
    fetchTemplates();
    fetchProgram();
  };

  const handleDuplicateTemplate = async (t: WorkoutTemplate) => {
    const payload = {
      name: `${t.name} (copie)`,
      exercises: (t.workout_template_exercises || []).map((e, i) => ({
        exercise_name: e.exercise_name, sets: e.sets, reps: e.reps, sort_order: i,
      })),
    };
    await fetch('/api/workouts/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    fetchTemplates();
  };

  // ── Program assignment ──
  const handleAssign = async (weekday: number, templateId: string | null) => {
    try {
      const res = await fetch('/api/workouts/program', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments: [{ weekday, template_id: templateId }] }),
      });
      if (res.ok) setProgram(await res.json());
    } catch (err) { console.error('Assign error:', err); }
    setAssignModal(null);
  };

  // ── Launch session ──
  const handleLaunchSession = async (template: WorkoutTemplate) => {
    const exercises: ActiveExercise[] = [];
    const templateExercises = (template.workout_template_exercises || [])
      .sort((a: WorkoutTemplateExercise, b: WorkoutTemplateExercise) => a.sort_order - b.sort_order);

    for (const ex of templateExercises) {
      let lastWeight: string | null = null;
      let lastDate: string | null = null;
      try {
        const res = await fetch(`/api/workouts/exercise-history?name=${encodeURIComponent(ex.exercise_name)}`);
        if (res.ok) {
          const history: ExerciseHistory[] = await res.json();
          if (history.length > 0) {
            const last = history[history.length - 1];
            lastWeight = last.weight_kg != null ? String(last.weight_kg) : null;
            lastDate = last.date;
          }
        }
      } catch { /* ignore */ }

      // Create individual series pre-filled
      const series: ActiveSeries[] = Array.from({ length: ex.sets }, (_, i) => ({
        setNumber: i + 1,
        reps: ex.reps,
        weight_kg: lastWeight || '',
        completed: false,
      }));

      exercises.push({
        exercise_name: ex.exercise_name,
        targetSets: ex.sets,
        targetReps: ex.reps,
        series,
        notes: '',
        lastWeight,
        lastDate,
      });
    }

    setActiveSession({ templateName: template.name, templateId: template.id, exercises });
    sessionTimer.reset();
    sessionTimer.start();
    setLaunchOtherModal(false);
  };

  const handleFinishSession = async () => {
    if (!activeSession) return;
    sessionTimer.pause();

    const exercises = activeSession.exercises.map(ex => {
      const completedSeries = ex.series.filter(s => s.completed);
      const totalSets = completedSeries.length;
      const avgReps = totalSets > 0 ? Math.round(completedSeries.reduce((s, serie) => s + serie.reps, 0) / totalSets) : ex.targetReps;
      const maxWeight = completedSeries.length > 0
        ? Math.max(...completedSeries.map(s => parseFloat(s.weight_kg) || 0))
        : null;

      const seriesData: SeriesData[] = ex.series
        .filter(s => s.completed)
        .map(s => ({
          set: s.setNumber,
          reps: s.reps,
          weight_kg: parseFloat(s.weight_kg) || 0,
          completed: true,
        }));

      return {
        exercise_name: ex.exercise_name,
        sets: totalSets || ex.targetSets,
        reps: avgReps,
        weight_kg: maxWeight,
        notes: ex.notes || null,
        series_data: seriesData,
      };
    });

    try {
      const res = await fetch('/api/workouts/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          name: activeSession.templateName,
          duration_seconds: sessionTimer.seconds,
          exercises,
        }),
      });

      if (!res.ok) { const data = await res.json(); alert(`Erreur: ${data.error}`); return; }

      // Build summary
      const totalVolume = activeSession.exercises.reduce((total, ex) => {
        return total + ex.series
          .filter(s => s.completed)
          .reduce((sum, s) => sum + s.reps * (parseFloat(s.weight_kg) || 0), 0);
      }, 0);

      const summaryExercises = activeSession.exercises.map(ex => {
        const completedSeries = ex.series.filter(s => s.completed);
        const maxWeight = completedSeries.length > 0
          ? Math.max(...completedSeries.map(s => parseFloat(s.weight_kg) || 0))
          : null;
        const prevWeight = ex.lastWeight ? parseFloat(ex.lastWeight) : null;
        let diff: 'up' | 'down' | 'same' | 'new' = 'new';
        if (maxWeight != null && prevWeight != null) {
          diff = maxWeight > prevWeight ? 'up' : maxWeight < prevWeight ? 'down' : 'same';
        }
        return {
          name: ex.exercise_name,
          series: completedSeries.map(s => ({
            set: s.setNumber,
            reps: s.reps,
            weight_kg: parseFloat(s.weight_kg) || 0,
            completed: true,
          })),
          notes: ex.notes,
          diff,
        };
      });

      setSessionSummary({
        name: activeSession.templateName,
        duration: sessionTimer.seconds,
        totalVolume: Math.round(totalVolume),
        exercises: summaryExercises,
      });
      setActiveSession(null);
      sessionTimer.reset();
      fetchSessions();
    } catch (err) { console.error('Finish session error:', err); }
  };

  const handleDeleteSession = async (id: string) => {
    await fetch(`/api/workouts/sessions/${id}`, { method: 'DELETE' });
    fetchSessions();
  };

  // ── Active exercise helpers ──
  const updateSeries = (exIdx: number, seriesIdx: number, field: keyof ActiveSeries, value: string | number | boolean) => {
    if (!activeSession) return;
    const exercises = [...activeSession.exercises];
    const series = [...exercises[exIdx].series];
    series[seriesIdx] = { ...series[seriesIdx], [field]: value };
    exercises[exIdx] = { ...exercises[exIdx], series };
    setActiveSession({ ...activeSession, exercises });
  };

  const addSeries = (exIdx: number) => {
    if (!activeSession) return;
    const exercises = [...activeSession.exercises];
    const ex = exercises[exIdx];
    const lastSeries = ex.series[ex.series.length - 1];
    ex.series = [...ex.series, {
      setNumber: ex.series.length + 1,
      reps: lastSeries?.reps || ex.targetReps,
      weight_kg: lastSeries?.weight_kg || '',
      completed: false,
    }];
    exercises[exIdx] = { ...ex };
    setActiveSession({ ...activeSession, exercises });
  };

  const updateExerciseNotes = (exIdx: number, notes: string) => {
    if (!activeSession) return;
    const exercises = [...activeSession.exercises];
    exercises[exIdx] = { ...exercises[exIdx], notes };
    setActiveSession({ ...activeSession, exercises });
  };

  const handleSeriesComplete = (exIdx: number, seriesIdx: number) => {
    updateSeries(exIdx, seriesIdx, 'completed', true);
    // Open rest timer
    countdown.reset(restDuration);
    countdown.start(restDuration);
    setRestTimerOpen(true);
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ── ACTIVE SESSION SCREEN ──
  if (activeSession) {
    return (
      <div className="space-y-4 pb-20">
        {/* Sticky header with timer */}
        <div
          className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 -mx-4 -mt-4 mb-2"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(180, 130, 130, 0.15)',
          }}
        >
          <div className="flex items-center gap-3">
            <Timer size={18} style={{ color: '#BF5AF2' }} />
            <span className="font-mono text-lg font-bold" style={{ color: '#1A1A1A' }}>
              {sessionTimer.formatTime()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: '#BF5AF2' }}>{activeSession.templateName}</span>
            <button
              onClick={() => { if (confirm('Abandonner la séance ?')) { setActiveSession(null); sessionTimer.reset(); } }}
              className="text-secondary hover:text-[#FF6B6B] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Exercises */}
        {activeSession.exercises.map((ex, exIdx) => (
          <GlassCard key={exIdx}>
            <div className="space-y-3">
              {/* Exercise header */}
              <div className="flex items-center justify-between">
                <span className="font-semibold" style={{ color: '#1A1A1A' }}>{ex.exercise_name}</span>
                {ex.lastWeight && (
                  <span className="text-xs italic" style={{ color: '#9B8A8A' }}>
                    Dernier : {ex.lastWeight} kg
                    {ex.lastDate && ` le ${new Date(ex.lastDate + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                  </span>
                )}
              </div>

              {/* Series table header */}
              <div className="grid grid-cols-[40px_1fr_1fr_40px] gap-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9B8A8A' }}>
                <span>Série</span>
                <span>Reps</span>
                <span>Poids (kg)</span>
                <span className="text-center">OK</span>
              </div>

              {/* Series rows */}
              {ex.series.map((s, sIdx) => (
                <div
                  key={sIdx}
                  className="grid grid-cols-[40px_1fr_1fr_40px] gap-2 items-center rounded-lg px-2 py-1.5 transition-colors"
                  style={{
                    background: s.completed ? 'rgba(42, 201, 86, 0.08)' : 'rgba(0,0,0,0.02)',
                    border: s.completed ? '1px solid rgba(42, 201, 86, 0.2)' : '1px solid transparent',
                  }}
                >
                  <span className="text-sm font-bold text-center" style={{ color: s.completed ? '#2AC956' : '#6B5B5B' }}>
                    {s.setNumber}
                  </span>
                  <input
                    type="number"
                    className="input-field !py-1.5 text-sm text-center"
                    value={s.reps}
                    onChange={e => updateSeries(exIdx, sIdx, 'reps', parseInt(e.target.value) || 0)}
                    disabled={s.completed}
                  />
                  <input
                    type="number"
                    step="0.5"
                    className="input-field !py-1.5 text-sm text-center"
                    value={s.weight_kg}
                    onChange={e => updateSeries(exIdx, sIdx, 'weight_kg', e.target.value)}
                    disabled={s.completed}
                    placeholder="0"
                  />
                  <div className="flex justify-center">
                    {s.completed ? (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#2AC956' }}>
                        <Check size={14} color="#fff" />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSeriesComplete(exIdx, sIdx)}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)' }}
                      >
                        <Check size={14} style={{ color: '#9B8A8A' }} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Add series */}
              <button
                onClick={() => addSeries(exIdx)}
                className="flex items-center gap-1 text-xs font-medium"
                style={{ color: '#BF5AF2' }}
              >
                <Plus size={12} /> Ajouter une série
              </button>

              {/* Notes */}
              <div>
                <input
                  className="input-field text-xs w-full"
                  placeholder="Notes (ex: remplacé par incliné, douleur épaule...)"
                  value={ex.notes}
                  onChange={e => updateExerciseNotes(exIdx, e.target.value)}
                />
              </div>
            </div>
          </GlassCard>
        ))}

        {/* Finish button */}
        <button
          onClick={handleFinishSession}
          className="btn-primary w-full py-3 text-lg font-semibold"
          style={{ background: '#BF5AF2' }}
        >
          <Check size={20} className="inline mr-2" />
          Terminer la séance
        </button>

        {/* Rest Timer Bottom Sheet */}
        <BottomSheet isOpen={restTimerOpen} onClose={() => { setRestTimerOpen(false); countdown.skip(); }} title="Repos">
          <div className="flex flex-col items-center py-4">
            {/* Countdown ring */}
            <div className="relative" style={{ width: 160, height: 160 }}>
              <svg width={160} height={160} style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx={80} cy={80} r={70}
                  fill="none"
                  stroke="rgba(0,0,0,0.06)"
                  strokeWidth={8}
                />
                <circle
                  cx={80} cy={80} r={70}
                  fill="none"
                  stroke="#BF5AF2"
                  strokeWidth={8}
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 70}
                  strokeDashoffset={2 * Math.PI * 70 * (1 - (countdown.remaining / restDuration))}
                  style={{
                    transition: 'stroke-dashoffset 1s linear',
                    filter: 'drop-shadow(0 0 8px rgba(191, 90, 242, 0.4))',
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-3xl font-bold" style={{ color: countdown.remaining === 0 ? '#2AC956' : '#1A1A1A' }}>
                  {countdown.formatCountdown()}
                </span>
              </div>
            </div>

            {countdown.remaining === 0 && (
              <p className="text-sm font-semibold mt-2" style={{ color: '#2AC956' }}>Repos terminé !</p>
            )}

            {/* Duration presets */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {REST_PRESETS.map(sec => (
                <button
                  key={sec}
                  onClick={() => {
                    setRestDuration(sec);
                    countdown.start(sec);
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    background: restDuration === sec ? '#BF5AF2' : 'rgba(0,0,0,0.05)',
                    color: restDuration === sec ? '#fff' : '#6B5B5B',
                  }}
                >
                  {sec}s
                </button>
              ))}
            </div>

            {/* Skip button */}
            <button
              onClick={() => { setRestTimerOpen(false); countdown.skip(); }}
              className="flex items-center gap-2 mt-6 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: 'rgba(0,0,0,0.05)', color: '#6B5B5B' }}
            >
              <SkipForward size={16} />
              {countdown.remaining === 0 ? 'Fermer' : 'Skip — Série suivante'}
            </button>
          </div>
        </BottomSheet>
      </div>
    );
  }

  // ── SESSION SUMMARY SCREEN ──
  if (sessionSummary) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <div className="text-4xl">&#127942;</div>
          <h1 className="title-apple">Séance terminée !</h1>
          <p className="text-secondary">{sessionSummary.name}</p>
        </div>

        {/* Stats bar */}
        <div className="flex justify-center gap-6">
          <div className="text-center">
            <div className="text-xl font-bold" style={{ color: '#BF5AF2' }}>{formatDuration(sessionSummary.duration)}</div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: '#9B8A8A' }}>Durée</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold" style={{ color: '#FF9500' }}>{sessionSummary.exercises.length}</div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: '#9B8A8A' }}>Exercices</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold" style={{ color: '#2AC956' }}>{sessionSummary.totalVolume.toLocaleString()} kg</div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: '#9B8A8A' }}>Volume total</div>
          </div>
        </div>

        {/* Exercise details */}
        <GlassCard>
          <h3 className="section-header mb-3">Détail par exercice</h3>
          <div className="space-y-4">
            {sessionSummary.exercises.map((ex, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{ex.name}</span>
                  <div className="flex items-center gap-1">
                    {ex.diff === 'up' && <ChevronUp size={14} className="text-[#2AC956]" />}
                    {ex.diff === 'down' && <ChevronDown size={14} className="text-[#FF6B6B]" />}
                    {ex.diff === 'same' && <Minus size={14} className="text-tertiary" />}
                  </div>
                </div>
                {ex.series.map((s, j) => (
                  <div key={j} className="flex items-center gap-2 text-xs glass-subtle rounded-lg px-3 py-1.5">
                    <span className="font-semibold" style={{ color: '#6B5B5B' }}>Série {s.set}</span>
                    <span style={{ color: '#9B8A8A' }}>:</span>
                    <span style={{ color: '#1A1A1A' }}>{s.reps} reps</span>
                    <span style={{ color: '#9B8A8A' }}>&times;</span>
                    <span style={{ color: '#1A1A1A' }}>{s.weight_kg} kg</span>
                    <Check size={12} className="text-[#2AC956] ml-auto" />
                  </div>
                ))}
                {ex.notes && (
                  <p className="text-xs italic px-3" style={{ color: '#9B8A8A' }}>
                    {ex.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </GlassCard>

        <button
          onClick={() => { setSessionSummary(null); setTab('historique'); }}
          className="btn-primary w-full"
          style={{ background: '#BF5AF2' }}
        >
          Voir l&apos;historique
        </button>
      </div>
    );
  }

  // ── MAIN PAGE WITH TABS ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="title-apple flex items-center gap-2">
          <span style={{ background: '#BF5AF215' }} className="w-9 h-9 rounded-xl flex items-center justify-center">
            <Dumbbell size={20} style={{ color: '#BF5AF2' }} />
          </span>
          Musculation
        </h1>
        {tab === 'seances' && (
          <button onClick={openCreateTemplate} className="btn-primary">+ Séance type</button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { key: 'programme' as Tab, label: 'Programme' },
          { key: 'seances' as Tab, label: 'Séances types' },
          { key: 'historique' as Tab, label: 'Historique' },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={tab === t.key
              ? { background: '#BF5AF2', color: 'var(--text-primary)' }
              : { background: 'var(--bg-input)', color: 'var(--text-secondary)' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB 1: Programme ─── */}
      {tab === 'programme' && (
        <div className="space-y-2">
          {WEEKDAY_LABELS.map((dayLabel, i) => {
            const day = program.find(p => p.weekday === i);
            const isToday = i === todayWeekday;
            const tmpl = day?.template;

            return (
              <GlassCard key={i} className={isToday ? 'ring-2 ring-[#BF5AF2]' : ''}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex flex-col items-center" style={{ minWidth: 48 }}>
                      <span className={`text-xs font-bold uppercase ${isToday ? 'text-[#BF5AF2]' : 'text-secondary'}`}>
                        {dayLabel.slice(0, 3)}
                      </span>
                      {isToday && <span className="text-[8px] text-[#BF5AF2] mt-0.5">Aujourd&apos;hui</span>}
                    </div>

                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setAssignModal(i)}>
                      {tmpl ? (
                        <div>
                          <span className="font-medium text-sm truncate block">{tmpl.name}</span>
                          <span className="text-xs text-tertiary">
                            {(tmpl.workout_template_exercises || []).length} exercice{(tmpl.workout_template_exercises || []).length > 1 ? 's' : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-quaternary text-sm italic">Repos</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-2">
                    {tmpl && (
                      <button
                        onClick={() => handleLaunchSession(tmpl)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                        style={{ background: '#BF5AF220', color: '#BF5AF2' }}
                      >
                        <Play size={12} /> Lancer
                      </button>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}

          {/* Launch another session button */}
          <button
            onClick={() => setLaunchOtherModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors"
            style={{
              background: 'rgba(191, 90, 242, 0.08)',
              color: '#BF5AF2',
              border: '1px dashed rgba(191, 90, 242, 0.3)',
            }}
          >
            <Play size={16} /> Lancer une autre séance
          </button>
        </div>
      )}

      {/* ─── TAB 2: Séances types ─── */}
      {tab === 'seances' && (
        <div className="space-y-3">
          {templates.length === 0 && (
            <GlassCard>
              <p className="text-secondary text-center py-8">
                Aucune séance type créée. Crée ta première séance type !
              </p>
            </GlassCard>
          )}
          {templates.map(t => (
            <GlassCard key={t.id}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">{t.name}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditTemplate(t)} className="text-tertiary hover:text-[#BF5AF2] transition-colors p-1" title="Modifier">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => handleDuplicateTemplate(t)} className="text-tertiary hover:text-[#2AC956] transition-colors p-1" title="Dupliquer">
                    <Plus size={14} />
                  </button>
                  <button onClick={() => handleDeleteTemplate(t.id)} className="text-tertiary hover:text-[#FF6B6B] transition-colors p-1" title="Supprimer">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {(t.workout_template_exercises || []).length > 0 && (
                <div className="space-y-1">
                  {(t.workout_template_exercises || [])
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map(e => (
                      <div key={e.id} className="flex justify-between text-sm glass-subtle rounded-lg px-3 py-2">
                        <span>{e.exercise_name}</span>
                        <span className="text-secondary">{e.sets} x {e.reps}</span>
                      </div>
                    ))}
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}

      {/* ─── TAB 3: Historique (with detailed series) ─── */}
      {tab === 'historique' && (
        <div className="space-y-3">
          {sessions.length === 0 && (
            <GlassCard>
              <p className="text-secondary text-center py-8">Aucune séance enregistrée</p>
            </GlassCard>
          )}
          {sessions.map(s => {
            const isExpanded = expandedSession === s.id;
            const hasSeriesData = s.workout_exercises?.some(e => e.series_data && e.series_data.length > 0);
            const durationStr = s.duration_seconds ? formatDuration(s.duration_seconds) : null;

            return (
              <GlassCard key={s.id}>
                <div
                  className="flex items-center justify-between mb-2 cursor-pointer"
                  onClick={() => setExpandedSession(isExpanded ? null : s.id)}
                >
                  <div>
                    <span className="font-semibold">{s.name || 'Séance'}</span>
                    <span className="text-xs text-tertiary ml-2">
                      {new Date(s.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                        weekday: 'short', day: 'numeric', month: 'short',
                      })}
                    </span>
                    {durationStr && (
                      <span className="text-xs ml-2" style={{ color: '#BF5AF2' }}>{durationStr}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
                      className="text-quaternary hover:text-[#FF6B6B] transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    {hasSeriesData && (
                      isExpanded ? <ChevronUp size={14} className="text-tertiary" /> : <ChevronDown size={14} className="text-tertiary" />
                    )}
                  </div>
                </div>

                {s.workout_exercises && s.workout_exercises.length > 0 && (
                  <div className="space-y-2">
                    {s.workout_exercises.map(e => (
                      <div key={e.id}>
                        {/* Summary line */}
                        <div className="flex justify-between text-sm glass-subtle rounded-lg px-3 py-2">
                          <span>{e.exercise_name}</span>
                          <span className="text-secondary">
                            {e.sets}x{e.reps}
                            {e.weight_kg != null && ` @ ${e.weight_kg}kg`}
                          </span>
                        </div>

                        {/* Expanded: per-series detail */}
                        {isExpanded && e.series_data && e.series_data.length > 0 && (
                          <div className="ml-4 mt-1 space-y-0.5">
                            {e.series_data.map((sd, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs px-2 py-1" style={{ color: '#6B5B5B' }}>
                                <span className="font-semibold">Série {sd.set}</span>
                                <span>:</span>
                                <span>{sd.reps} reps &times; {sd.weight_kg} kg</span>
                                {sd.completed && <Check size={10} className="text-[#2AC956]" />}
                              </div>
                            ))}
                            {e.notes && (
                              <p className="text-xs italic px-2 mt-1" style={{ color: '#9B8A8A' }}>
                                {e.notes}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* ─── Create/Edit Template Modal ─── */}
      <Modal
        open={templateModal}
        onClose={() => { setTemplateModal(false); setEditingTemplate(null); }}
        title={editingTemplate ? 'Modifier la séance type' : 'Nouvelle séance type'}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nom de la séance</label>
            <input
              className="input-field"
              value={templateForm.name}
              onChange={e => setTemplateForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Push — Pectoraux, Épaules, Triceps"
            />
          </div>

          <div>
            <label className="label">Exercices</label>
            {templateForm.exercises.map((ex, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => moveExercise(i, 'up')} disabled={i === 0} className="text-quaternary hover:text-secondary disabled:opacity-20">
                    <ChevronUp size={12} />
                  </button>
                  <button type="button" onClick={() => moveExercise(i, 'down')} disabled={i === templateForm.exercises.length - 1} className="text-quaternary hover:text-secondary disabled:opacity-20">
                    <ChevronDown size={12} />
                  </button>
                </div>
                <input
                  className="input-field flex-1"
                  placeholder="Exercice"
                  value={ex.exercise_name}
                  onChange={e => {
                    const exs = [...templateForm.exercises];
                    exs[i] = { ...exs[i], exercise_name: e.target.value };
                    setTemplateForm(f => ({ ...f, exercises: exs }));
                  }}
                />
                <input
                  type="number"
                  className="input-field w-16 text-center"
                  placeholder="Sets"
                  value={ex.sets}
                  onChange={e => {
                    const exs = [...templateForm.exercises];
                    exs[i] = { ...exs[i], sets: e.target.value };
                    setTemplateForm(f => ({ ...f, exercises: exs }));
                  }}
                />
                <input
                  type="number"
                  className="input-field w-16 text-center"
                  placeholder="Reps"
                  value={ex.reps}
                  onChange={e => {
                    const exs = [...templateForm.exercises];
                    exs[i] = { ...exs[i], reps: e.target.value };
                    setTemplateForm(f => ({ ...f, exercises: exs }));
                  }}
                />
                <button type="button" onClick={() => removeTemplateExercise(i)} className="text-quaternary hover:text-[#FF6B6B] p-1">
                  <X size={14} />
                </button>
              </div>
            ))}
            <button type="button" onClick={addTemplateExercise} className="text-xs flex items-center gap-1 mt-1" style={{ color: '#BF5AF2' }}>
              <Plus size={12} /> Ajouter un exercice
            </button>
          </div>

          <button onClick={handleSaveTemplate} className="btn-primary w-full" style={{ background: '#BF5AF2' }}>
            {editingTemplate ? 'Enregistrer' : 'Créer la séance type'}
          </button>
        </div>
      </Modal>

      {/* ─── Assign template to day Modal ─── */}
      <Modal
        open={assignModal !== null}
        onClose={() => setAssignModal(null)}
        title={`${assignModal !== null ? WEEKDAY_LABELS[assignModal] : ''} — Choisir une séance`}
      >
        <div className="space-y-2">
          <button
            onClick={() => assignModal !== null && handleAssign(assignModal, null)}
            className="w-full text-left glass-subtle rounded-lg px-4 py-3 text-secondary hover:text-primary transition-colors"
          >
            Repos (aucune séance)
          </button>
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => assignModal !== null && handleAssign(assignModal, t.id)}
              className="w-full text-left glass-subtle rounded-lg px-4 py-3 hover:ring-1 hover:ring-[#BF5AF2] transition-all"
            >
              <span className="font-medium">{t.name}</span>
              <span className="text-xs text-tertiary ml-2">
                {(t.workout_template_exercises || []).length} exercice{(t.workout_template_exercises || []).length > 1 ? 's' : ''}
              </span>
            </button>
          ))}
          {templates.length === 0 && (
            <p className="text-tertiary text-center py-4 text-sm">
              Aucune séance type. Crée-en une d&apos;abord dans l&apos;onglet &quot;Séances types&quot;.
            </p>
          )}
        </div>
      </Modal>

      {/* ─── Launch another session Bottom Sheet ─── */}
      <BottomSheet
        isOpen={launchOtherModal}
        onClose={() => setLaunchOtherModal(false)}
        title="Lancer une autre séance"
      >
        <div className="space-y-2 py-2">
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => handleLaunchSession(t)}
              className="w-full flex items-center justify-between glass-subtle rounded-xl px-4 py-3 hover:ring-1 hover:ring-[#BF5AF2] transition-all"
            >
              <div>
                <span className="font-medium text-sm">{t.name}</span>
                <span className="text-xs text-tertiary ml-2">
                  {(t.workout_template_exercises || []).length} exercice{(t.workout_template_exercises || []).length > 1 ? 's' : ''}
                </span>
              </div>
              <Play size={16} style={{ color: '#BF5AF2' }} />
            </button>
          ))}
          {templates.length === 0 && (
            <p className="text-tertiary text-center py-4 text-sm">
              Aucune séance type disponible.
            </p>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
