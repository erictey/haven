import { OBSERVATORY_THEME } from '../lib/visuals';

type Props = {
  variant?: 'hero' | 'panel' | 'compact';
};

export function BrandMark({ variant = 'panel' }: Props) {
  const compact = variant === 'compact';

  return (
    <div className={`brand-mark brand-mark-${variant}`}>
      <div className="brand-mark-icon" aria-hidden="true">
        <svg viewBox="0 0 72 72" role="img">
          <defs>
            <linearGradient id="brandGlow" x1="14" x2="58" y1="10" y2="62" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#dffeff" />
              <stop offset="0.4" stopColor="#8fc8ff" />
              <stop offset="1" stopColor="#7cf4dc" />
            </linearGradient>
          </defs>
          <circle cx="36" cy="36" fill="rgba(10, 25, 38, 0.4)" r="25" stroke="rgba(223, 254, 255, 0.14)" />
          <path
            d="M13 44C22 31 36 25 57 24"
            fill="none"
            stroke="url(#brandGlow)"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <path
            d="M17 54C29 46 42 42 60 40"
            fill="none"
            opacity="0.8"
            stroke="rgba(124, 244, 220, 0.75)"
            strokeLinecap="round"
            strokeWidth="2.8"
          />
          <path
            d="M26 18C36 14 46 16 54 23"
            fill="none"
            opacity="0.65"
            stroke="rgba(223, 254, 255, 0.72)"
            strokeLinecap="round"
            strokeWidth="2.8"
          />
          <circle cx="50" cy="24" fill="#dffeff" r="3.5" />
          <circle cx="36" cy="36" fill="#081a25" r="5" stroke="rgba(223, 254, 255, 0.8)" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="brand-mark-copy">
        <span className="brand-mark-word">{OBSERVATORY_THEME.brandName}</span>
        {!compact ? (
          <span className="brand-mark-tag">{OBSERVATORY_THEME.descriptor}</span>
        ) : null}
      </div>
    </div>
  );
}
