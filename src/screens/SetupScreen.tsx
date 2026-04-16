import { CategoryList } from '../components/CategoryList';
import { CoreValuesDisplay } from '../components/CoreValuesDisplay';
import { ObservatoryScene } from '../components/ObservatoryScene';
import { StepWizard, type StepConfig } from '../components/StepWizard';
import { useAppContext } from '../context/AppContext';
import { PRESET_CORE_VALUES, PRESET_MISSIONS } from '../lib/presets';

type Props = {
  mode?: 'setup' | 'edit';
};

export function SetupScreen({ mode = 'setup' }: Props) {
  const {
    coreValues,
    missionItems,
    activeCycle,
    addCoreValue,
    updateCoreValue,
    deleteCoreValue,
    addMissionItem,
    updateMissionItem,
    toggleMissionItemActive,
    deleteMissionItem,
    completeSetup,
  } = useAppContext();

  const lockedItemIds = activeCycle
    ? [activeCycle.buildItemId, activeCycle.shapeItemId, activeCycle.workWithItemId]
    : [];

  const buildItems = missionItems.filter((i) => i.category === 'build');
  const shapeItems = missionItems.filter((i) => i.category === 'shape');
  const workWithItems = missionItems.filter((i) => i.category === 'workWith');

  const hasBuild = buildItems.some((i) => i.isActive);
  const hasShape = shapeItems.some((i) => i.isActive);
  const hasWorkWith = workWithItems.some((i) => i.isActive);

  const steps: StepConfig[] = [
    { key: 'greeting' },
    { key: 'values', canAdvance: coreValues.length > 0 },
    { key: 'build', canAdvance: hasBuild },
    { key: 'shape', canAdvance: hasShape },
    { key: 'workWith', canAdvance: hasWorkWith },
    { key: 'summary' },
  ];

  const renderStep = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="step-greeting">
            <div className="step-greeting-scene">
              <ObservatoryScene scene="workflow" />
            </div>
            <h2 className="greeting-title">
              {mode === 'setup' ? 'Welcome to Haven' : 'Edit Your Focus Areas'}
            </h2>
            <p className="greeting-sub">
              {mode === 'setup'
                ? "Let's set things up together. Start by thinking about what matters most to you."
                : 'Tweak your values and focuses anytime. Changes kick in next week.'}
            </p>
          </div>
        );

      case 1:
        return (
          <div className="step-section">
            <CoreValuesDisplay
              editable
              onAdd={addCoreValue}
              onDelete={deleteCoreValue}
              onEdit={updateCoreValue}
              presets={PRESET_CORE_VALUES}
              values={coreValues}
            />
            {coreValues.length === 0 && (
              <p className="step-hint">Add at least one value to continue.</p>
            )}
          </div>
        );

      case 2:
        return (
          <div className="step-section">
            <CategoryList
              category="build"
              description="What would you like to actively grow through practice and attention?"
              items={buildItems}
              lockedItemIds={lockedItemIds}
              onAdd={(text) => addMissionItem('build', text)}
              onDelete={deleteMissionItem}
              onEdit={updateMissionItem}
              onToggleActive={toggleMissionItemActive}
              presets={PRESET_MISSIONS.build}
              title="Build"
            />
            {!hasBuild && (
              <p className="step-hint">Add at least one active Build focus to continue.</p>
            )}
          </div>
        );

      case 3:
        return (
          <div className="step-section">
            <CategoryList
              category="shape"
              description="What part of your life would you like to gently improve over time?"
              items={shapeItems}
              lockedItemIds={lockedItemIds}
              onAdd={(text) => addMissionItem('shape', text)}
              onDelete={deleteMissionItem}
              onEdit={updateMissionItem}
              onToggleActive={toggleMissionItemActive}
              presets={PRESET_MISSIONS.shape}
              title="Shape"
            />
            {!hasShape && (
              <p className="step-hint">Add at least one active Shape focus to continue.</p>
            )}
          </div>
        );

      case 4:
        return (
          <div className="step-section">
            <CategoryList
              category="workWith"
              description="What's something difficult you'd like to meet with more steadiness and self-compassion?"
              items={workWithItems}
              lockedItemIds={lockedItemIds}
              onAdd={(text) => addMissionItem('workWith', text)}
              onDelete={deleteMissionItem}
              onEdit={updateMissionItem}
              onToggleActive={toggleMissionItemActive}
              presets={PRESET_MISSIONS.workWith}
              title="Work With"
            />
            {!hasWorkWith && (
              <p className="step-hint">Add at least one active Work With focus to continue.</p>
            )}
          </div>
        );

      case 5:
        return (
          <div className="step-greeting">
            <div className="step-greeting-scene">
              <ObservatoryScene scene="dashboard" />
            </div>
            <h2 className="greeting-title">
              {mode === 'setup' ? "You're all set!" : 'Looking good!'}
            </h2>
            <p className="greeting-sub">
              {coreValues.length} value{coreValues.length !== 1 ? 's' : ''} ·{' '}
              {buildItems.filter((i) => i.isActive).length} build ·{' '}
              {shapeItems.filter((i) => i.isActive).length} shape ·{' '}
              {workWithItems.filter((i) => i.isActive).length} work with
            </p>
            <p className="greeting-sub" style={{ opacity: 1, animation: 'none' }}>
              {mode === 'setup'
                ? "Whenever you're ready, pick your first weekly focus."
                : 'Head back to the dashboard to keep going.'}
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section className="screen">
        <StepWizard
        completeLabel={mode === 'setup' ? "I'm Ready" : 'Done'}
        onComplete={mode === 'setup' ? completeSetup : undefined}
        renderStep={renderStep}
        steps={steps}
      />
    </section>
  );
}
