import { useAppContext } from '../context/AppContext';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '../lib/types';
import { MissionCard } from '../components/MissionCard';

export function CompletedCycleScreen() {
  const { pendingRecapCycle, acknowledgeCompletedCycle } = useAppContext();

  if (!pendingRecapCycle) {
    return null;
  }

  const missionTextByCategory = {
    build: pendingRecapCycle.buildText,
    shape: pendingRecapCycle.shapeText,
    workWith: pendingRecapCycle.workWithText,
  } as const;

  return (
    <section className="screen stack-xl">
      <header className="panel hero-panel animate-slide-up">
        <p className="eyebrow">Week Complete</p>
        <h2>Your Week in Review</h2>
        <p className="screen-copy">
          Pause for a beat before choosing the next week. Here&apos;s the cycle you just closed.
        </p>
      </header>

      <section className="panel stack-lg animate-slide-up" style={{ animationDelay: '0.08s' }}>
        <div className="section-header">
          <div>
            <p className="eyebrow">Closed Loop</p>
            <h3>
              {new Date(pendingRecapCycle.startDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}{' '}
              to{' '}
              {new Date(pendingRecapCycle.endDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </h3>
          </div>
          <p className="section-copy">{pendingRecapCycle.reflection.text}</p>
        </div>

        <div className="mission-grid stagger-in">
          {CATEGORY_ORDER.map((category, index) => (
            <MissionCard
              caption={pendingRecapCycle.intentions[category] || undefined}
              category={category}
              index={index}
              key={category}
              text={missionTextByCategory[category]}
              title={CATEGORY_LABELS[category]}
            />
          ))}
        </div>

        <div className="action-row">
          <button className="button" onClick={acknowledgeCompletedCycle} type="button">
            Start Planning the Next Week
          </button>
        </div>
      </section>
    </section>
  );
}
