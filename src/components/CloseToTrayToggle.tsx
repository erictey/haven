import { useEffect, useState } from 'react';
import { getCloseToTray, hasCloseToTrayApi, setCloseToTray } from '../lib/electron';

export function CloseToTrayToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supportedNow = hasCloseToTrayApi();
    setSupported(supportedNow);

    if (!supportedNow) {
      setLoading(false);
      return;
    }

    getCloseToTray()
      .then((value) => {
        setEnabled(value);
      })
      .catch(() => {
        setError('Close behavior is unavailable right now.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const toggle = async () => {
    if (!supported || loading) {
      return;
    }

    const next = !enabled;
    setLoading(true);
    setError(null);

    try {
      const result = await setCloseToTray(next);
      setEnabled(result);
    } catch {
      setError('Could not update close behavior.');
    } finally {
      setLoading(false);
    }
  };

  const label = !supported
    ? 'Close-to-tray is unavailable in this build.'
    : error
      ? error
      : loading
        ? 'Checking close behavior...'
        : enabled
          ? 'Clicking X sends Haven to the tray.'
          : 'Clicking X fully closes Haven.';

  return (
    <div className="autostart-toggle">
      <button
        className={`toggle-track ${enabled ? 'toggle-on' : ''}`}
        aria-checked={enabled}
        aria-label="Toggle close to tray"
        disabled={loading || !supported}
        onClick={toggle}
        role="switch"
        type="button"
      >
        <span className="toggle-thumb" />
      </button>
      <span className="toggle-label">{label}</span>
    </div>
  );
}
