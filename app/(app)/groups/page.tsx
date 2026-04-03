'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Users, Copy, LogOut } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import GlassCard from '@/components/ui/GlassCard';

interface GroupListItem {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  memberCount: number;
  myRole: string;
  created_at: string;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [joinForm, setJoinForm] = useState({ inviteCode: '' });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch groups
  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/groups');
      const data = await res.json();
      setGroups(data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create group
  const handleCreateGroup = async () => {
    if (!createForm.name.trim()) return;
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        setCreateForm({ name: '', description: '' });
        setShowCreateModal(false);
        await fetchGroups();
      }
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  // Join group
  const handleJoinGroup = async () => {
    if (!joinForm.inviteCode.trim()) return;
    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: joinForm.inviteCode }),
      });
      if (res.ok) {
        setJoinForm({ inviteCode: '' });
        setShowJoinModal(false);
        await fetchGroups();
      }
    } catch (error) {
      console.error('Failed to join group:', error);
    }
  };

  // Leave group
  const handleLeaveGroup = async (groupId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir quitter ce groupe ?')) return;
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchGroups();
      }
    } catch (error) {
      console.error('Failed to leave group:', error);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#00C7BE15' }}>
            <Users size={20} style={{ color: '#00C7BE' }} />
          </div>
          <h1 className="title-apple">Groupes</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowJoinModal(true)} className="btn-secondary">
            Rejoindre
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            + Créer
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass h-32 animate-pulse rounded-2xl" />
          ))}
        </div>
      )}

      {/* Groups list */}
      {!loading && groups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map(group => (
            <Link key={group.id} href={`/groups/${group.id}`} className="block">
              <GlassCard hover>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg"
                      style={{ background: '#00C7BE20', color: '#00C7BE' }}
                    >
                      {getInitial(group.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold transition-colors">{group.name}</h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {group.memberCount} membre{group.memberCount > 1 ? 's' : ''} •{' '}
                        <span style={{ color: 'var(--text-secondary)' }}>{group.myRole === 'admin' ? 'Admin' : 'Membre'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Invite code section */}
                <div className="space-y-2 mt-4 pt-4" style={{ borderTop: '0.5px solid var(--separator)' }}>
                  <p className="section-header">Code d&apos;invitation</p>
                  <div className="flex items-center gap-2">
                    <code
                      className="glass-subtle font-mono text-sm tracking-widest px-3 py-1.5 rounded-lg"
                      style={{ color: '#2AC956' }}
                    >
                      {group.invite_code}
                    </code>
                    <button
                      onClick={e => {
                        e.preventDefault();
                        copyToClipboard(group.invite_code, group.id);
                      }}
                      className="glass-subtle p-1.5 rounded-full transition-colors"
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      <Copy size={16} className={copiedId === group.id ? 'text-[#2AC956]' : ''} style={copiedId !== group.id ? { color: 'var(--text-secondary)' } : undefined} />
                    </button>
                    {copiedId === group.id && (
                      <span className="text-xs" style={{ color: '#2AC956' }}>Copié !</span>
                    )}
                  </div>
                </div>

                {/* Leave button for non-admin */}
                {group.myRole !== 'admin' && (
                  <button
                    onClick={e => {
                      e.preventDefault();
                      handleLeaveGroup(group.id);
                    }}
                    className="mt-4 pt-4 w-full flex items-center justify-center gap-2 text-sm text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors rounded-xl py-1"
                    style={{ borderTop: '0.5px solid var(--separator)' }}
                  >
                    <LogOut size={14} />
                    Quitter
                  </button>
                )}
              </GlassCard>
            </Link>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && groups.length === 0 && (
        <GlassCard className="text-center py-8">
          <Users size={40} className="mx-auto mb-3" style={{ color: 'var(--text-quaternary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Aucun groupe pour le moment</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Créez un groupe ou rejoignez-en un avec le code d'invitation
          </p>
        </GlassCard>
      )}

      {/* Create Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Créer un groupe">
        <div className="space-y-4">
          <div>
            <label className="label">Nom du groupe</label>
            <input
              type="text"
              className="input-field"
              placeholder="Ex: Team Fitness"
              value={createForm.name}
              onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Description (optionnel)</label>
            <textarea
              className="input-field resize-none"
              placeholder="Décrivez les objectifs du groupe..."
              rows={3}
              value={createForm.description}
              onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
            />
          </div>
          <button
            onClick={handleCreateGroup}
            disabled={!createForm.name.trim()}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Créer le groupe
          </button>
        </div>
      </Modal>

      {/* Join Modal */}
      <Modal open={showJoinModal} onClose={() => setShowJoinModal(false)} title="Rejoindre un groupe">
        <div className="space-y-4">
          <div>
            <label className="label">Code d'invitation</label>
            <input
              type="text"
              className="input-field uppercase tracking-widest"
              placeholder="ABC123"
              maxLength={6}
              value={joinForm.inviteCode}
              onChange={e => setJoinForm({ inviteCode: e.target.value.toUpperCase() })}
            />
          </div>
          <button
            onClick={handleJoinGroup}
            disabled={joinForm.inviteCode.length !== 6}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Rejoindre
          </button>
        </div>
      </Modal>
    </div>
  );
}
