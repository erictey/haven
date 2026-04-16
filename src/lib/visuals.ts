import type { MissionCategory } from './types';

export type CategoryVisual = {
  accent: string;
  glow: string;
  descriptor: string;
  orbitName: string;
  arcA: string;
  arcB: string;
  detailPaths: string[];
};

export type ObservatoryParticle = {
  top: string;
  left: string;
  size: number;
  opacity: number;
  delay: string;
  duration: string;
};

export type ObservatoryArc = {
  top: string;
  left: string;
  size: number;
  rotate: number;
  opacity: number;
  delay: string;
  duration: string;
  sweep: number;
};

export const OBSERVATORY_THEME = {
  brandName: 'Haven',
  descriptor: 'Polar Horizon Observatory',
  shellLabel: 'Private weekly navigation',
  tagline: 'A calm horizon for what to build, shape, and work with.',
  palette: {
    deep: '#041019',
    base: '#081a25',
    surface: 'rgba(10, 25, 38, 0.78)',
    horizon: '#7cf4dc',
    sky: '#8fc8ff',
    mist: '#dffeff',
    text: '#ebfdff',
    muted: '#8bb7c7',
  },
  motion: {
    auroraDuration: '26s',
    particleDuration: '20s',
    arcDuration: '24s',
  },
} as const;

export const CATEGORY_VISUALS: Record<MissionCategory, CategoryVisual> = {
  build: {
    accent: '#7cf4dc',
    glow: 'rgba(124, 244, 220, 0.42)',
    descriptor: 'Direct effort',
    orbitName: 'Northbound Signal',
    arcA: 'M11 47C20 37 30 27 49 17',
    arcB: 'M18 53C28 43 38 34 51 25',
    detailPaths: [
      'M32 17V47',
      'M23 27L32 18L41 27',
      'M21 43H43',
    ],
  },
  shape: {
    accent: '#8fc8ff',
    glow: 'rgba(143, 200, 255, 0.4)',
    descriptor: 'Gentle influence',
    orbitName: 'Horizon Lattice',
    arcA: 'M10 37C20 28 34 23 54 27',
    arcB: 'M13 46C24 42 39 40 54 44',
    detailPaths: [
      'M16 37H48',
      'M22 29L32 22L42 29',
      'M25 45H39',
    ],
  },
  workWith: {
    accent: '#a7ffe9',
    glow: 'rgba(167, 255, 233, 0.38)',
    descriptor: 'Wise response',
    orbitName: 'Eclipse Holding',
    arcA: 'M17 16C8 27 7 43 22 51',
    arcB: 'M47 13C56 24 57 40 44 50',
    detailPaths: [
      'M35 17C27 22 24 31 26 39C28 47 35 50 41 49',
      'M19 32H49',
      'M23 18C31 14 40 14 48 20',
    ],
  },
};

export const OBSERVATORY_PARTICLES: ObservatoryParticle[] = [
  { top: '10%', left: '12%', size: 5, opacity: 0.34, delay: '-3s', duration: '22s' },
  { top: '17%', left: '74%', size: 7, opacity: 0.22, delay: '-7s', duration: '19s' },
  { top: '31%', left: '48%', size: 4, opacity: 0.3, delay: '-2s', duration: '18s' },
  { top: '52%', left: '20%', size: 6, opacity: 0.26, delay: '-9s', duration: '24s' },
  { top: '63%', left: '68%', size: 5, opacity: 0.28, delay: '-5s', duration: '21s' },
  { top: '79%', left: '34%', size: 4, opacity: 0.22, delay: '-10s', duration: '23s' },
  { top: '84%', left: '86%', size: 7, opacity: 0.18, delay: '-12s', duration: '20s' },
];

export const OBSERVATORY_ARCS: ObservatoryArc[] = [
  {
    top: '7%',
    left: '-8%',
    size: 360,
    rotate: -8,
    opacity: 0.32,
    delay: '-6s',
    duration: '28s',
    sweep: 0.34,
  },
  {
    top: '22%',
    left: '58%',
    size: 280,
    rotate: 14,
    opacity: 0.24,
    delay: '-12s',
    duration: '25s',
    sweep: 0.26,
  },
  {
    top: '58%',
    left: '8%',
    size: 420,
    rotate: 5,
    opacity: 0.18,
    delay: '-4s',
    duration: '32s',
    sweep: 0.2,
  },
];
