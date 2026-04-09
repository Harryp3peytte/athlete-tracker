'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Scale, Utensils, Moon, Activity, Dumbbell, Droplets, Heart,
  Users, MessageCircle, User, LogOut, BarChart3, X, Ruler,
} from 'lucide-react';

const trackingItems = [
  { href: '/weight', icon: Scale, label: 'Poids', color: '#30D158' },
  { href: '/meals', icon: Utensils, label: 'Alimentation', color: '#FF9500' },
  { href: '/sleep', icon: Moon, label: 'Sommeil', color: '#5E5CE6' },
  { href: '/activities', icon: Activity, label: 'Cardio', color: '#FF2D55' },
  { href: '/workouts', icon: Dumbbell, label: 'Musculation', color: '#BF5AF2' },
  { href: '/hydration', icon: Droplets, label: 'Hydratation', color: '#32ADE6' },
  { href: '/wellness', icon: Heart, label: 'Bien-être', color: '#FF375F' },
  { href: '/measurements', icon: Ruler, label: 'Mensurations', color: '#32ADE6' },
];

const socialItems = [
  { href: '/groups', icon: Users, label: 'Groupes', color: '#00C7BE' },
  { href: '/chat', icon: MessageCircle, label: 'Coach IA', color: '#2AC956' },
  { href: '/profile', icon: User, label: 'Profil', color: '#5E5CE6' },
];

const trackingPaths = trackingItems.map(i => i.href);

