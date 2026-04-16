import { startTransition, useEffect, useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { AutostartToggle } from './components/AutostartToggle';
import { ScreenTransition } from './components/ScreenTransition';
import { TitleBar } from './components/TitleBar';
import type { AppState } from './lib/types';
import { DashboardScreen } from './screens/DashboardScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { ReflectionScreen } from './screens/ReflectionScreen';
import { SelectionScreen } from './screens/SelectionScreen';
import { SetupScreen } from './screens/SetupScreen';

type AppView = 'workflow' | 'history' | 'edit' | 'settings';

function getStateLabel(state: AppState) {
  return state.split('_').join(' ');
}

function WorkflowScreen() {
  const { state } = useAppContext();

  const screens: Record<AppState, JSX.Element> = {
    setup: <SetupScreen mode="setup" />,
    ready_to_select: <SelectionScreen />,
    active_week: <DashboardScreen />,
    awaiting_reflection: <ReflectionScreen />,
    completed_cycle: <SelectionScreen />,
  };

  return screens[state];
}

function SettingsScreen() {
  const { history, clearAllData, exportData } = useAppContext();
  const [resetStep, setResetStep] = useState<'idle' | 'confirm' | 'typing'>('idle');
  const [resetInput, setResetInput] = useState('');

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `indiva-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (resetInput === 'RESET') {
      clearAllData();
      setResetStep('idle');
      setResetInput('');
    }
  };

  return (
    <section className="screen stack-xl">
      <header className="panel hero-panel animate-slide-up">
        <p className="eyebrow">Settings</p>
        <h2>Application Preferences</h2>
      </header>

      <section className="panel stack-md animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="section-header">
          <div>
            <p className="eyebrow">Startup</p>
            <h3>Windows Autostart</h3>
          </div>
          <p className="section-copy">
            Launch Indiva automatically when Windows starts.
          </p>
        </div>
        <AutostartToggle />
      </section>

      <section className="panel stack-md animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="section-header">
          <div>
            <p className="eyebrow">Data</p>
            <h3>Export &amp; Backup</h3>
          </div>
          <p className="section-copy">
            Download all data as JSON. {history.length} archived cycle{history.length === 1 ? '' : 's'} stored.
          </p>
        </div>
        <div className="action-row">
          <button className="button secondary" onClick={handleExport} type="button">
            Export All Data
          </button>
        </div>
      </section>

      <section className="panel stack-md reset-panel animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="section-header">
          <div>
            <p className="eyebrow danger-text">Danger Zone</p>
            <h3>Reset Everything</h3>
          </div>
          <p className="section-copy">
            Wipe all data: core values, missions, active cycle, history, reflections. Cannot be undone.
          </p>
        </div>

        {resetStep === 'idle' && (
          <div className="action-row">
            <button className="button danger" onClick={() => setResetStep('confirm')} type="button">
              Reset All Data
            </button>
          </div>
        )}

        {resetStep === 'confirm' && (
          <div className="stack-md animate-scale-in">
            <p className="field-error">Are you sure? This deletes everything permanently.</p>
            <div className="action-row">
              <button className="button danger" onClick={() => setResetStep('typing')} type="button">
                Yes, I want to reset
              </button>
              <button className="button secondary" onClick={() => setResetStep('idle')} type="button">
                Cancel
              </button>
            </div>
          </div>
        )}

        {resetStep === 'typing' && (
          <div className="stack-md animate-scale-in">
            <p className="field-error animate-shake">Type RESET to confirm.</p>
            <div className="form-row">
              <input
                className="text-input"
                onChange={(e) => setResetInput(e.target.value)}
                placeholder="Type RESET"
                value={resetInput}
              />
              <button
                className="button danger"
                disabled={resetInput !== 'RESET'}
                onClick={handleReset}
                type="button"
              >
                Confirm Reset
              </button>
              <button className="button secondary" onClick={() => { setResetStep('idle'); setResetInput(''); }} type="button">
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </section>
  );
}

function NavButton({ 
  active, 
  onClick, 
  disabled, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  disabled?: boolean; 
  children: React.ReactNode;
}) {
  return (
    <button
      className={`button ${active ? '' : 'secondary'}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
      style={{
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {children}
      {active && (
        <span 
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60%',
            height: '3px',
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '3px 3px 0 0',
          }}
          className="animate-scale-in"
        />
      )}
    </button>
  );
}

function AppShell() {
  const { canEditModel, state } = useAppContext();
  const [view, setView] = useState<AppView>('workflow');
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    // Animate header in on mount
    const timer = setTimeout(() => setHeaderVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (view === 'edit' && !canEditModel) {
      setView('workflow');
    }
  }, [canEditModel, view]);

  const changeView = (nextView: AppView) => {
    startTransition(() => setView(nextView));
  };

  const activeView = view === 'edit' && !canEditModel ? 'workflow' : view;

  const getScreenKey = () => {
    if (activeView === 'workflow') return `workflow-${state}`;
    return activeView;
  };

  return (
    <div className="app-shell">
      <TitleBar />
      <header 
        className={`app-header panel ${headerVisible ? 'animate-slide-up' : ''}`}
        style={{ opacity: headerVisible ? 1 : 0 }}
      >
        <div className="brand-block">
          <h1 className="app-logo">Indiva</h1>
          <p className="screen-copy">
            Values-driven weekly mission system
          </p>
        </div>
        <div className="header-controls">
          <span className={`badge state-pill state-${state}`}>{getStateLabel(state)}</span>
          <nav className="action-row">
            <NavButton
              active={activeView === 'workflow'}
              onClick={() => changeView('workflow')}
            >
              Workflow
            </NavButton>
            <NavButton
              active={activeView === 'history'}
              onClick={() => changeView('history')}
            >
              History
            </NavButton>
            <NavButton
              active={activeView === 'edit'}
              disabled={!canEditModel}
              onClick={() => changeView('edit')}
            >
              Edit Model
            </NavButton>
            <NavButton
              active={activeView === 'settings'}
              onClick={() => changeView('settings')}
            >
              Settings
            </NavButton>
          </nav>
        </div>
      </header>

      <ScreenTransition transitionKey={getScreenKey()}>
        {activeView === 'history' ? <HistoryScreen /> : null}
        {activeView === 'edit' ? <SetupScreen mode="edit" /> : null}
        {activeView === 'settings' ? <SettingsScreen /> : null}
        {activeView === 'workflow' ? <WorkflowScreen /> : null}
      </ScreenTransition>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
