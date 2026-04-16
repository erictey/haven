import { useEffect, useState } from 'react';
import type { MotivationalMessage as MotivationalMessageType } from '../lib/types';

type Props = {
  message: MotivationalMessageType;
};

export function MotivationalMessage({ message }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section 
      className={`panel message-card ${isVisible ? 'animate-scale-in' : ''}`}
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      <div className="message-card-glow" aria-hidden="true" />
      <div className="section-header">
        <div>
          <p className="eyebrow">Reminder</p>
          <h3>A thought for today</h3>
        </div>
        <span className="badge neutral state-pill">{message.type}</span>
      </div>
      <p className="mission-text">{message.text}</p>
    </section>
  );
}
