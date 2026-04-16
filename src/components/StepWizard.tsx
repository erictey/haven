import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

export type StepConfig = {
  key: string;
  canAdvance?: boolean;
};

type Props = {
  steps: StepConfig[];
  renderStep: (index: number) => ReactNode;
  onComplete?: () => void;
  completeLabel?: string;
  showProgress?: boolean;
};

export function StepWizard({
  steps,
  renderStep,
  onComplete,
  completeLabel = 'Continue',
  showProgress = true,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [phase, setPhase] = useState<'enter' | 'idle' | 'exit'>('enter');
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const prevIndexRef = useRef(0);

  const currentStep = steps[currentIndex];
  const canAdvance = currentStep?.canAdvance !== false;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === steps.length - 1;
  const progress = Math.round(((currentIndex + 1) / steps.length) * 100);

  useEffect(() => {
    setPhase('enter');
    const t = setTimeout(() => setPhase('idle'), 500);
    return () => clearTimeout(t);
  }, [displayedIndex]);

  const navigate = useCallback((nextIndex: number) => {
    const goingForward = nextIndex > prevIndexRef.current;
    setDirection(goingForward ? 'forward' : 'backward');
    prevIndexRef.current = nextIndex;
    
    setPhase('exit');
    setTimeout(() => {
      setCurrentIndex(nextIndex);
      setDisplayedIndex(nextIndex);
    }, 350);
  }, []);

  const next = () => {
    if (!canAdvance) return;
    if (isLast) { onComplete?.(); return; }
    navigate(currentIndex + 1);
  };

  const back = () => {
    if (!isFirst) navigate(currentIndex - 1);
  };

  const goToStep = (index: number) => {
    // Only allow going back to completed steps
    if (index < currentIndex) {
      navigate(index);
    }
  };

  const getPhaseClass = () => {
    if (phase === 'exit') {
      return direction === 'forward' ? 'step-exit' : 'step-exit-reverse';
    }
    if (phase === 'enter') {
      return direction === 'forward' ? 'step-enter' : 'step-enter-reverse';
    }
    return '';
  };

  return (
    <div className="step-wizard">
      {showProgress && steps.length > 1 && (
        <div className="step-progress" role="navigation" aria-label="Step progress">
          {steps.map((s, i) => (
            <button
              className={[
                'step-dot',
                i === currentIndex ? 'step-dot-active' : '',
                i < currentIndex ? 'step-dot-done' : '',
              ].filter(Boolean).join(' ')}
              key={s.key}
              onClick={() => goToStep(i)}
              disabled={i > currentIndex}
              type="button"
              aria-label={`Step ${i + 1} of ${steps.length}`}
              aria-current={i === currentIndex ? 'step' : undefined}
            />
          ))}
          <span className="step-progress-text" style={{ 
            marginLeft: '12px', 
            fontSize: '0.75rem', 
            color: 'var(--muted)',
            fontWeight: 600
          }}>
            {progress}%
          </span>
        </div>
      )}

      <div className={`step-content ${getPhaseClass()}`}>
        {renderStep(displayedIndex)}
      </div>

      <div className="step-nav">
        {!isFirst && (
          <button 
            className="button secondary" 
            onClick={back} 
            type="button"
          >
            Back
          </button>
        )}
        <div className="step-nav-spacer" />
        <button
          className={`button ${isLast && onComplete ? 'confirm-pulse' : ''}`}
          disabled={!canAdvance}
          onClick={next}
          type="button"
        >
          {isLast ? completeLabel : 'Continue'}
        </button>
      </div>
    </div>
  );
}