export default function BottomNav() {
  const pathname = usePathname();
  const { profile } = useProfile();
  const { signOut } = useAuth();
  const [trackingMenuOpen, setTrackingMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  const isTrackingActive = trackingPaths.some(p => isActive(p));
  const initials = profile?.name ? profile.name.slice(0, 2).toUpperCase() : '?';

  return (
    <>
      {/* ===== Sidebar desktop ===== */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:flex-col z-40"
        style={{
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.6)',
        }}
      >
        <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--separator)' }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, #FF2D55, #FF6B8A)', color: '#fff' }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm truncate" style={{ color: '#1A1A1A' }}>{profile?.name || 'Chargement...'}</div>
              <div className="text-[11px]" style={{ color: '#9B8A8A' }}>FitTrack Athlete</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" active={pathname === '/dashboard'} activeColor="#FF2D55" />
          <div className="pt-5 pb-2 px-3 section-header">Tracking</div>
          {trackingItems.map(item => (
            <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={isActive(item.href)} activeColor={item.color} iconColor={item.color} />
          ))}
          <div className="pt-5 pb-2 px-3 section-header">Social</div>
          {socialItems.map(item => (
            <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={isActive(item.href)} activeColor={item.color} iconColor={item.color} />
          ))}
        </nav>

        <div className="px-3 py-4" style={{ borderTop: '1px solid var(--separator)' }}>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium w-full transition-all duration-200"
            style={{ color: '#6B5B5B' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 45, 85, 0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,45,85,0.1)' }}>
              <LogOut size={14} style={{ color: '#FF2D55' }} />
            </div>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ===== Tracking menu overlay (mobile) ===== */}
      {trackingMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0, 0, 0, 0.25)', backdropFilter: 'blur(10px)' }}
            onClick={() => setTrackingMenuOpen(false)}
          />
          <div
            className="relative w-full"
            style={{
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              borderRadius: '24px 24px 0 0',
              boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-black/15" />
            </div>
            <div className="flex items-center justify-between px-6 py-3">
              <h3 className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>Tracking</h3>
              <button onClick={() => setTrackingMenuOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.06)' }}>
                <X size={16} style={{ color: '#6B5B5B' }} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 px-4 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.5rem))]">
              {trackingItems.map(({ href, icon: Icon, label, color }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setTrackingMenuOpen(false)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95"
                  style={{
                    background: isActive(href) ? `${color}12` : 'rgba(255,255,255,0.5)',
                    border: isActive(href) ? `1.5px solid ${color}40` : '1px solid rgba(180,130,130,0.08)',
                  }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: isActive(href) ? color : '#6B5B5B' }}>{label}</span>
                </Link>
              ))}
              <Link
                href="/chat"
                onClick={() => setTrackingMenuOpen(false)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95"
                style={{
                  background: isActive('/chat') ? '#2AC95612' : 'rgba(255,255,255,0.5)',
                  border: isActive('/chat') ? '1.5px solid #2AC95640' : '1px solid rgba(180,130,130,0.08)',
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#2AC95615' }}>
                  <MessageCircle size={18} style={{ color: '#2AC956' }} />
                </div>
                <span className="text-[10px] font-medium" style={{ color: isActive('/chat') ? '#2AC956' : '#6B5B5B' }}>Coach IA</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ===== Bottom nav mobile (5 items) ===== */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40"
        style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -2px 20px rgba(139, 58, 74, 0.06)',
        }}
      >
        <div className="flex justify-around py-2 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <Link href="/dashboard" className="flex flex-col items-center gap-0.5 py-1 px-2 relative">
            <LayoutDashboard size={22} style={{ color: isActive('/dashboard') ? '#FF2D55' : '#9B8A8A' }} />
            <span className="text-[10px] font-medium" style={{ color: isActive('/dashboard') ? '#FF2D55' : '#9B8A8A' }}>Home</span>
            {isActive('/dashboard') && <div className="absolute -bottom-1 w-5 h-[3px] rounded-full" style={{ background: '#FF2D55' }} />}
          </Link>

          <button onClick={() => setTrackingMenuOpen(true)} className="flex flex-col items-center gap-0.5 py-1 px-2 relative">
            <BarChart3 size={22} style={{ color: isTrackingActive ? '#FF9500' : '#9B8A8A' }} />
            <span className="text-[10px] font-medium" style={{ color: isTrackingActive ? '#FF9500' : '#9B8A8A' }}>Tracking</span>
            {isTrackingActive && <div className="absolute -bottom-1 w-5 h-[3px] rounded-full" style={{ background: '#FF9500' }} />}
          </button>

          <Link href="/workouts" className="flex flex-col items-center gap-0.5 py-1 px-2 relative">
            <Dumbbell size={22} style={{ color: isActive('/workouts') ? '#BF5AF2' : '#9B8A8A' }} />
            <span className="text-[10px] font-medium" style={{ color: isActive('/workouts') ? '#BF5AF2' : '#9B8A8A' }}>Muscu</span>
            {isActive('/workouts') && <div className="absolute -bottom-1 w-5 h-[3px] rounded-full" style={{ background: '#BF5AF2' }} />}
          </Link>

          <Link href="/groups" className="flex flex-col items-center gap-0.5 py-1 px-2 relative">
            <Users size={22} style={{ color: isActive('/groups') ? '#00C7BE' : '#9B8A8A' }} />
            <span className="text-[10px] font-medium" style={{ color: isActive('/groups') ? '#00C7BE' : '#9B8A8A' }}>Groupe</span>
            {isActive('/groups') && <div className="absolute -bottom-1 w-5 h-[3px] rounded-full" style={{ background: '#00C7BE' }} />}
          </Link>

          <Link href="/profile" className="flex flex-col items-center gap-0.5 py-1 px-2 relative">
            <User size={22} style={{ color: isActive('/profile') ? '#5E5CE6' : '#9B8A8A' }} />
            <span className="text-[10px] font-medium" style={{ color: isActive('/profile') ? '#5E5CE6' : '#9B8A8A' }}>Profil</span>
            {isActive('/profile') && <div className="absolute -bottom-1 w-5 h-[3px] rounded-full" style={{ background: '#5E5CE6' }} />}
          </Link>
        </div>
      </nav>
    </>
  );
}

function NavItem({ href, icon: Icon, label, active, activeColor, iconColor }: {
  href: string; icon: React.ComponentType<Record<string, unknown>>; label: string; active: boolean; activeColor: string; iconColor?: string;
}) {
  return (
    <Link href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200"
      style={active ? { background: `${activeColor}15`, color: activeColor } : { color: '#6B5B5B' }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)'; e.currentTarget.style.color = '#1A1A1A'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B5B5B'; } }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${iconColor || activeColor}15` }}>
        <Icon size={15} style={{ color: active ? activeColor : (iconColor || activeColor) }} />
      </div>
      {label}
    </Link>
  );
}
