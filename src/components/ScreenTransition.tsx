import { useEffect, useRef, useState, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  transitionKey: string;
};

export function ScreenTransition({ children, transitionKey }: Props) {
  const [displayed, setDisplayed] = useState(children);
  const [phase, setPhase] = useState<'enter' | 'exit' | 'idle'>('enter');
  const prevKey = useRef(transitionKey);
  const exitTimerRef = useRef<number | null>(null);
  const enterTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (transitionKey === prevKey.current) {
      setDisplayed(children);
      return;
    }

    prevKey.current = transitionKey;
    setPhase('exit');

    // Clear any existing timers
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);

    exitTimerRef.current = window.setTimeout(() => {
      setDisplayed(children);
      setPhase('enter');

      enterTimerRef.current = window.setTimeout(() => {
        setPhase('idle');
      }, 600); // Match the new longer enter animation
    }, 350); // Match the new exit animation duration

    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    };
  }, [transitionKey, children]);

  const className = [
    'screen-transition',
    phase === 'exit' ? 'screen-exit' : '',
    phase === 'enter' ? 'screen-enter' : '',
  ].filter(Boolean).join(' ');

  return <div className={className}>{displayed}</div>;
}
