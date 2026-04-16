import { useEffect, useState } from 'react';
import { CountdownTimer } from '../components/CountdownTimer';
import { CoreValuesDisplay } from '../components/CoreValuesDisplay';
import { FloatingBubble } from '../components/FloatingBubble';
import { MissionCard } from '../components/MissionCard';
import { MotivationalMessage } from '../components/MotivationalMessage';
import { useAppContext } from '../context/AppContext';

function formatDate(dateIso?: string) {
  return dateIso ? new Date(dateIso).toLocaleDateString(undefined, { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric' 
  }) : 'Unknown';
}

export function DashboardScreen() {
  const { activeCycle, activeCycleItems, coreValues, cycleMessage } = useAppContext();
  const [showGreeting, setShowGreeting] = useState(true);
  const [greetingPhase, setGreetingPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    if (showGreeting) {
      // Phase 1: Enter animation (already happening via CSS)
      const holdTimer = setTimeout(() => setGreetingPhase('hold'), 800);
      
      // Phase 2: Exit animation
      const exitTimer = setTimeout(() => setGreetingPhase('exit'), 1800);
      
      // Phase 3: Switch to dashboard
      const switchTimer = setTimeout(() => setShowGreeting(false), 2300);
      
      return () => {
        clearTimeout(holdTimer);
        clearTimeout(exitTimer);
        clearTimeout(switchTimer);
      };
    }
  }, [showGreeting]);

  if (showGreeting) {
    return (
      <section className="screen">
        <div 
          className={`step-greeting dash-greeting ${greetingPhase === 'exit' ? 'screen-exit' : ''}`}
        >
          <h2 className="greeting-title greeting-fade-in">Welcome back</h2>
          <p className="greeting-sub">Stay with the mission you chose.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="screen stack-xl">
      <div className="animate-slide-up" style={{ animationDelay: '0s' }}>
        <CoreValuesDisplay values={coreValues} />
      </div>

      <div className="mission-grid stagger-in">
        <FloatingBubble delay={0} intensity={1.4}>
          <MissionCard
            caption="Develop directly."
            text={activeCycleItems.build?.text ?? 'No build mission found.'}
            title="Build"
            category="build"
            index={0}
          />
        </FloatingBubble>
        <FloatingBubble delay={1} intensity={1.1}>
          <MissionCard
            caption="Influence patiently."
            text={activeCycleItems.shape?.text ?? 'No shape mission found.'}
            title="Shape"
            category="shape"
            index={1}
          />
        </FloatingBubble>
        <FloatingBubble delay={2} intensity={1.2}>
          <MissionCard
            caption="Respond well."
            text={activeCycleItems.workWith?.text ?? 'No work with mission found.'}
            title="Work With"
            category="workWith"
            index={2}
          />
        </FloatingBubble>
      </div>

      <div className="dashboard-grid stagger-in" style={{ animationDelay: '0.3s' }}>
        <CountdownTimer endDate={activeCycle?.endDate} />
        <MotivationalMessage message={cycleMessage} />
      </div>

      <p 
        className="date-copy animate-fade-in" 
        style={{ textAlign: 'center', animationDelay: '0.5s' }}
      >
        {formatDate(activeCycle?.startDate)} to {formatDate(activeCycle?.endDate)}
      </p>
    </section>
  );
}
