'use client';

import { useEffect, useState } from 'react';
import { User, Moon, Sun, LogOut, Target, Ruler, Activity, Save, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
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
  const { dark, toggle } = useTheme();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', age: '', height_cm: '', gender: 'male', daily_calorie_target: '', base_metabolism: '' });
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
      }),
    });
    setEditing(false);
    // Refresh
    const res = await fetch('/api/auth/complete-profile');
    setAthlete(await res.json());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="title-apple flex items-center gap-2">
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#8E8AFF15' }}
          >
            <User size={20} style={{ color: '#8E8AFF' }} />
          </span>
          Profil
        </h1>
        <button
          onClick={toggle}
          className="p-2 glass-subtle rounded-xl transition-colors"
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = '')}
        >
          {dark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} style={{ color: 'var(--text-secondary)' }} />}
        </button>
      </div>

      {athlete && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
                style={{ background: 'linear-gradient(135deg, #10B981, #8E8AFF)', color: '#fff' }}
              >
                {(athlete.name || '?').charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold">{athlete.name}</h2>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{athlete.gender} | {athlete.age || '?'} ans</p>
              </div>
            </div>
            <button onClick={() => setEditing(!editing)} className="btn-secondary text-sm">
              {editing ? 'Annuler' : 'Modifier'}
            </button>
          </div>

          {!editing ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="glass-subtle rounded-xl p-3 text-center">
                <Ruler size={16} className="text-blue-400 mx-auto mb-1" />
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Taille</div>
                <div className="text-sm font-medium">{athlete.height_cm ? `${athlete.height_cm} cm` : '-'}</div>
              </div>
              <div className="glass-subtle rounded-xl p-3 text-center">
                <Target size={16} className="mx-auto mb-1" style={{ color: '#2AC956' }} />
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Objectif cal.</div>
                <div className="text-sm font-medium">{athlete.daily_calorie_target || '-'} kcal</div>
              </div>
              <div className="glass-subtle rounded-xl p-3 text-center">
                <Activity size={16} className="mx-auto mb-1" style={{ color: '#8E8AFF' }} />
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Métabolisme</div>
                <div className="text-sm font-medium">{athlete.base_metabolism || '-'} kcal</div>
              </div>
              <div className="glass-subtle rounded-xl p-3 text-center">
                <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Genre</div>
                <div className="text-sm font-medium capitalize">{athlete.gender || '-'}</div>
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
              <button onClick={handleSave} className="btn-primary flex items-center gap-2"><Save size={16} /> Enregistrer</button>
            </div>
          )}
        </GlassCard>
      )}

      {deficitData.length > 0 && (
        <GlassCard>
          <h3 className="section-header mb-3">
            Déficit calorique — 30 jours
          </h3>
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

      {/* Notifications */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-header flex items-center gap-2">
            <Bell size={14} style={{ color: '#FF9F0A' }} /> Notifications
          </h3>
          {!isSubscribed && (
            <button
              onClick={subscribe}
              className="text-xs px-3 py-1 rounded-lg transition-colors"
              style={{ background: '#FF9F0A20', color: '#FF9F0A' }}
            >
              {permission === 'denied' ? 'Bloqué' : 'Activer les push'}
            </button>
          )}
          {isSubscribed && (
            <span className="text-xs px-3 py-1 rounded-lg" style={{ background: '#2AC95620', color: '#2AC956' }}>
              Activé
            </span>
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
                  <span className="text-sm">{info.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  {pref.reminder_type === 'hydration' ? (
                    <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
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
                    style={{ background: pref.enabled ? '#2AC956' : 'var(--bg-input)' }}
                  >
                    <div
                      className="w-4 h-4 rounded-full bg-white absolute top-1 transition-all"
                      style={{ left: pref.enabled ? '22px' : '4px' }}
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
        className="glass-subtle w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors"
      >
        <LogOut size={18} /> Se déconnecter
      </button>
    </div>
  );
}
