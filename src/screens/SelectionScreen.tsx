import { useState } from 'react';
import { CategoryList } from '../components/CategoryList';
import { CoreValuesDisplay } from '../components/CoreValuesDisplay';
import { FloatingBubble } from '../components/FloatingBubble';
import { MissionCard } from '../components/MissionCard';
import { StepWizard, type StepConfig } from '../components/StepWizard';
import { useAppContext } from '../context/AppContext';
import { type CycleSelection, type SelectionErrors } from '../lib/types';

const initialSelection: CycleSelection = { build: null, shape: null, workWith: null };

export function SelectionScreen() {
  const { coreValues, missionItems, eligibleItems, startCycle } = useAppContext();
  const [selection, setSelection] = useState<CycleSelection>(initialSelection);
  const [errors, setErrors] = useState<SelectionErrors>({});

  const buildItems = missionItems.filter((i) => i.category === 'build' && i.isActive);
  const shapeItems = missionItems.filter((i) => i.category === 'shape' && i.isActive);
  const workWithItems = missionItems.filter((i) => i.category === 'workWith' && i.isActive);

  const selectedBuild = buildItems.find((i) => i.id === selection.build)?.text;
  const selectedShape = shapeItems.find((i) => i.id === selection.shape)?.text;
  const selectedWorkWith = workWithItems.find((i) => i.id === selection.workWith)?.text;

  const steps: StepConfig[] = [
    { key: 'greeting' },
    { key: 'values' },
    { key: 'build', canAdvance: !!selection.build },
    { key: 'shape', canAdvance: !!selection.shape },
    { key: 'workWith', canAdvance: !!selection.workWith },
    { key: 'summary', canAdvance: !!selection.build && !!selection.shape && !!selection.workWith },
  ];

  const handleConfirm = () => {
    const result = startCycle(selection);
    if (!result.ok) { setErrors(result.errors); return; }
    setErrors({});
    setSelection(initialSelection);
  };

  const renderStep = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="step-greeting">
            <h2 className="greeting-title text-reveal">New Week</h2>
            <p className="greeting-sub">
              Choose one mission from each category. Once locked, you carry these for seven days.
            </p>
          </div>
        );

      case 1:
        return (
          <div className="step-section">
            <CoreValuesDisplay values={coreValues} />
            <p className="step-hint-subtle animate-fade-in" style={{ animationDelay: '0.3s' }}>
              Keep these in mind as you choose. Values govern how you carry the mission.
            </p>
          </div>
        );

      case 2:
        return (
          <div className="step-section">
            <CategoryList
              description="Choose the skill, capacity, or area you want to actively build this week."
              eligibleIds={eligibleItems.build.map((i) => i.id)}
              error={errors.build}
              items={buildItems}
              mode="select"
              onSelect={(id) => setSelection((c) => ({ ...c, build: id }))}
              selectedId={selection.build}
              title="Build"
            />
            {selection.build && (
              <p className="animate-bounce-subtle" style={{ 
                color: 'var(--accent)', 
                fontWeight: 600, 
                textAlign: 'center',
                marginTop: '8px' 
              }}>
                Build mission selected
              </p>
            )}
          </div>
        );

      case 3:
        return (
          <div className="step-section">
            <CategoryList
              description="Choose the condition or pattern you want to shape through steady influence."
              eligibleIds={eligibleItems.shape.map((i) => i.id)}
              error={errors.shape}
              items={shapeItems}
              mode="select"
              onSelect={(id) => setSelection((c) => ({ ...c, shape: id }))}
              selectedId={selection.shape}
              title="Shape"
            />
            {selection.shape && (
              <p className="animate-bounce-subtle" style={{ 
                color: 'var(--accent)', 
                fontWeight: 600, 
                textAlign: 'center',
                marginTop: '8px' 
              }}>
                Shape mission selected
              </p>
            )}
          </div>
        );

      case 4:
        return (
          <div className="step-section">
            <CategoryList
              description="Choose the circumstance you want to respond to more deliberately this week."
              eligibleIds={eligibleItems.workWith.map((i) => i.id)}
              error={errors.workWith}
              items={workWithItems}
              mode="select"
              onSelect={(id) => setSelection((c) => ({ ...c, workWith: id }))}
              selectedId={selection.workWith}
              title="Work With"
            />
            {selection.workWith && (
              <p className="animate-bounce-subtle" style={{ 
                color: 'var(--accent)', 
                fontWeight: 600, 
                textAlign: 'center',
                marginTop: '8px' 
              }}>
                Work With mission selected
              </p>
            )}
          </div>
        );

      case 5:
        return (
          <div className="step-section stack-lg">
            <div className="step-greeting" style={{ padding: '16px 0' }}>
              <h2 className="greeting-title" style={{ fontSize: '2rem' }}>Your Week</h2>
              <p className="greeting-sub">Review your selections. This locks for seven days.</p>
            </div>
            <div className="mission-grid stagger-in">
              <FloatingBubble delay={0} intensity={0.6}>
                <MissionCard 
                  text={selectedBuild ?? 'Not selected'} 
                  title="Build" 
                  category="build"
                  index={0}
                />
              </FloatingBubble>
              <FloatingBubble delay={1} intensity={0.6}>
                <MissionCard 
                  text={selectedShape ?? 'Not selected'} 
                  title="Shape" 
                  category="shape"
                  index={1}
                />
              </FloatingBubble>
              <FloatingBubble delay={2} intensity={0.6}>
                <MissionCard 
                  text={selectedWorkWith ?? 'Not selected'} 
                  title="Work With" 
                  category="workWith"
                  index={2}
                />
              </FloatingBubble>
            </div>
            {errors.form && <p className="field-error animate-shake">{errors.form}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section className="screen">
      <StepWizard
        completeLabel="Lock In Weekly Mission"
        onComplete={handleConfirm}
        renderStep={renderStep}
        steps={steps}
      />
    </section>
  );
}
