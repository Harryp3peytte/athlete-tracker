'use client';

import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
  glow?: 'emerald' | 'orange' | 'purple' | 'blue' | 'pink' | 'red' | 'teal';
  onClick?: () => void;
}

const glowColors: Record<string, string> = {
  emerald: 'rgba(42,201,86,0.12)',
  orange: 'rgba(255,149,0,0.12)',
  purple: 'rgba(94,92,230,0.12)',
  blue: 'rgba(50,173,230,0.12)',
  pink: 'rgba(255,45,85,0.12)',
  red: 'rgba(255,45,85,0.12)',
  teal: 'rgba(0,199,190,0.12)',
};

export default function GlassCard({ children, className = '', style, hover = false, glow, onClick }: GlassCardProps) {
  return (
    <div
      className={`glass p-5 ${hover ? 'cursor-pointer' : ''} ${className}`}
      style={style}
      onClick={onClick}
      onMouseEnter={e => {
        if (hover) {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
          if (glow) {
            e.currentTarget.style.boxShadow = `var(--glass-shadow-elevated), 0 0 24px ${glowColors[glow]}`;
          } else {
            e.currentTarget.style.boxShadow = 'var(--glass-shadow-elevated)';
          }
        }
      }}
      onMouseLeave={e => {
        if (hover) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.borderColor = 'var(--glass-border)';
          e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
        }
      }}
    >
      {children}
    </div>
  );
}
