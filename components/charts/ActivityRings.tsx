'use client';

import { useEffect, useState } from 'react';

interface RingData {
  value: number;
  max: number;
  color: string;
  label: string;
}

interface ActivityRingsProps {
  rings: RingData[];
  size?: number;
}

export default function ActivityRings({ rings, size = 140 }: ActivityRingsProps) {
  const [animated, setAnimated] = useState(false);
  const strokeWidth = 12;
  const gap = 4;
  const center = size / 2;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {rings.map((ring, i) => {
          const radius = center - strokeWidth / 2 - i * (strokeWidth + gap);
          const circumference = 2 * Math.PI * radius;
          const progress = Math.min(ring.value / ring.max, 1);
          const offset = circumference - progress * circumference;

          return (
            <g key={i}>
              {/* Background ring */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={`${ring.color}20`}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
              {/* Foreground ring */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={ring.color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={animated ? offset : circumference}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: `drop-shadow(0 0 4px ${ring.color}50)`,
                }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
