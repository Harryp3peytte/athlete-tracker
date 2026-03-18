'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '', password: '', username: '', displayName: '',
    dateOfBirth: '', gender: 'male', height: '', weight: '',
    activityLevel: 'MODERATE', goalType: 'MAINTAIN',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (authError || !authData.user) {
      setError(authError?.message || 'Erreur d\'inscription');
      setLoading(false);
      return;
    }

    // Create profile
    const res = await fetch('/api/auth/complete-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.username,
        displayName: form.displayName,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        height: form.height ? parseFloat(form.height) : undefined,
        activityLevel: form.activityLevel,
        goalType: form.goalType,
        weight: form.weight ? parseFloat(form.weight) : undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Erreur lors de la création du profil');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo + heading */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-4"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.35)',
            }}>
            FT
          </div>
          <h1 className="title-apple text-2xl text-white">Inscription</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Créez votre compte FitTrack</p>
        </div>

        {/* Glass card */}
        <div className="glass rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="glass rounded-xl px-4 py-3 text-sm border"
                style={{ borderColor: 'rgba(239,68,68,0.35)', color: '#f87171', background: 'rgba(239,68,68,0.08)' }}>
                {error}
              </div>
            )}

            {/* Pseudo + Nom affiché */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Pseudo</label>
                <input
                  className="input-field"
                  value={form.username}
                  onChange={e => update('username', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Nom affiché</label>
                <input
                  className="input-field"
                  value={form.displayName}
                  onChange={e => update('displayName', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                required
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label className="label">Mot de passe</label>
              <input
                type="password"
                className="input-field"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                required
                minLength={6}
              />
            </div>

            {/* Date de naissance + Genre */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date de naissance</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.dateOfBirth}
                  onChange={e => update('dateOfBirth', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Genre</label>
                <select
                  className="input-field"
                  value={form.gender}
                  onChange={e => update('gender', e.target.value)}
                >
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>

            {/* Taille + Poids */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Taille (cm)</label>
                <input
                  type="number"
                  className="input-field"
                  value={form.height}
                  onChange={e => update('height', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Poids (kg)</label>
                <input
                  type="number"
                  className="input-field"
                  value={form.weight}
                  onChange={e => update('weight', e.target.value)}
                />
              </div>
            </div>

            {/* Niveau d'activité */}
            <div>
              <label className="label">Niveau d&apos;activité</label>
              <select
                className="input-field"
                value={form.activityLevel}
                onChange={e => update('activityLevel', e.target.value)}
              >
                <option value="SEDENTARY">Sédentaire</option>
                <option value="LIGHT">Légèrement actif</option>
                <option value="MODERATE">Modérément actif</option>
                <option value="ACTIVE">Actif</option>
                <option value="VERY_ACTIVE">Très actif</option>
              </select>
            </div>

            {/* Objectif */}
            <div>
              <label className="label">Objectif</label>
              <select
                className="input-field"
                value={form.goalType}
                onChange={e => update('goalType', e.target.value)}
              >
                <option value="LOSE_WEIGHT">Perdre du poids</option>
                <option value="MAINTAIN">Maintenir</option>
                <option value="GAIN_MUSCLE">Prise de muscle</option>
              </select>
            </div>

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Inscription...' : 'S\'inscrire'}
            </button>

          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Déjà un compte ?{' '}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">
            Se connecter
          </Link>
        </p>

      </div>
    </div>
  );
}
