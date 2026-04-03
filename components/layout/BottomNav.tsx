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
  { href: '/meals', icon: Utensils, label: 'Alimentation', color: '#FF9500' },
  { href: '/sleep', icon: Moon, label: 'Sommeil', color: '#5E5CE6' },
  { href: '/activities', icon: Activity, label: 'Cardio', color: '#FF2D55' },
  { href: '/workouts', icon: Dumbbell, label: 'Musculation', color: '#BF5AF2' },
  { href: '/hydration', icon: Droplets, label: 'Hydratation', color: '#32ADE6' },
  { href: '/wellness', icon: Heart, label: 'Bien-être', color: '#FF375F' },
];

const socialItems = [
  { href: '/groups', icon: Users, label: 'Groupes', color: '#00C7BE' },
  { href: '/chat', icon: MessageCircle, label: 'Coach IA', color: '#2AC956' },
  { href: '/profile', icon: User, label: 'Profil', color: '#5E5CE6' },
];

const mobileItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/groups', icon: Users, label: 'Groupe' },
  { href: '/workouts', icon: Dumbbell, label: 'Muscu' },
  { href: '/profile', icon: User, label: 'Profil' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { profile } = useProfile();
  const { signOut } = useAuth();

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
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
        {/* User header */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--separator)' }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{
                background: 'linear-gradient(135deg, #FF2D55, #FF6B8A)',
                color: '#fff',
              }}
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

      {/* ===== Bottom nav mobile (iOS tab bar — 4 items) ===== */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50"
        style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -2px 20px rgba(139, 58, 74, 0.06)',
        }}
      >
        <div className="flex justify-around py-2 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {mobileItems.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} className="flex flex-col items-center gap-0.5 py-1 px-3 relative">
                <Icon size={22} style={{ color: active ? '#FF2D55' : '#9B8A8A' }} />
                <span className="text-[10px] font-medium" style={{ color: active ? '#FF2D55' : '#9B8A8A' }}>{label}</span>
                {active && (
                  <div className="absolute -bottom-1 w-5 h-[3px] rounded-full" style={{ background: '#FF2D55' }} />
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
          background: `${activeColor}15`,
          color: activeColor,
        }
        : {
          color: '#6B5B5B',
        }
      }
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)';
          e.currentTarget.style.color = '#1A1A1A';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#6B5B5B';
        }
      }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: `${iconColor || activeColor}15` }}
      >
        <Icon size={15} style={{ color: active ? activeColor : (iconColor || activeColor) }} />
      </div>
      {label}
    </Link>
  );
}
