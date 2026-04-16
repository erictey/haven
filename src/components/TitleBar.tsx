import { useEffect, useState } from 'react';
import { isElectron, windowClose, windowIsMaximized, windowMinimize, windowMaximize } from '../lib/electron';

export function TitleBar() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!isElectron) return;
    windowIsMaximized().then(setMaximized);

    const interval = setInterval(() => {
      windowIsMaximized().then(setMaximized);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (!isElectron) return null;

  return (
      <div className="title-bar">
      <div className="title-bar-drag">
        <span className="title-bar-label">Haven</span>
      </div>
      <div className="title-bar-controls">
        <button
          className="title-bar-btn"
          onClick={windowMinimize}
          title="Minimize"
          type="button"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="1" y="5.5" width="10" height="1" fill="currentColor" />
          </svg>
        </button>
        <button
          className="title-bar-btn"
          onClick={() => { windowMaximize(); setTimeout(() => windowIsMaximized().then(setMaximized), 100); }}
          title={maximized ? 'Restore' : 'Expand'}
          type="button"
        >
          {maximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="2.5" y="0.5" width="8.5" height="8.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1" />
              <rect x="0.5" y="2.5" width="8.5" height="8.5" rx="1" fill="var(--bg-deep)" stroke="currentColor" strokeWidth="1" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="1" y="1" width="10" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          )}
        </button>
        <button
          className="title-bar-btn title-bar-close"
          onClick={windowClose}
          title="Close"
          type="button"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
