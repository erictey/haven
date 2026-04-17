import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useDialogFocusTrap } from '../hooks/useDialogFocusTrap';
import { CATEGORY_LABELS, CATEGORY_ORDER, type MissionCategory } from '../lib/types';
import { EvidenceColumn } from './EvidenceColumn';

type Props = {
  category?: MissionCategory;
  open: boolean;
  onClose: () => void;
};

export function QuickJournalModal({ category = 'build', open, onClose }: Props) {
  const { activeCycle, activeCycleItems, addEvidence } = useAppContext();
  const [activeCategory, setActiveCategory] = useState<MissionCategory>(category);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setActiveCategory(category);
    }
  }, [category, open]);

  useDialogFocusTrap(dialogRef, open, onClose);

  if (!open || typeof document === 'undefined' || !activeCycle) {
    return null;
  }

  const missionText =
    activeCycleItems[activeCategory]?.text ??
    `No ${CATEGORY_LABELS[activeCategory].toLowerCase()} focus set.`;
  const intention = activeCycle.intentions[activeCategory]?.trim();
  const missionSummary = intention ? `${missionText} - ${intention}` : missionText;

  return createPortal(
    <div className="dashboard-modal-backdrop animate-fade-in" onClick={onClose} role="presentation">
      <div
        aria-labelledby="quick-journal-title"
        aria-modal="true"
        className="panel dashboard-modal-card animate-scale-in"
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
      >
        <div className="dashboard-modal-header">
          <div className="stack-md">
            <p className="eyebrow">Quick Journal</p>
            <h3 id="quick-journal-title">Capture a moment from this week</h3>
            <p className="section-copy">
              Add a note or photo without leaving your current screen.
            </p>
          </div>
          <button
            className="button ghost small dashboard-modal-close"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="journal-tab-row">
          {CATEGORY_ORDER.map((entryCategory) => (
            <button
              className={`journal-tab ${activeCategory === entryCategory ? 'is-active' : ''}`}
              key={entryCategory}
              onClick={() => setActiveCategory(entryCategory)}
              type="button"
            >
              <span>{CATEGORY_LABELS[entryCategory]}</span>
            </button>
          ))}
        </div>

        <div className="journal-modal-body">
          <EvidenceColumn
            entries={activeCycle.evidence[activeCategory]}
            missionText={missionSummary}
            onAdd={(payload) => addEvidence(activeCategory, payload)}
            title={CATEGORY_LABELS[activeCategory]}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
