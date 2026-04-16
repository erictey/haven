import { useState } from 'react';
import { CategoryList } from '../components/CategoryList';
import { CoreValuesDisplay } from '../components/CoreValuesDisplay';
import { FloatingBubble } from '../components/FloatingBubble';
import { MissionCard } from '../components/MissionCard';
import { ObservatoryScene } from '../components/ObservatoryScene';
import { StepWizard, type StepConfig } from '../components/StepWizard';
import { useAppContext } from '../context/AppContext';
import {
  createEmptyIntentions,
  type CycleIntentions,
  type CycleSelection,
  type MissionCategory,
  type SelectionErrors,
} from '../lib/types';

const initialSelection: CycleSelection = { build: null, shape: null, workWith: null };

export function SelectionScreen() {
  const { coreValues, missionItems, eligibleItems, startCycle } = useAppContext();
  const [selection, setSelection] = useState<CycleSelection>(initialSelection);
  const [errors, setErrors] = useState<SelectionErrors>({});
  const [intentions, setIntentions] = useState<CycleIntentions>(createEmptyIntentions);

  const buildItems = missionItems.filter((i) => i.category === 'build' && i.isActive);
  const shapeItems = missionItems.filter((i) => i.category === 'shape' && i.isActive);
  const workWithItems = missionItems.filter((i) => i.category === 'workWith' && i.isActive);

  const selectedBuild = buildItems.find((i) => i.id === selection.build)?.text;
  const selectedShape = shapeItems.find((i) => i.id === selection.shape)?.text;
  const selectedWorkWith = workWithItems.find((i) => i.id === selection.workWith)?.text;

  const chooseForMe = (category: keyof CycleSelection) => {
    const options = eligibleItems[category];
    if (options.length === 0) return;

    const chosen = options[Math.floor(Math.random() * options.length)];
    if (!chosen) return;

    setSelection((current) => ({ ...current, [category]: chosen.id }));
    setErrors((current) => ({ ...current, [category]: undefined, form: undefined }));
  };

  const steps: StepConfig[] = [
    { key: 'greeting' },
    { key: 'values' },
    { key: 'build', canAdvance: !!selection.build },
    { key: 'shape', canAdvance: !!selection.shape },
    { key: 'workWith', canAdvance: !!selection.workWith },
    { key: 'intentions', canAdvance: !!selection.build && !!selection.shape && !!selection.workWith },
    { key: 'summary', canAdvance: !!selection.build && !!selection.shape && !!selection.workWith },
  ];

  const handleConfirm = () => {
    const result = startCycle(selection, intentions);
    if (!result.ok) { setErrors(result.errors); return; }
    setErrors({});
    setSelection(initialSelection);
    setIntentions(createEmptyIntentions());
  };

  const updateIntention = (category: MissionCategory, value: string) => {
    setIntentions((prev) => ({ ...prev, [category]: value }));
  };

  const renderStep = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="step-greeting">
            <div className="step-greeting-scene">
              <ObservatoryScene scene="workflow" />
            </div>
            <h2 className="greeting-title text-reveal">Fresh Start</h2>
            <p className="greeting-sub">
              Pick one focus from each area for this week. No pressure — just intentions you'd like to hold.
            </p>
          </div>
        );

      case 1:
        return (
          <div className="step-section">
            <CoreValuesDisplay values={coreValues} variant="strip" />
            <p className="step-hint-subtle animate-fade-in" style={{ animationDelay: '0.3s' }}>
              Let your values guide you — they're your compass.
            </p>
          </div>
        );

      case 2:
        return (
          <div className="step-section">
            <CategoryList
              category="build"
              description="What skill, habit, or capacity would you like to actively grow this week?"
              eligibleIds={eligibleItems.build.map((i) => i.id)}
              error={errors.build}
              items={buildItems}
              mode="select"
              onSelect={(id) => setSelection((c) => ({ ...c, build: id }))}
              selectedId={selection.build}
              title="Build"
            />
            <div className="action-row">
              <button
                className="button secondary small"
                disabled={eligibleItems.build.length === 0}
                onClick={() => chooseForMe('build')}
                type="button"
              >
                Surprise me
              </button>
            </div>
            {selection.build && (
              <p className="animate-bounce-subtle" style={{
                color: 'var(--accent)',
                fontWeight: 600,
                textAlign: 'center',
                marginTop: '8px'
              }}>
                Nice pick!
              </p>
            )}
          </div>
        );

      case 3:
        return (
          <div className="step-section">
            <CategoryList
              category="shape"
              description="What part of your life or environment would you like to gently improve over time?"
              eligibleIds={eligibleItems.shape.map((i) => i.id)}
              error={errors.shape}
              items={shapeItems}
              mode="select"
              onSelect={(id) => setSelection((c) => ({ ...c, shape: id }))}
              selectedId={selection.shape}
              title="Shape"
            />
            <div className="action-row">
              <button
                className="button secondary small"
                disabled={eligibleItems.shape.length === 0}
                onClick={() => chooseForMe('shape')}
                type="button"
              >
                Surprise me
              </button>
            </div>
            {selection.shape && (
              <p className="animate-bounce-subtle" style={{
                color: 'var(--accent)',
                fontWeight: 600,
                textAlign: 'center',
                marginTop: '8px'
              }}>
                Nice pick!
              </p>
            )}
          </div>
        );

      case 4:
        return (
          <div className="step-section">
            <CategoryList
              category="workWith"
              description="What's something tough or uncomfortable that you'd like to sit with more gracefully this week?"
              eligibleIds={eligibleItems.workWith.map((i) => i.id)}
              error={errors.workWith}
              items={workWithItems}
              mode="select"
              onSelect={(id) => setSelection((c) => ({ ...c, workWith: id }))}
              selectedId={selection.workWith}
              title="Work With"
            />
            <div className="action-row">
              <button
                className="button secondary small"
                disabled={eligibleItems.workWith.length === 0}
                onClick={() => chooseForMe('workWith')}
                type="button"
              >
                Surprise me
              </button>
            </div>
            {selection.workWith && (
              <p className="animate-bounce-subtle" style={{
                color: 'var(--accent)',
                fontWeight: 600,
                textAlign: 'center',
                marginTop: '8px'
              }}>
                Nice pick!
              </p>
            )}
          </div>
        );

      case 5:
        return (
          <div className="step-section stack-lg">
            <div className="step-greeting" style={{ padding: '16px 0' }}>
              <h2 className="greeting-title" style={{ fontSize: '2rem' }}>What Does This Look Like for You?</h2>
              <p className="greeting-sub" style={{ opacity: 1, animation: 'none' }}>
                Think about your actual week ahead. For each focus, jot down what it might look like in your day-to-day life.
              </p>
            </div>
            <div className="intentions-grid stagger-in">
              <div className="panel stack-md intentions-card">
                <div className="section-header" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                  <div>
                    <p className="eyebrow">Build</p>
                    <h3>{selectedBuild ?? 'Not selected'}</h3>
                  </div>
                </div>
                <input
                  className="text-input"
                  maxLength={200}
                  onChange={(e) => updateIntention('build', e.target.value)}
                  placeholder="e.g. 20 minutes of focused practice after lunch"
                  value={intentions.build}
                />
              </div>
              <div className="panel stack-md intentions-card">
                <div className="section-header" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                  <div>
                    <p className="eyebrow">Shape</p>
                    <h3>{selectedShape ?? 'Not selected'}</h3>
                  </div>
                </div>
                <input
                  className="text-input"
                  maxLength={200}
                  onChange={(e) => updateIntention('shape', e.target.value)}
                  placeholder="e.g. Tidy my desk before starting each morning"
                  value={intentions.shape}
                />
              </div>
              <div className="panel stack-md intentions-card">
                <div className="section-header" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                  <div>
                    <p className="eyebrow">Work With</p>
                    <h3>{selectedWorkWith ?? 'Not selected'}</h3>
                  </div>
                </div>
                <input
                  className="text-input"
                  maxLength={200}
                  onChange={(e) => updateIntention('workWith', e.target.value)}
                  placeholder="e.g. Notice it when it comes up, take three breaths"
                  value={intentions.workWith}
                />
              </div>
            </div>
            <p className="step-hint-subtle">
              These are just for you — no wrong answers. Skip any you're not sure about yet.
            </p>
          </div>
        );

      case 6:
        return (
          <div className="step-section stack-lg">
            <div className="step-greeting" style={{ padding: '16px 0' }}>
              <div className="step-greeting-scene">
                <ObservatoryScene scene="dashboard" />
              </div>
              <h2 className="greeting-title" style={{ fontSize: '2rem' }}>Your Intentions</h2>
              <p className="greeting-sub" style={{ opacity: 1, animation: 'none' }}>Here's what you're leaning into this week. Feel good about these?</p>
            </div>
            <div className="mission-grid stagger-in">
              <FloatingBubble delay={0} intensity={0.6}>
                <MissionCard
                  text={selectedBuild ?? 'Not selected'}
                  title="Build"
                  caption={intentions.build || undefined}
                  category="build"
                  index={0}
                />
              </FloatingBubble>
              <FloatingBubble delay={1} intensity={0.6}>
                <MissionCard
                  text={selectedShape ?? 'Not selected'}
                  title="Shape"
                  caption={intentions.shape || undefined}
                  category="shape"
                  index={1}
                />
              </FloatingBubble>
              <FloatingBubble delay={2} intensity={0.6}>
                <MissionCard
                  text={selectedWorkWith ?? 'Not selected'}
                  title="Work With"
                  caption={intentions.workWith || undefined}
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
        completeLabel="Let's do this!"
        onComplete={handleConfirm}
        renderStep={renderStep}
        steps={steps}
      />
    </section>
  );
}
