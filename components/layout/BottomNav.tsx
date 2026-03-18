'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Scale, Utensils, Moon, Activity, Dumbbell, Droplets, Heart,
  Users, MessageCircle, User, LogOut,
} from 'lucide-react';

const trackingItems = [
  { href: '/weight', icon: Scale, label: 'Poids', color: '#30D158' },
  { href: '/meals', icon: Utensils, label: 'Alimentation', color: '#FF9F0A' },
  { href: '/sleep', icon: Moon, label: 'Sommeil', color: '#8E8AFF' },
  { href: '/activities', icon: Activity, label: 'Cardio', color: '#FF6B6B' },
  { href: '/workouts', icon: Dumbbell, label: 'Musculation', color: '#BF5AF2' },
  { href: '/hydration', icon: Droplets, label: 'Hydratation', color: '#64D2FF' },
  { href: '/wellness', icon: Heart, label: 'Bien-être', color: '#FF375F' },
];

const socialItems = [
  { href: '/groups', icon: Users, label: 'Groupes', color: '#00C7BE' },
  { href: '/chat', icon: MessageCircle, label: 'Coach IA', color: '#2AC956' },
  { href: '/profile', icon: User, label: 'Profil', color: '#8E8AFF' },
];

const mobileItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/activities', icon: Activity, label: 'Tracking' },
  { href: '/groups', icon: Users, label: 'Groupes' },
  { href: '/chat', icon: MessageCircle, label: 'Coach' },
  { href: '/profile', icon: User, label: 'Profil' },
];

const trackingPaths = ['/weight', '/meals', '/sleep', '/activities', '/hydration', '/wellness', '/workouts'];

export default function BottomNav() {
  const pathname = usePathname();
  const { profile } = useProfile();
  const { signOut } = useAuth();

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  const isTrackingActive = trackingPaths.some(p => pathname.startsWith(p));
  const initials = profile?.name ? profile.name.slice(0, 2).toUpperCase() : '?';

  return (
    <>
      {/* ===== Sidebar desktop ===== */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:flex-col z-40"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.015) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* User header */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(139,92,246,0.25))',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate text-white">{profile?.name || 'Chargement...'}</div>
              <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>FitTrack Athlete</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {/* Dashboard */}
          <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" active={pathname === '/dashboard'} activeColor="#10B981" />

          <div className="pt-5 pb-2 px-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>Tracking</div>
          {trackingItems.map(item => (
            <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={isActive(item.href)} activeColor={item.color} iconColor={item.color} />
          ))}

          <div className="pt-5 pb-2 px-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>Social</div>
          {socialItems.map(item => (
            <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={isActive(item.href)} activeColor={item.color} iconColor={item.color} />
          ))}
        </nav>

        {/* Logout at bottom */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium w-full transition-all duration-200 hover:bg-white/[0.04]"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,107,107,0.1)' }}>
              <LogOut size={14} style={{ color: '#FF6B6B' }} />
            </div>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ===== Bottom nav mobile ===== */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50"
        style={{
          background: 'rgba(11,17,32,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex justify-around py-2 px-1">
          {mobileItems.map(({ href, icon: Icon, label }) => {
            const active = href === '/activities' ? isTrackingActive : isActive(href);
            return (
              <Link key={href} href={href} className="flex flex-col items-center gap-0.5 py-1 px-2 relative">
                <Icon size={22} style={{ color: active ? '#2AC956' : 'rgba(255,255,255,0.3)' }} />
                <span className="text-[10px]" style={{ color: active ? '#2AC956' : 'rgba(255,255,255,0.3)' }}>{label}</span>
                {active && (
                  <div className="absolute -bottom-1 w-5 h-0.5 rounded-full" style={{ background: '#2AC956', boxShadow: '0 0 8px #2AC95660' }} />
                )}
              </Link>
            );
          })}
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
      style={active
        ? {
          background: `${activeColor}e6`,
          color: '#fff',
          boxShadow: `0 4px 12px ${activeColor}40`,
        }
        : {
          color: 'rgba(255,255,255,0.5)',
        }
      }
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
        }
      }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={active
          ? { background: 'rgba(255,255,255,0.2)' }
          : { background: `${iconColor || activeColor}15` }
        }
      >
        <Icon size={15} style={{ color: active ? '#fff' : (iconColor || activeColor) }} />
      </div>
      {label}
    </Link>
  );
}
