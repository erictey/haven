import type { CSSProperties } from 'react';
import type { MissionCategory } from '../lib/types';
import { CATEGORY_VISUALS } from '../lib/visuals';

type Props = {
  category: MissionCategory;
  className?: string;
  decorative?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

export function CategoryEmblem({
  category,
  className = '',
  decorative = false,
  size = 'md',
}: Props) {
  const visual = CATEGORY_VISUALS[category];

  return (
    <span
      aria-hidden={decorative}
      aria-label={decorative ? undefined : `${category} emblem`}
      className={`category-emblem category-emblem-${size} ${className}`.trim()}
      style={
        {
          '--category-accent': visual.accent,
          '--category-glow': visual.glow,
        } as CSSProperties
      }
    >
      <svg viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          fill="rgba(7, 18, 27, 0.48)"
          r="24"
          stroke="rgba(223, 254, 255, 0.12)"
          strokeWidth="1.25"
        />
        <path
          d={visual.arcA}
          fill="none"
          stroke="var(--category-accent)"
          strokeLinecap="round"
          strokeWidth="3"
        />
        <path
          d={visual.arcB}
          fill="none"
          opacity="0.78"
          stroke="rgba(223, 254, 255, 0.72)"
          strokeLinecap="round"
          strokeWidth="2"
        />
        {visual.detailPaths.map((path) => (
          <path
            d={path}
            fill="none"
            key={path}
            stroke="rgba(223, 254, 255, 0.92)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        ))}
      </svg>
    </span>
  );
}
