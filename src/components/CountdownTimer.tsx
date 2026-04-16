import { useEffect, useRef, useState } from 'react';
import { useCycleTimer } from '../hooks/useCycleTimer';

type Props = {
  endDate?: string;
};

type CountdownUnitProps = {
  value: number;
  label: string;
  urgency: 'normal' | 'urgent' | 'critical';
};

function CountdownUnit({ value, label, urgency }: CountdownUnitProps) {
  const [isChanging, setIsChanging] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      setIsChanging(true);
      const timer = setTimeout(() => setIsChanging(false), 300);
      prevValue.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  const urgencyClass = urgency !== 'normal' ? urgency : '';

  return (
    <article className={`countdown-unit ${urgencyClass}`}>
      <span className={`countdown-value ${isChanging ? 'changing' : ''}`}>
        {String(value).padStart(2, '0')}
      </span>
      <span className="countdown-label">{label}</span>
    </article>
  );
}

export function CountdownTimer({ endDate }: Props) {
  const { days, hours, minutes, remainingMs } = useCycleTimer(endDate);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!endDate) {
    return null;
  }

  // Determine urgency level
  const hoursRemaining = remainingMs / (1000 * 60 * 60);
  const urgency: 'normal' | 'urgent' | 'critical' = 
    hoursRemaining <= 6 ? 'critical' : 
    hoursRemaining <= 24 ? 'urgent' : 
    'normal';

  return (
    <section className={`panel stack-md ${isVisible ? 'animate-scale-in' : ''}`} style={{ opacity: isVisible ? 1 : 0 }}>
      <div className="section-header">
        <div>
          <p className="eyebrow">Cycle Timer</p>
          <h3>Time remaining</h3>
        </div>
      </div>

      <div className="countdown-wrapper">
        <CountdownUnit value={days} label="Days" urgency={urgency} />
        <CountdownUnit value={hours} label="Hours" urgency={urgency} />
        <CountdownUnit value={minutes} label="Minutes" urgency={urgency} />
      </div>

      {urgency === 'critical' && (
        <p className="step-hint" style={{ textAlign: 'center', marginTop: '8px' }}>
          Time is almost up! Complete your cycle soon.
        </p>
      )}
    </section>
  );
}
