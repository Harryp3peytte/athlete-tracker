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
  emerald: 'rgba(16,185,129,0.15)',
  orange: 'rgba(255,159,10,0.15)',
  purple: 'rgba(142,138,255,0.15)',
  blue: 'rgba(100,210,255,0.15)',
  pink: 'rgba(255,55,95,0.15)',
  red: 'rgba(255,107,107,0.15)',
  teal: 'rgba(0,199,190,0.15)',
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
