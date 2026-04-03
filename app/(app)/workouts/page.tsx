'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dumbbell, Trash2, Plus, Play, ChevronUp, ChevronDown, Minus, Edit3, X, Check } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import GlassCard from '@/components/ui/GlassCard';
import type { WorkoutSession, WorkoutTemplate, WorkoutTemplateExercise, ExerciseHistory } from '@/types';
import { WEEKDAY_LABELS } from '@/types';

type Tab = 'programme' | 'seances' | 'historique';

type TemplateFormExercise = {
  exercise_name: string;
  sets: string;
  reps: string;
  sort_order: number;
};

type ActiveExercise = {
  exercise_name: string;
  sets: number;
  reps: number;
  weight_kg: string;
  lastWeight: string | null;
  lastDate: string | null;
};

type ProgramDay = {
  weekday: number;
  template_id: string | null;
  template: WorkoutTemplate | null;
  id: string | null;
};

export default function WorkoutsPage() {
  const [tab, setTab] = useState<Tab>('programme');

  // Data
  const [program, setProgram] = useState<ProgramDay[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  // Modals
  const [templateModal, setTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [assignModal, setAssignModal] = useState<number | null>(null); // weekday index

  // Active session
  const [activeSession, setActiveSession] = useState<{
    templateName: string;
    templateId: string;
    exercises: ActiveExercise[];
  } | null>(null);
  const [sessionSummary, setSessionSummary] = useState<{
    name: string;
    exercises: Array<{ name: string; sets: number; reps: number; weight: number | null; diff: 'up' | 'down' | 'same' | 'new' }>;
  } | null>(null);

  // Template form
  const [templateForm, setTemplateForm] = useState({
    name: '',
    exercises: [{ exercise_name: '', sets: '3', reps: '10', sort_order: 0 }] as TemplateFormExercise[],
  });

  // Fetchers
  const fetchProgram = useCallback(async () => {
    try {
      const res = await fetch('/api/workouts/program');
      if (res.ok) {
        const data = await res.json();
        setProgram(data);
      }
    } catch (err) {
      console.error('Program fetch error:', err);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/workouts/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Templates fetch error:', err);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/workouts/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error('Sessions fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchProgram();
    fetchTemplates();
    fetchSessions();
  }, [fetchProgram, fetchTemplates, fetchSessions]);

  // Get today's weekday (0=Lundi..6=Dimanche)
  const jsDow = new Date().getDay(); // 0=Sunday
  const todayWeekday = jsDow === 0 ? 6 : jsDow - 1; // convert to 0=Monday

  // ── Template CRUD ──
  const openCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      name: '',
      exercises: [{ exercise_name: '', sets: '3', reps: '10', sort_order: 0 }],
    });
    setTemplateModal(true);
  };

  const openEditTemplate = (t: WorkoutTemplate) => {
    setEditingTemplate(t);
    setTemplateForm({
      name: t.name,
      exercises: (t.workout_template_exercises || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((e, i) => ({
          exercise_name: e.exercise_name,
          sets: String(e.sets),
          reps: String(e.reps),
          sort_order: i,
        })),
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
        .map((e, i) => ({
          exercise_name: e.exercise_name,
          sets: parseInt(e.sets) || 3,
          reps: parseInt(e.reps) || 10,
          sort_order: i,
        })),
    };

    try {
      const url = editingTemplate
        ? `/api/workouts/templates/${editingTemplate.id}`
        : '/api/workouts/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error('Template save error:', data);
        alert(`Erreur: ${data.error}`);
        return;
      }

      setTemplateModal(false);
      setEditingTemplate(null);
      fetchTemplates();
      fetchProgram();
    } catch (err) {
      console.error('Template save error:', err);
    }
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
        exercise_name: e.exercise_name,
        sets: e.sets,
        reps: e.reps,
        sort_order: i,
      })),
    };

    await fetch('/api/workouts/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    fetchTemplates();
  };

  // ── Program assignment ──
  const handleAssign = async (weekday: number, templateId: string | null) => {
    try {
      const res = await fetch('/api/workouts/program', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignments: [{ weekday, template_id: templateId }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProgram(data);
      }
    } catch (err) {
      console.error('Assign error:', err);
    }
    setAssignModal(null);
  };

  // ── Launch session ──
  const handleLaunchSession = async (template: WorkoutTemplate) => {
    const exercises: ActiveExercise[] = [];
    const templateExercises = (template.workout_template_exercises || [])
      .sort((a: WorkoutTemplateExercise, b: WorkoutTemplateExercise) => a.sort_order - b.sort_order);

    // Fetch last weights for each exercise
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

      exercises.push({
        exercise_name: ex.exercise_name,
        sets: ex.sets,
        reps: ex.reps,
        weight_kg: lastWeight || '',
        lastWeight,
        lastDate,
      });
    }

    setActiveSession({
      templateName: template.name,
      templateId: template.id,
      exercises,
    });
  };

  const handleFinishSession = async () => {
    if (!activeSession) return;

    const exercises = activeSession.exercises.map(ex => ({
      exercise_name: ex.exercise_name,
      sets: ex.sets,
      reps: ex.reps,
      weight_kg: ex.weight_kg ? parseFloat(ex.weight_kg) : null,
    }));

    try {
      const res = await fetch('/api/workouts/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          name: activeSession.templateName,
          exercises,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(`Erreur: ${data.error}`);
        return;
      }

      // Build summary with progression indicators
      const summary = activeSession.exercises.map(ex => {
        const currentWeight = ex.weight_kg ? parseFloat(ex.weight_kg) : null;
        const prevWeight = ex.lastWeight ? parseFloat(ex.lastWeight) : null;
        let diff: 'up' | 'down' | 'same' | 'new' = 'new';
        if (currentWeight != null && prevWeight != null) {
          diff = currentWeight > prevWeight ? 'up' : currentWeight < prevWeight ? 'down' : 'same';
        }
        return {
          name: ex.exercise_name,
          sets: ex.sets,
          reps: ex.reps,
          weight: currentWeight,
          diff,
        };
      });

      setSessionSummary({ name: activeSession.templateName, exercises: summary });
      setActiveSession(null);
      fetchSessions();
    } catch (err) {
      console.error('Finish session error:', err);
    }
  };

  const handleDeleteSession = async (id: string) => {
    await fetch(`/api/workouts/sessions/${id}`, { method: 'DELETE' });
    fetchSessions();
  };

  // ── Active session screen ──
  if (activeSession) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="title-apple flex items-center gap-2">
            <Dumbbell size={20} style={{ color: '#BF5AF2' }} />
            {activeSession.templateName}
          </h1>
          <button
            onClick={() => { if (confirm('Abandonner la séance ?')) setActiveSession(null); }}
            className="text-secondary hover:text-[#FF6B6B] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-secondary text-sm">Remplis les poids utilisés pour chaque exercice</p>

        {activeSession.exercises.map((ex, i) => (
          <GlassCard key={i}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{ex.exercise_name}</span>
                <span className="text-secondary text-sm">{ex.sets} x {ex.reps}</span>
              </div>

              <div>
                <label className="text-xs text-secondary">Poids (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  className="input-field mt-1"
                  placeholder="Ex: 80"
                  value={ex.weight_kg}
                  onChange={e => {
                    const exs = [...activeSession.exercises];
                    exs[i] = { ...exs[i], weight_kg: e.target.value };
                    setActiveSession({ ...activeSession, exercises: exs });
                  }}
                />
              </div>

              <div className="flex items-center gap-4 text-xs text-tertiary">
                <div className="flex items-center gap-2">
                  <label>Séries:</label>
                  <input
                    type="number"
                    className="input-field w-16 text-center !py-1 text-xs"
                    value={ex.sets}
                    onChange={e => {
                      const exs = [...activeSession.exercises];
                      exs[i] = { ...exs[i], sets: parseInt(e.target.value) || 1 };
                      setActiveSession({ ...activeSession, exercises: exs });
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label>Reps:</label>
                  <input
                    type="number"
                    className="input-field w-16 text-center !py-1 text-xs"
                    value={ex.reps}
                    onChange={e => {
                      const exs = [...activeSession.exercises];
                      exs[i] = { ...exs[i], reps: parseInt(e.target.value) || 1 };
                      setActiveSession({ ...activeSession, exercises: exs });
                    }}
                  />
                </div>
              </div>

              {ex.lastWeight && (
                <div className="text-xs text-tertiary italic">
                  Dernier : {ex.lastWeight} kg
                  {ex.lastDate && ` le ${new Date(ex.lastDate + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                </div>
              )}
            </div>
          </GlassCard>
        ))}

        <button
          onClick={handleFinishSession}
          className="btn-primary w-full py-3 text-lg font-semibold"
          style={{ background: '#BF5AF2' }}
        >
          <Check size={20} className="inline mr-2" />
          Terminer la séance
        </button>
      </div>
    );
  }

  // ── Session summary screen ──
  if (sessionSummary) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <div className="text-4xl">&#127942;</div>
          <h1 className="title-apple">Séance terminée !</h1>
          <p className="text-secondary">{sessionSummary.name}</p>
        </div>

        <GlassCard>
          <h3 className="section-header mb-3">Résumé</h3>
          <div className="space-y-2">
            {sessionSummary.exercises.map((ex, i) => (
              <div key={i} className="flex items-center justify-between glass-subtle rounded-lg px-3 py-2">
                <span className="text-sm">{ex.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-secondary">
                    {ex.sets}x{ex.reps} {ex.weight != null ? `@ ${ex.weight}kg` : ''}
                  </span>
                  {ex.diff === 'up' && <ChevronUp size={14} className="text-[#2AC956]" />}
                  {ex.diff === 'down' && <ChevronDown size={14} className="text-[#FF6B6B]" />}
                  {ex.diff === 'same' && <Minus size={14} className="text-tertiary" />}
                </div>
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

  // ── Main page with tabs ──
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
              <GlassCard
                key={i}
                className={isToday ? 'ring-2 ring-[#BF5AF2]' : ''}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex flex-col items-center" style={{ minWidth: 48 }}>
                      <span className={`text-xs font-bold uppercase ${isToday ? 'text-[#BF5AF2]' : 'text-secondary'}`}>
                        {dayLabel.slice(0, 3)}
                      </span>
                      {isToday && <span className="text-[8px] text-[#BF5AF2] mt-0.5">Aujourd&apos;hui</span>}
                    </div>

                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setAssignModal(i)}
                    >
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
                  <button
                    onClick={() => openEditTemplate(t)}
                    className="text-tertiary hover:text-[#BF5AF2] transition-colors p-1"
                    title="Modifier"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDuplicateTemplate(t)}
                    className="text-tertiary hover:text-[#2AC956] transition-colors p-1"
                    title="Dupliquer"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(t.id)}
                    className="text-tertiary hover:text-[#FF6B6B] transition-colors p-1"
                    title="Supprimer"
                  >
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

      {/* ─── TAB 3: Historique ─── */}
      {tab === 'historique' && (
        <div className="space-y-3">
          {sessions.length === 0 && (
            <GlassCard>
              <p className="text-secondary text-center py-8">Aucune séance enregistrée</p>
            </GlassCard>
          )}
          {sessions.map(s => (
            <GlassCard key={s.id}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-semibold">{s.name || 'Séance'}</span>
                  <span className="text-xs text-tertiary ml-2">
                    {new Date(s.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                      weekday: 'short', day: 'numeric', month: 'short',
                    })}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteSession(s.id)}
                  className="text-quaternary hover:text-[#FF6B6B] transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {s.workout_exercises && s.workout_exercises.length > 0 && (
                <div className="space-y-1">
                  {s.workout_exercises.map(e => (
                    <div key={e.id} className="flex justify-between text-sm glass-subtle rounded-lg px-3 py-2">
                      <span>{e.exercise_name}</span>
                      <span className="text-secondary">
                        {e.sets}x{e.reps}
                        {e.weight_kg != null && ` @ ${e.weight_kg}kg`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          ))}
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
                  <button
                    type="button"
                    onClick={() => moveExercise(i, 'up')}
                    disabled={i === 0}
                    className="text-quaternary hover:text-secondary disabled:opacity-20"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveExercise(i, 'down')}
                    disabled={i === templateForm.exercises.length - 1}
                    className="text-quaternary hover:text-secondary disabled:opacity-20"
                  >
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
                <button
                  type="button"
                  onClick={() => removeTemplateExercise(i)}
                  className="text-quaternary hover:text-[#FF6B6B] p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addTemplateExercise}
              className="text-xs flex items-center gap-1 mt-1"
              style={{ color: '#BF5AF2' }}
            >
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
    </div>
  );
}
