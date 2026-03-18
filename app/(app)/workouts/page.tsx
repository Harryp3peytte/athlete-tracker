'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dumbbell, Trash2, Copy, Plus } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import GlassCard from '@/components/ui/GlassCard';
import type { WorkoutSession, WorkoutTemplate } from '@/types';
import { WEEKDAY_LABELS } from '@/types';

export default function WorkoutsPage() {
  const [tab, setTab] = useState<'sessions' | 'templates'>('sessions');
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [sessionModal, setSessionModal] = useState(false);
  const [templateModal, setTemplateModal] = useState(false);

  const [sessionForm, setSessionForm] = useState({
    name: '', notes: '',
    exercises: [{ exercise_name: '', sets: '3', reps: '10', weight_kg: '' }],
  });
  const [templateForm, setTemplateForm] = useState({
    name: '', weekday: '1', notes: '',
    exercises: [{ exercise_name: '', sets: '3', reps: '10', sort_order: 0 }],
  });

  const fetchSessions = useCallback(() => {
    fetch('/api/workouts/sessions?period=30d').then(r => r.json()).then(setSessions).catch(console.error);
  }, []);

  const fetchTemplates = useCallback(() => {
    fetch('/api/workouts/templates').then(r => r.json()).then(setTemplates).catch(console.error);
  }, []);

  useEffect(() => { fetchSessions(); fetchTemplates(); }, [fetchSessions, fetchTemplates]);

  const addSessionExercise = () => setSessionForm(f => ({
    ...f, exercises: [...f.exercises, { exercise_name: '', sets: '3', reps: '10', weight_kg: '' }],
  }));

  const addTemplateExercise = () => setTemplateForm(f => ({
    ...f, exercises: [...f.exercises, { exercise_name: '', sets: '3', reps: '10', sort_order: f.exercises.length }],
  }));

  const handleCreateSession = async () => {
    if (!sessionForm.name) return;
    await fetch('/api/workouts/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: new Date().toISOString().split('T')[0],
        name: sessionForm.name,
        notes: sessionForm.notes || null,
        exercises: sessionForm.exercises.filter(e => e.exercise_name).map(e => ({
          exercise_name: e.exercise_name,
          sets: parseInt(e.sets) || 3,
          reps: parseInt(e.reps) || 10,
          weight_kg: e.weight_kg ? parseFloat(e.weight_kg) : null,
        })),
      }),
    });
    setSessionModal(false);
    setSessionForm({ name: '', notes: '', exercises: [{ exercise_name: '', sets: '3', reps: '10', weight_kg: '' }] });
    fetchSessions();
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.name) return;
    await fetch('/api/workouts/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: templateForm.name,
        weekday: parseInt(templateForm.weekday),
        notes: templateForm.notes || null,
        exercises: templateForm.exercises.filter(e => e.exercise_name).map((e, i) => ({
          exercise_name: e.exercise_name,
          sets: parseInt(e.sets) || 3,
          reps: parseInt(e.reps) || 10,
          sort_order: i,
        })),
      }),
    });
    setTemplateModal(false);
    setTemplateForm({ name: '', weekday: '1', notes: '', exercises: [{ exercise_name: '', sets: '3', reps: '10', sort_order: 0 }] });
    fetchTemplates();
  };

  const handleDeleteSession = async (id: string) => {
    await fetch(`/api/workouts/sessions/${id}`, { method: 'DELETE' });
    fetchSessions();
  };

  const handleDeleteTemplate = async (id: string) => {
    await fetch(`/api/workouts/templates/${id}`, { method: 'DELETE' });
    fetchTemplates();
  };

  const handleStartFromTemplate = async (id: string) => {
    const res = await fetch(`/api/workouts/templates/${id}`, { method: 'POST' });
    if (res.ok) {
      setTab('sessions');
      fetchSessions();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="title-apple flex items-center gap-2">
          <span style={{ color: '#BF5AF215', background: '#BF5AF215' }} className="w-9 h-9 rounded-xl flex items-center justify-center">
            <Dumbbell size={20} style={{ color: '#BF5AF2' }} />
          </span>
          Musculation
        </h1>
        <button onClick={() => tab === 'sessions' ? setSessionModal(true) : setTemplateModal(true)} className="btn-primary">
          + {tab === 'sessions' ? 'Séance' : 'Template'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('sessions')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={tab === 'sessions'
            ? { background: '#BF5AF2', color: '#fff' }
            : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
          }
        >
          Séances
        </button>
        <button
          onClick={() => setTab('templates')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={tab === 'templates'
            ? { background: '#BF5AF2', color: '#fff' }
            : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
          }
        >
          Templates
        </button>
      </div>

      {/* Sessions tab */}
      {tab === 'sessions' && (
        <div className="space-y-3">
          {sessions.length === 0 && (
            <GlassCard>
              <p className="text-white/40 text-center py-4">Aucune séance enregistrée</p>
            </GlassCard>
          )}
          {sessions.map(s => (
            <GlassCard key={s.id}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-semibold">{s.name || 'Séance'}</span>
                  <span className="text-xs text-white/30 ml-2">
                    {new Date(s.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <button onClick={() => handleDeleteSession(s.id)} className="text-white/20 hover:text-[#FF6B6B] transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              {s.workout_exercises && s.workout_exercises.length > 0 && (
                <div className="space-y-1">
                  {s.workout_exercises.map(e => (
                    <div key={e.id} className="flex justify-between text-sm glass-subtle rounded-lg px-3 py-2">
                      <span>{e.exercise_name}</span>
                      <span className="text-white/40">{e.sets}x{e.reps} {e.weight_kg ? `@ ${e.weight_kg}kg` : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}

      {/* Templates tab */}
      {tab === 'templates' && (
        <div className="space-y-3">
          {templates.length === 0 && (
            <GlassCard>
              <p className="text-white/40 text-center py-4">Aucun template créé</p>
            </GlassCard>
          )}
          {templates.map(t => (
            <GlassCard key={t.id}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-semibold">{t.name}</span>
                  <span
                    className="glass-subtle text-xs rounded-full px-2 py-0.5 ml-2"
                    style={{ color: '#BF5AF2' }}
                  >
                    {WEEKDAY_LABELS[t.weekday]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartFromTemplate(t.id)}
                    className="flex items-center gap-1 text-xs glass-subtle px-2 py-1 rounded-lg transition-colors"
                    style={{ color: '#2AC956' }}
                  >
                    <Copy size={12} /> Démarrer
                  </button>
                  <button onClick={() => handleDeleteTemplate(t.id)} className="text-white/20 hover:text-[#FF6B6B] transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {t.workout_template_exercises && t.workout_template_exercises.length > 0 && (
                <div className="space-y-1">
                  {t.workout_template_exercises.map(e => (
                    <div key={e.id} className="flex justify-between text-sm glass-subtle rounded-lg px-3 py-2">
                      <span>{e.exercise_name}</span>
                      <span className="text-white/40">{e.sets}x{e.reps}</span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}

      {/* Session modal */}
      <Modal open={sessionModal} onClose={() => setSessionModal(false)} title="Nouvelle séance">
        <div className="space-y-4">
          <div>
            <label className="label">Nom de la séance</label>
            <input className="input-field" value={sessionForm.name} onChange={e => setSessionForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Push day" />
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="input-field" value={sessionForm.notes} onChange={e => setSessionForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div>
            <label className="label">Exercices</label>
            {sessionForm.exercises.map((ex, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 mb-2">
                <input className="input-field col-span-2" placeholder="Exercice" value={ex.exercise_name}
                  onChange={e => { const exs = [...sessionForm.exercises]; exs[i] = { ...exs[i], exercise_name: e.target.value }; setSessionForm(f => ({ ...f, exercises: exs })); }} />
                <input type="number" className="input-field" placeholder="Séries" value={ex.sets}
                  onChange={e => { const exs = [...sessionForm.exercises]; exs[i] = { ...exs[i], sets: e.target.value }; setSessionForm(f => ({ ...f, exercises: exs })); }} />
                <input type="number" className="input-field" placeholder="Reps" value={ex.reps}
                  onChange={e => { const exs = [...sessionForm.exercises]; exs[i] = { ...exs[i], reps: e.target.value }; setSessionForm(f => ({ ...f, exercises: exs })); }} />
              </div>
            ))}
            <button type="button" onClick={addSessionExercise} className="text-xs text-[#2AC956] flex items-center gap-1">
              <Plus size={12} /> Ajouter un exercice
            </button>
          </div>
          <button onClick={handleCreateSession} className="btn-primary w-full">Créer la séance</button>
        </div>
      </Modal>

      {/* Template modal */}
      <Modal open={templateModal} onClose={() => setTemplateModal(false)} title="Nouveau template">
        <div className="space-y-4">
          <div>
            <label className="label">Nom</label>
            <input className="input-field" value={templateForm.name} onChange={e => setTemplateForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Push A" />
          </div>
          <div>
            <label className="label">Jour de la semaine</label>
            <select className="input-field" value={templateForm.weekday} onChange={e => setTemplateForm(f => ({ ...f, weekday: e.target.value }))}>
              {WEEKDAY_LABELS.map((label, i) => <option key={i} value={i}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Exercices</label>
            {templateForm.exercises.map((ex, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                <input className="input-field" placeholder="Exercice" value={ex.exercise_name}
                  onChange={e => { const exs = [...templateForm.exercises]; exs[i] = { ...exs[i], exercise_name: e.target.value }; setTemplateForm(f => ({ ...f, exercises: exs })); }} />
                <input type="number" className="input-field" placeholder="Séries" value={ex.sets}
                  onChange={e => { const exs = [...templateForm.exercises]; exs[i] = { ...exs[i], sets: e.target.value }; setTemplateForm(f => ({ ...f, exercises: exs })); }} />
                <input type="number" className="input-field" placeholder="Reps" value={ex.reps}
                  onChange={e => { const exs = [...templateForm.exercises]; exs[i] = { ...exs[i], reps: e.target.value }; setTemplateForm(f => ({ ...f, exercises: exs })); }} />
              </div>
            ))}
            <button type="button" onClick={addTemplateExercise} className="text-xs text-[#2AC956] flex items-center gap-1">
              <Plus size={12} /> Ajouter un exercice
            </button>
          </div>
          <button onClick={handleCreateTemplate} className="btn-primary w-full">Créer le template</button>
        </div>
      </Modal>
    </div>
  );
}
