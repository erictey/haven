import { useState } from 'react';
import { DataManagement } from '../components/DataManagement';
import { MissionCard } from '../components/MissionCard';
import { useAppContext } from '../context/AppContext';
import { downloadTextFile, makeExportFilename } from '../lib/storage';

export function HistoryScreen() {
  const { history, deleteHistoryRecord, exportData, clearAllData } = useAppContext();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleExport = () => {
    downloadTextFile(makeExportFilename(new Date()), exportData());
  };

  const handleDeleteRecord = (id: string) => {
    setDeletingId(id);
  };

  const confirmDeleteRecord = () => {
    if (deletingId) {
      deleteHistoryRecord(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <section className="screen stack-xl">
      <header className="panel hero-panel animate-slide-up">
        <p className="eyebrow">History</p>
        <h2>Archived cycles and reflections</h2>
        <p className="screen-copy">
          Past cycles stay readable even if you later edit or remove missions, because history
          stores text snapshots.
        </p>
      </header>

      <section className="stack-lg stagger-in">
        {history.length > 0 ? (
          history.map((entry, index) => (
            <article 
              className="panel history-card" 
              key={entry.id}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="section-header">
                <div>
                  <p className="eyebrow">Cycle</p>
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
                <MissionCard text={entry.buildText} title="Build" category="build" />
                <MissionCard text={entry.shapeText} title="Shape" category="shape" />
                <MissionCard text={entry.workWithText} title="Work With" category="workWith" />
              </div>
              <section className="reflection-note">
                <p className="eyebrow">Reflection</p>
                <p className="mission-text">{entry.reflection.text}</p>
                <p className="date-copy">
                  Submitted {new Date(entry.reflection.submittedAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              </section>
            </article>
          ))
        ) : (
          <div className="panel empty-state animate-fade-in">
            <p>No completed cycles yet. Reflections appear here after first week closes.</p>
          </div>
        )}
      </section>

      <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <DataManagement historyCount={history.length} onClear={clearAllData} onExport={handleExport} />
      </div>
    </section>
  );
}
