import { useEffect, useRef, useState, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  delay?: number;
  intensity?: number;
};

export function FloatingBubble({ children, delay = 0, intensity = 1 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    // Intersection Observer for visibility-based animation pausing
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Staggered entrance animation
    const timer = setTimeout(() => {
      setHasEntered(true);
    }, delay * 150);

    return () => clearTimeout(timer);
  }, [delay]);

  // Determine animation duration based on intensity
  const animationDuration = `${8 / intensity}s`;

  return (
    <div 
      className={`floating-bubble ${hasEntered ? 'animate-in' : ''}`}
      ref={ref}
      style={{
        animationDuration: hasEntered ? animationDuration : undefined,
        animationPlayState: isVisible ? 'running' : 'paused',
        animationDelay: hasEntered ? `${delay * 0.2}s` : undefined,
        opacity: hasEntered ? 1 : 0,
      }}
    >
      {children}
    </div>
  );
}
