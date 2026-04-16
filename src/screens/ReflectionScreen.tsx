import { useState } from 'react';
import { FloatingBubble } from '../components/FloatingBubble';
import { MissionCard } from '../components/MissionCard';
import { ObservatoryScene } from '../components/ObservatoryScene';
import { ReflectionPrompts } from '../components/ReflectionPrompts';
import { StepWizard, type StepConfig } from '../components/StepWizard';
import { useAppContext } from '../context/AppContext';

const REFLECTION_PROMPTS = [
  'What actually happened this week — what did I do?',
  'What felt hard, and how did I handle it?',
  'Where did I surprise myself?',
  'Was there something I kept avoiding?',
  'Did my values show up in how I lived this week?',
  'What would I like to try differently next time?',
];

export function ReflectionScreen() {
  const { activeCycle, activeCycleItems, submitReflection } = useAppContext();
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const steps: StepConfig[] = [
    { key: 'greeting' },
    { key: 'review' },
    { key: 'prompts' },
    { key: 'write', canAdvance: text.trim().length > 0 },
  ];

  const handleSubmit = () => {
    if (!text.trim()) {
      setError('Take a moment to write something before moving on — even a few sentences help.');
      return;
    }
    submitReflection(text);
    setText('');
    setError('');
  };

  const renderStep = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="step-greeting">
            <div className="step-greeting-scene">
              <ObservatoryScene scene="reflection" />
            </div>
            <h2 className="greeting-title text-reveal">Time to Reflect</h2>
            <p className="greeting-sub">
              Your week wrapped up on{' '}
              {activeCycle ? new Date(activeCycle.endDate).toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              }) : 'unknown date'}.
              Before you move on, take a moment to look back at how things went.
            </p>
          </div>
        );

      case 1:
        return (
          <div className="step-section stack-lg">
            <div className="step-greeting" style={{ padding: '8px 0' }}>
              <h2 className="greeting-title" style={{ fontSize: '1.6rem' }}>
                Here's what you were working on
              </h2>
            </div>
            <div className="mission-grid stagger-in">
              <FloatingBubble delay={0} intensity={0.5}>
                <MissionCard
                  text={activeCycleItems.build?.text ?? 'No build focus.'}
                  title="Build"
                  category="build"
                  index={0}
                />
              </FloatingBubble>
              <FloatingBubble delay={1} intensity={0.5}>
                <MissionCard
                  text={activeCycleItems.shape?.text ?? 'No shape focus.'}
                  title="Shape"
                  category="shape"
                  index={1}
                />
              </FloatingBubble>
              <FloatingBubble delay={2} intensity={0.5}>
                <MissionCard
                  text={activeCycleItems.workWith?.text ?? 'No work with focus.'}
                  title="Work With"
                  category="workWith"
                  index={2}
                />
              </FloatingBubble>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-section animate-slide-up">
            <ReflectionPrompts prompts={REFLECTION_PROMPTS} />
          </div>
        );

      case 3:
        return (
          <div className="step-section">
            <section className="panel stack-md animate-scale-in">
              <div className="step-greeting-scene step-greeting-scene-panel">
                <ObservatoryScene scene="reflection" />
              </div>
              <div className="section-header">
                <div>
                  <p className="eyebrow">Your Thoughts</p>
                  <h3>How did it go?</h3>
                </div>
                <p className="section-copy">
                  Write whatever feels true. There's no wrong way to do this.
                </p>
              </div>
              <textarea
                className="text-area"
                maxLength={5000}
                onChange={(e) => { setText(e.target.value); setError(''); }}
                placeholder="What happened this week? What moved, stalled, or surprised you?"
                rows={9}
                value={text}
                style={{ minHeight: '200px' }}
              />
              {error && <p className="field-error animate-shake">{error}</p>}
              {text.trim().length > 0 && (
                <p className="animate-fade-in" style={{
                  color: 'var(--accent)',
                  fontSize: '0.85rem',
                  textAlign: 'right'
                }}>
                  {text.trim().split(/\s+/).length} words
                </p>
              )}
            </section>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section className="screen">
      <StepWizard
        completeLabel="Close This Chapter"
        onComplete={handleSubmit}
        renderStep={renderStep}
        steps={steps}
      />
    </section>
  );
}
