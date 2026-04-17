import { useState } from 'react';
import { EvidenceColumn } from '../components/EvidenceColumn';
import { MissionCard } from '../components/MissionCard';
import { useAppContext } from '../context/AppContext';
import { CATEGORY_LABELS, type MissionCategory } from '../lib/types';

export function HistoryScreen() {
  const { history, deleteHistoryRecord } = useAppContext();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [visibleCategory, setVisibleCategory] = useState<'all' | MissionCategory>('all');

  const handleDeleteRecord = (id: string) => {
    setDeletingId(id);
  };

  const confirmDeleteRecord = () => {
    if (deletingId) {
      deleteHistoryRecord(deletingId);
      setDeletingId(null);
    }
  };

  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredHistory = history.filter((entry) => {
    if (!normalizedKeyword) {
      return true;
    }

    const searchableText = [
      entry.buildText,
      entry.shapeText,
      entry.workWithText,
      entry.reflection.text,
      ...entry.evidence.build.map((item) => item.text ?? ''),
      ...entry.evidence.shape.map((item) => item.text ?? ''),
      ...entry.evidence.workWith.map((item) => item.text ?? ''),
      new Date(entry.startDate).toLocaleDateString(),
      new Date(entry.endDate).toLocaleDateString(),
    ]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(normalizedKeyword);
  });

  return (
    <section className="screen stack-xl">
      <header className="panel hero-panel animate-slide-up">
        <p className="eyebrow">History</p>
        <h2>Your Journey So Far</h2>
        <p className="screen-copy">
          Every week you complete is saved here. Search by keyword or narrow the view to one category to revisit what changed over time.
        </p>
      </header>

      <section className="panel stack-md animate-slide-up history-toolbar" style={{ animationDelay: '0.04s' }}>
        <div className="section-header">
          <div>
            <p className="eyebrow">Browse Timeline</p>
            <h3>Filter your history</h3>
          </div>
          <p className="section-copy">
            Search reflections, focus titles, evidence notes, or dates. Use the category filter to collapse each week down to one lens.
          </p>
        </div>

        <div className="form-row history-filters">
          <input
            className="text-input"
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search by week, keyword, or reflection text"
            value={keyword}
          />
          <select
            className="text-input"
            onChange={(event) =>
              setVisibleCategory(event.target.value as 'all' | MissionCategory)
            }
            value={visibleCategory}
          >
            <option value="all">All categories</option>
            <option value="build">Build only</option>
            <option value="shape">Shape only</option>
            <option value="workWith">Work With only</option>
          </select>
        </div>
      </section>

      <section className="stack-lg stagger-in">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((entry, index) => {
            const missionCards =
              visibleCategory === 'all'
                ? [
                    <MissionCard key="build" text={entry.buildText} title="Build" category="build" />,
                    <MissionCard key="shape" text={entry.shapeText} title="Shape" category="shape" />,
                    <MissionCard
                      key="workWith"
                      text={entry.workWithText}
                      title="Work With"
                      category="workWith"
                    />,
                  ]
                : [
                    <MissionCard
                      category={visibleCategory}
                      key={visibleCategory}
                      text={
                        visibleCategory === 'build'
                          ? entry.buildText
                          : visibleCategory === 'shape'
                            ? entry.shapeText
                            : entry.workWithText
                      }
                      title={CATEGORY_LABELS[visibleCategory]}
                    />,
                  ];

            const evidenceColumns =
              visibleCategory === 'all'
                ? [
                    entry.evidence.build.length > 0 ? (
                      <EvidenceColumn
                        entries={entry.evidence.build}
                        key="evidence-build"
                        missionText={entry.buildText}
                        title="Build"
                      />
                    ) : null,
                    entry.evidence.shape.length > 0 ? (
                      <EvidenceColumn
                        entries={entry.evidence.shape}
                        key="evidence-shape"
                        missionText={entry.shapeText}
                        title="Shape"
                      />
                    ) : null,
                    entry.evidence.workWith.length > 0 ? (
                      <EvidenceColumn
                        entries={entry.evidence.workWith}
                        key="evidence-workWith"
                        missionText={entry.workWithText}
                        title="Work With"
                      />
                    ) : null,
                  ]
                : entry.evidence[visibleCategory].length > 0
                  ? [
                      <EvidenceColumn
                        entries={entry.evidence[visibleCategory]}
                        key={`evidence-${visibleCategory}`}
                        missionText={
                          visibleCategory === 'build'
                            ? entry.buildText
                            : visibleCategory === 'shape'
                              ? entry.shapeText
                              : entry.workWithText
                        }
                        title={CATEGORY_LABELS[visibleCategory]}
                      />,
                    ]
                  : [];

            return (
            <article
              className="panel history-card"
              key={entry.id}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="section-header">
                <div>
                  <p className="eyebrow">Week</p>
                  <h3>
                    {new Date(entry.startDate).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric'
                    })} to{' '}
                    {new Date(entry.endDate).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </h3>
                </div>
                {deletingId === entry.id ? (
                  <div className="inline-actions">
                    <button className="button danger small" onClick={confirmDeleteRecord} type="button">
                      Confirm
                    </button>
                    <button className="button ghost small" onClick={() => setDeletingId(null)} type="button">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="button ghost small danger-text"
                    onClick={() => handleDeleteRecord(entry.id)}
                    type="button"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="mission-grid">
                {missionCards}
              </div>

              {evidenceColumns.length > 0 ? (
                <div className="mission-grid" style={{ marginTop: '16px' }}>
                  {evidenceColumns}
                </div>
              ) : null}
              <section className="reflection-note">
                <p className="eyebrow">Reflection</p>
                <p className="mission-text">{entry.reflection.text}</p>
                <p className="date-copy">
                  Written {new Date(entry.reflection.submittedAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              </section>
            </article>
            );
          })
        ) : (
          <div className="panel empty-state animate-fade-in">
            <p>
              {history.length === 0
                ? 'No completed weeks yet. Once you finish your first week and reflect, it will show up here.'
                : 'No weeks match that filter yet. Try a broader category or clear the keyword.'}
            </p>
          </div>
        )}
      </section>
    </section>
  );
}
