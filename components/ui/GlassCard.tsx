'use client';

import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'emerald' | 'orange' | 'purple' | 'blue' | 'pink' | 'red' | 'teal';
  onClick?: () => void;
}

export default function GlassCard({ children, className = '', hover = false, glow, onClick }: GlassCardProps) {
  const glowColors: Record<string, string> = {
    emerald: 'rgba(16,185,129,0.12)',
    orange: 'rgba(255,159,10,0.12)',
    purple: 'rgba(142,138,255,0.12)',
    blue: 'rgba(100,210,255,0.12)',
    pink: 'rgba(255,55,95,0.12)',
    red: 'rgba(255,107,107,0.12)',
    teal: 'rgba(0,199,190,0.12)',
  };

  return (
    <div
      className={`p-5 ${className}`}
      onClick={onClick}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        boxShadow: `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...(hover ? { cursor: 'pointer' } : {}),
      }}
      onMouseEnter={e => {
        if (hover) {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
          e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)${glow ? `, 0 0 24px ${glowColors[glow]}` : ''}`;
        }
      }}
      onMouseLeave={e => {
        if (hover) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)';
        }
      }}
    >
      {children}
    </div>
  );
}
