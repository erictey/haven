import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CategoryEmblem } from '../components/CategoryEmblem';
import { CountdownTimer } from '../components/CountdownTimer';
import { EvidenceColumn } from '../components/EvidenceColumn';
import { FloatingBubble } from '../components/FloatingBubble';
import { MotivationalMessage } from '../components/MotivationalMessage';
import { useAppContext } from '../context/AppContext';
import { useDialogFocusTrap } from '../hooks/useDialogFocusTrap';
import { CATEGORY_DETAILS } from '../lib/categoryModel';
import { CATEGORY_VISUALS } from '../lib/visuals';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  createEmptyCycleEvidence,
  type MissionCategory,
} from '../lib/types';

type DashboardModalState =
  | { type: 'info'; category: MissionCategory }
  | { type: 'journal' }
  | null;

function formatDate(dateIso?: string) {
  return dateIso
    ? new Date(dateIso).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown';
}

function formatDateRange(startIso?: string, endIso?: string) {
  if (!startIso || !endIso) return 'This Week';
  return `${formatDate(startIso)} → ${formatDate(endIso)}`;
}

export function DashboardScreen() {
  const { activeCycle, activeCycleItems, coreValues, cycleMessage, addEvidence, deleteEvidence } =
    useAppContext();
  const [showGreeting, setShowGreeting] = useState(true);
  const [greetingPhase, setGreetingPhase] = useState<'enter' | 'hold' | 'exit'>('enter');
  const [modalState, setModalState] = useState<DashboardModalState>(null);
  const [journalCategory, setJournalCategory] = useState<MissionCategory>('build');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showGreeting) {
      const holdTimer = setTimeout(() => setGreetingPhase('hold'), 800);
      const exitTimer = setTimeout(() => setGreetingPhase('exit'), 1800);
      const switchTimer = setTimeout(() => setShowGreeting(false), 2300);

      return () => {
        clearTimeout(holdTimer);
        clearTimeout(exitTimer);
        clearTimeout(switchTimer);
      };
    }
  }, [showGreeting]);

  useDialogFocusTrap(modalRef, Boolean(modalState), () => setModalState(null));

  if (showGreeting) {
    return (
      <section className="screen">
        <div
          className={`step-greeting dash-greeting ${greetingPhase === 'exit' ? 'screen-exit' : ''}`}
        >
          <h2 className="greeting-title greeting-fade-in">Welcome back</h2>
          <p className="greeting-sub">Your week is in progress.</p>
        </div>
      </section>
    );
  }

  const missionSummary = CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    text: activeCycleItems[category]?.text ?? `No ${CATEGORY_LABELS[category].toLowerCase()} focus set.`,
    intention:
      activeCycle?.intentions[category]?.trim() || 'No intention saved yet for this focus.',
  }));

  const evidence = activeCycle?.evidence ?? createEmptyCycleEvidence();
  const totalEvidence = CATEGORY_ORDER.reduce(
    (total, category) => total + evidence[category].length,
    0,
  );
  const activeInfo =
    modalState?.type === 'info' ? CATEGORY_DETAILS[modalState.category] : null;
  const selectedInfoMission =
    modalState?.type === 'info'
      ? missionSummary.find((mission) => mission.category === modalState.category) ?? null
      : null;
  const journalMissionText =
    activeCycleItems[journalCategory]?.text ??
    `No ${CATEGORY_LABELS[journalCategory].toLowerCase()} focus set.`;
  const journalIntention = activeCycle?.intentions[journalCategory]?.trim() ?? '';
  const journalMissionSummary = journalIntention
    ? `${journalMissionText} — ${journalIntention}`
    : journalMissionText;
  const modalTitleId =
    modalState?.type === 'info' ? `${modalState.category}-meaning-title` : 'journal-modal-title';
  const modalContent = modalState ? (
    <div
      className="dashboard-modal-backdrop animate-fade-in"
      onClick={() => setModalState(null)}
      role="presentation"
    >
      <div
        aria-labelledby={modalTitleId}
        aria-modal="true"
        className="panel dashboard-modal-card animate-scale-in"
        onClick={(event) => event.stopPropagation()}
        ref={modalRef}
        role="dialog"
      >
        {activeInfo && selectedInfoMission ? (
          <>
            <div className="dashboard-modal-header">
              <div className="stack-md">
                <p className="eyebrow">{activeInfo.title}</p>
                <h3 id={modalTitleId}>{activeInfo.definition}</h3>
                <p className="section-copy">
                  {activeInfo.meaning}
                </p>
              </div>
              <button
                className="button ghost small dashboard-modal-close"
                onClick={() => setModalState(null)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="dashboard-modal-content">
              <section className="dashboard-modal-panel stack-md dashboard-focus-panel">
                <p className="eyebrow">This week</p>
                <p className="mission-text">{selectedInfoMission.text}</p>
                <p className="section-copy">{selectedInfoMission.intention}</p>
              </section>

              <div className="dashboard-modal-grid">
                <section className="dashboard-modal-panel stack-md">
                  <p className="eyebrow">What belongs here</p>
                  <ul className="dashboard-modal-list">
                    {activeInfo.examples.map((example) => (
                      <li key={example}>{example}</li>
                    ))}
                  </ul>
                </section>

                <section className="dashboard-modal-panel stack-md">
                  <p className="eyebrow">Helpful question</p>
                  <p className="mission-text">{activeInfo.guidingQuestion}</p>
                </section>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="dashboard-modal-header">
              <div className="stack-md">
                <p className="eyebrow">Journal</p>
                <h3 id={modalTitleId}>Your Journal</h3>
                <p className="section-copy">
                  Capture the moments you want to remember as your week unfolds.
                </p>
              </div>
              <button
                className="button ghost small dashboard-modal-close"
                onClick={() => setModalState(null)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="journal-tab-row">
              {CATEGORY_ORDER.map((category) => (
                <button
                  className={`journal-tab ${journalCategory === category ? 'is-active' : ''}`}
                  key={category}
                  onClick={() => setJournalCategory(category)}
                  type="button"
                >
                  <span>{CATEGORY_LABELS[category]}</span>
                  <span className="journal-tab-count">{evidence[category].length}</span>
                </button>
              ))}
            </div>

            <div className="journal-modal-body">
              <EvidenceColumn
                entries={evidence[journalCategory]}
                missionText={journalMissionSummary}
                onAdd={(payload) => addEvidence(journalCategory, payload)}
                onDelete={(evidenceId) => deleteEvidence(journalCategory, evidenceId)}
                title={CATEGORY_LABELS[journalCategory]}
              />
            </div>
          </>
        )}
      </div>
    </div>
  ) : null;

  return (
    <section className="screen">
      <div className="dashboard-layout">
        <header className="panel week-hero animate-slide-up" style={{ animationDelay: '0s' }}>
          <div className="week-hero-row">
            <span className="badge state-pill state-active_week">This Week</span>
          </div>
          <h2 className="week-hero-title">
            {formatDateRange(activeCycle?.startDate, activeCycle?.endDate)}
          </h2>
          <p className="week-hero-sub">
            Tracking direct effort, gentle influence, and wise response.
          </p>
          {coreValues.length > 0 ? (
            <div className="week-hero-values">
              <p className="eyebrow">Your Values</p>
              <div className="badge-row">
                {coreValues.map((value) => (
                  <span className="badge available" key={value.id}>
                    {value.text}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </header>

        <section className="dashboard-main animate-slide-up" style={{ animationDelay: '0.06s' }}>
          <div className="dashboard-missions-area">
            <div className="panel stack-md dashboard-primary-panel">
              <div className="section-header">
                <div>
                  <p className="eyebrow">This Week</p>
                  <h2>What You're Working On</h2>
                </div>
              </div>
              <div className="primary-mission-grid">
                {missionSummary.map((mission) => (
                  <div className="primary-mission-item" key={mission.category}>
                    <p className="primary-mission-label">{mission.label}</p>
                    <div className="primary-mission-body">
                      <p className="primary-mission-text">{mission.text}</p>
                      <p className="primary-mission-motto">{mission.intention}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-bubble-grid stagger-in">
              {missionSummary.map((mission, index) => {
                const detail = CATEGORY_DETAILS[mission.category];

                return (
                  <FloatingBubble delay={index} intensity={1} key={mission.category}>
                    <button
                      className={`panel dashboard-bubble-card dashboard-bubble-card-${mission.category}`}
                      onClick={() =>
                        setModalState({ type: 'info', category: mission.category })
                      }
                      type="button"
                    >
                      <p className="eyebrow">{mission.label}</p>
                      <CategoryEmblem category={mission.category} decorative size="sm" />
                      <h3>{detail.cardTitle}</h3>
                      <p className="section-copy">{detail.cardSummary}</p>
                      <p className="dashboard-bubble-note">{CATEGORY_VISUALS[mission.category].descriptor}</p>
                      <span className="dashboard-bubble-link">Open meaning</span>
                    </button>
                  </FloatingBubble>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="dashboard-sidebar animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <FloatingBubble delay={0} intensity={1.1}>
            <button
              className="panel dashboard-bubble-card dashboard-journal-bubble"
              onClick={() => setModalState({ type: 'journal' })}
              type="button"
            >
              <p className="eyebrow">Journal</p>
              <h3>Your Journal</h3>
              <p className="section-copy">
                A place to capture moments, notes, and evidence from your week.
              </p>
              <div className="dashboard-bubble-meta">
                {CATEGORY_ORDER.map((category) => (
                  <span className="dashboard-bubble-chip" key={category}>
                    {CATEGORY_LABELS[category]} {evidence[category].length}
                  </span>
                ))}
              </div>
              <span className="dashboard-bubble-link">
                {totalEvidence > 0 ? `Open ${totalEvidence} saved moments` : 'Open journal'}
              </span>
            </button>
          </FloatingBubble>

          <div className="dashboard-widgets">
            <CountdownTimer endDate={activeCycle?.endDate} />
            <MotivationalMessage message={cycleMessage} />
          </div>
        </aside>
      </div>
      {modalContent && typeof document !== 'undefined'
        ? createPortal(modalContent, document.body)
        : null}
    </section>
  );
}
