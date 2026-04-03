'use client';

import { useEffect, useState } from 'react';

interface AnimatedRingProps {
  score: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  gradientFrom?: string;
  gradientTo?: string;
  label?: string;
  showScore?: boolean;
}

export default function AnimatedRing({
  score,
  max = 100,
  size = 140,
  strokeWidth = 10,
  gradientFrom = '#10B981',
  gradientTo = '#059669',
  label,
  showScore = true,
}: AnimatedRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(animatedScore / max, 1);
  const offset = circumference - progress * circumference;
  const gradientId = `ring-gradient-${Math.random().toString(36).slice(2, 8)}`;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={strokeWidth}
        />
        {/* Foreground ring with gradient */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 6px ${gradientFrom}40)`,
          }}
        />
      </svg>
      {showScore && (
        <div className="absolute flex flex-col items-center">
          <span className="num-highlight text-3xl" style={{ color: gradientFrom }}>{score}</span>
          {label ? (
            <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</span>
          ) : (
            <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>/{max}</span>
          )}
        </div>
      )}
    </div>
  );
}
