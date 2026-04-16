import type { CSSProperties } from 'react';
import { OBSERVATORY_ARCS, OBSERVATORY_PARTICLES } from '../lib/visuals';

export function ObservatoryBackdrop() {
  return (
    <div className="observatory-backdrop" aria-hidden="true">
      <div className="observatory-aurora observatory-aurora-a" />
      <div className="observatory-aurora observatory-aurora-b" />
      <div className="observatory-horizon-band" />
      <div className="observatory-grid" />

      {OBSERVATORY_ARCS.map((arc, index) => (
        <span
          className="observatory-arc"
          key={`${arc.top}-${arc.left}-${index}`}
          style={
            {
              '--arc-top': arc.top,
              '--arc-left': arc.left,
              '--arc-size': `${arc.size}px`,
              '--arc-rotate': `${arc.rotate}deg`,
              '--arc-opacity': arc.opacity,
              '--arc-delay': arc.delay,
              '--arc-duration': arc.duration,
              '--arc-sweep': arc.sweep,
            } as CSSProperties
          }
        />
      ))}

      {OBSERVATORY_PARTICLES.map((particle, index) => (
        <span
          className="observatory-particle"
          key={`${particle.top}-${particle.left}-${index}`}
          style={
            {
              '--particle-top': particle.top,
              '--particle-left': particle.left,
              '--particle-size': `${particle.size}px`,
              '--particle-opacity': particle.opacity,
              '--particle-delay': particle.delay,
              '--particle-duration': particle.duration,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
