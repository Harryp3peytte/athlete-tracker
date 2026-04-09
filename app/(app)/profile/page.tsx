'use client';

import { useEffect, useState } from 'react';
import { User, LogOut, Target, Ruler, Activity, Save, Bell, Droplets, Scale } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import GlassCard from '@/components/ui/GlassCard';
import TrendChart from '@/components/charts/TrendChart';
import type { Athlete } from '@/types';

type NotifPref = {
  reminder_type: string;
  enabled: boolean;
  time: string | null;
  interval_minutes: number | null;
};

const NOTIF_LABELS: Record<string, { icon: string; label: string }> = {
  wake: { icon: '☀️', label: 'Rappel réveil' },
  sleep: { icon: '🌙', label: 'Rappel coucher' },
  hydration: { icon: '💧', label: 'Rappel hydratation' },
  breakfast: { icon: '🥣', label: 'Petit-déjeuner' },
  lunch: { icon: '🍽️', label: 'Déjeuner' },
  dinner: { icon: '🍽️', label: 'Dîner' },
  workout: { icon: '💪', label: 'Entraînement' },
};

export default function ProfilePage() {
  const { signOut } = useAuth();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', age: '', height_cm: '', gender: 'male', daily_calorie_target: '', base_metabolism: '', goal_type: 'MAINTAIN', target_weight: '', hydration_goal: '2' });
  const [deficitData, setDeficitData] = useState<Array<{ date: string; net: number; target: number }>>([]);
  const [notifPrefs, setNotifPrefs] = useState<NotifPref[]>([]);
  const { subscribe, isSubscribed, permission } = useNotifications();

  useEffect(() => {
    fetch('/api/notifications').then(r => r.json()).then((data: NotifPref[]) => {
      if (Array.isArray(data)) setNotifPrefs(data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    fetch('/api/auth/complete-profile').then(r => r.json()).then((data: Athlete) => {
      setAthlete(data);
      setForm({
        name: data.name || '',
        age: data.age?.toString() || '',
        height_cm: data.height_cm?.toString() || '',
        gender: data.gender || 'male',
        daily_calorie_target: data.daily_calorie_target?.toString() || '',
        base_metabolism: data.base_metabolism?.toString() || '',
        goal_type: data.goal_type || 'MAINTAIN',
        target_weight: data.target_weight?.toString() || '',
        hydration_goal: data.hydration_goal?.toString() || '2',
      });
    }).catch(console.error);
    fetch('/api/stats/deficit?period=30d').then(r => r.json()).then(setDeficitData).catch(console.error);
  }, []);

  const handleSave = async () => {
    await fetch('/api/auth/complete-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name || undefined,
        age: form.age ? parseInt(form.age) : null,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        gender: form.gender || null,
        daily_calorie_target: form.daily_calorie_target ? parseInt(form.daily_calorie_target) : null,
        base_metabolism: form.base_metabolism ? parseInt(form.base_metabolism) : null,
        goal_type: form.goal_type || null,
        target_weight: form.target_weight ? parseFloat(form.target_weight) : null,
        hydration_goal: form.hydration_goal ? parseFloat(form.hydration_goal) : null,
      }),
    });
    setEditing(false);
    const res = await fetch('/api/auth/complete-profile');
    setAthlete(await res.json());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="title-apple flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#5E5CE615' }}>
            <User size={20} style={{ color: '#5E5CE6' }} />
          </span>
          Profil
        </h1>
      </div>

      {athlete && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
                style={{ background: 'linear-gradient(135deg, #FF2D55, #FF6B8A)', color: '#fff' }}
              >
                {(athlete.name || '?').charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#1A1A1A' }}>{athlete.name}</h2>
                <p className="text-xs" style={{ color: '#9B8A8A' }}>{athlete.gender} | {athlete.age || '?'} ans</p>
              </div>
            </div>
            <button onClick={() => setEditing(!editing)} className="btn-secondary text-sm">
              {editing ? 'Annuler' : 'Modifier'}
            </button>
          </div>

          {!editing ? (
            <div className="space-y-3">
              {/* Goal type banner */}
              {athlete.goal_type && (
                <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{
                  background: athlete.goal_type === 'LOSE_WEIGHT' ? 'rgba(255, 45, 85, 0.08)' : athlete.goal_type === 'GAIN_MUSCLE' ? 'rgba(191, 90, 242, 0.08)' : 'rgba(42, 201, 86, 0.08)',
                  border: `1px solid ${athlete.goal_type === 'LOSE_WEIGHT' ? 'rgba(255,45,85,0.2)' : athlete.goal_type === 'GAIN_MUSCLE' ? 'rgba(191,90,242,0.2)' : 'rgba(42,201,86,0.2)'}`,
                }}>
                  <Target size={18} style={{ color: athlete.goal_type === 'LOSE_WEIGHT' ? '#FF2D55' : athlete.goal_type === 'GAIN_MUSCLE' ? '#BF5AF2' : '#2AC956' }} />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>
                      {athlete.goal_type === 'LOSE_WEIGHT' ? 'Perte de poids' : athlete.goal_type === 'GAIN_MUSCLE' ? 'Prise de muscle' : 'Maintien'}
                    </div>
                    {athlete.target_weight && (
                      <div className="text-xs" style={{ color: '#6B5B5B' }}>Objectif : {athlete.target_weight} kg</div>
                    )}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="glass-subtle rounded-xl p-3 text-center">
                  <Ruler size={16} style={{ color: '#32ADE6' }} className="mx-auto mb-1" />
                  <div className="text-xs" style={{ color: '#6B5B5B' }}>Taille</div>
                  <div className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{athlete.height_cm ? `${athlete.height_cm} cm` : '-'}</div>
                </div>
                <div className="glass-subtle rounded-xl p-3 text-center">
                  <Target size={16} className="mx-auto mb-1" style={{ color: '#2AC956' }} />
                  <div className="text-xs" style={{ color: '#6B5B5B' }}>Objectif cal.</div>
                  <div className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{athlete.daily_calorie_target || '-'} kcal</div>
                </div>
                <div className="glass-subtle rounded-xl p-3 text-center">
                  <Activity size={16} className="mx-auto mb-1" style={{ color: '#5E5CE6' }} />
                  <div className="text-xs" style={{ color: '#6B5B5B' }}>Métabolisme</div>
                  <div className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{athlete.base_metabolism || '-'} kcal</div>
                </div>
                <div className="glass-subtle rounded-xl p-3 text-center">
                  <Scale size={16} className="mx-auto mb-1" style={{ color: '#30D158' }} />
                  <div className="text-xs" style={{ color: '#6B5B5B' }}>Poids cible</div>
                  <div className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{athlete.target_weight ? `${athlete.target_weight} kg` : '-'}</div>
                </div>
                <div className="glass-subtle rounded-xl p-3 text-center">
                  <Droplets size={16} className="mx-auto mb-1" style={{ color: '#64D2FF' }} />
                  <div className="text-xs" style={{ color: '#6B5B5B' }}>Obj. eau/jour</div>
                  <div className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{athlete.hydration_goal || 2}L</div>
                </div>
                <div className="glass-subtle rounded-xl p-3 text-center">
                  <div className="text-xs mt-1" style={{ color: '#6B5B5B' }}>Genre</div>
                  <div className="text-sm font-medium capitalize" style={{ color: '#1A1A1A' }}>{athlete.gender === 'male' ? 'Homme' : athlete.gender === 'female' ? 'Femme' : athlete.gender || '-'}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Nom</label><input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><label className="label">Âge</label><input type="number" className="input-field" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Taille (cm)</label><input type="number" className="input-field" value={form.height_cm} onChange={e => setForm(f => ({ ...f, height_cm: e.target.value }))} /></div>
                <div>
                  <label className="label">Genre</label>
                  <select className="input-field" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                    <option value="male">Homme</option><option value="female">Femme</option><option value="other">Autre</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Objectif calories/jour</label><input type="number" className="input-field" value={form.daily_calorie_target} onChange={e => setForm(f => ({ ...f, daily_calorie_target: e.target.value }))} /></div>
                <div><label className="label">Métabolisme de base</label><input type="number" className="input-field" value={form.base_metabolism} onChange={e => setForm(f => ({ ...f, base_metabolism: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Objectif</label>
                  <select className="input-field" value={form.goal_type} onChange={e => setForm(f => ({ ...f, goal_type: e.target.value }))}>
                    <option value="LOSE_WEIGHT">Perte de poids</option>
                    <option value="MAINTAIN">Maintien</option>
                    <option value="GAIN_MUSCLE">Prise de muscle</option>
                  </select>
                </div>
                <div><label className="label">Poids cible (kg)</label><input type="number" step="0.1" className="input-field" value={form.target_weight} onChange={e => setForm(f => ({ ...f, target_weight: e.target.value }))} placeholder="Ex: 75" /></div>
              </div>
              <div>
                <label className="label">Objectif hydratation (L/jour)</label>
                <input type="number" step="0.5" className="input-field" value={form.hydration_goal} onChange={e => setForm(f => ({ ...f, hydration_goal: e.target.value }))} placeholder="Ex: 2" />
              </div>
              <button onClick={handleSave} className="btn-primary flex items-center gap-2"><Save size={16} /> Enregistrer</button>
            </div>
          )}
        </GlassCard>
      )}

      {deficitData.length > 0 && (
        <GlassCard>
          <h3 className="section-header mb-3">Déficit calorique — 30 jours</h3>
          <TrendChart
            data={deficitData.map(d => ({ date: d.date, value: d.net }))}
            color="#3B82F6"
            label="Calories nettes"
            referenceLine={deficitData[0]?.target}
            referenceLabel="Objectif"
            formatValue={v => `${v}kcal`}
          />
        </GlassCard>
      )}

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-header flex items-center gap-2">
            <Bell size={14} style={{ color: '#FF9500' }} /> Notifications
          </h3>
          {!isSubscribed && (
            <button
              onClick={subscribe}
              className="text-xs px-3 py-1 rounded-lg transition-colors"
              style={{ background: '#FF950020', color: '#FF9500' }}
            >
              {permission === 'denied' ? 'Bloqué' : 'Activer les push'}
            </button>
          )}
          {isSubscribed && (
            <span className="text-xs px-3 py-1 rounded-lg" style={{ background: '#2AC95620', color: '#2AC956' }}>Activé</span>
          )}
        </div>
        <div className="space-y-2">
          {notifPrefs.map(pref => {
            const info = NOTIF_LABELS[pref.reminder_type];
            if (!info) return null;
            return (
              <div key={pref.reminder_type} className="flex items-center justify-between glass-subtle rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{info.icon}</span>
                  <span className="text-sm" style={{ color: '#1A1A1A' }}>{info.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  {pref.reminder_type === 'hydration' ? (
                    <span className="text-[11px]" style={{ color: '#9B8A8A' }}>
                      Toutes les {(pref.interval_minutes || 120) / 60}h
                    </span>
                  ) : pref.time ? (
                    <input
                      type="time"
                      className="input-field text-xs py-1 px-2 w-24"
                      value={pref.time}
                      onChange={async (e) => {
                        const newTime = e.target.value;
                        await fetch('/api/notifications', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ...pref, time: newTime }),
                        });
                        setNotifPrefs(prev => prev.map(p => p.reminder_type === pref.reminder_type ? { ...p, time: newTime } : p));
                      }}
                    />
                  ) : null}
                  <button
                    onClick={async () => {
                      const newEnabled = !pref.enabled;
                      if (newEnabled && !isSubscribed) await subscribe();
                      await fetch('/api/notifications', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...pref, enabled: newEnabled }),
                      });
                      setNotifPrefs(prev => prev.map(p => p.reminder_type === pref.reminder_type ? { ...p, enabled: newEnabled } : p));
                    }}
                    className="w-10 h-6 rounded-full relative transition-colors"
                    style={{ background: pref.enabled ? '#2AC956' : 'rgba(0,0,0,0.06)' }}
                  >
                    <div
                      className="w-4 h-4 rounded-full bg-white absolute top-1 transition-all"
                      style={{ left: pref.enabled ? '22px' : '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <button
        onClick={signOut}
        className="glass-subtle w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-colors"
        style={{ color: '#FF2D55' }}
      >
        <LogOut size={18} /> Se déconnecter
      </button>
    </div>
  );
}
