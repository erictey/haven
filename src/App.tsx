import { startTransition, useEffect, useState } from 'react';
import { AmbientBubbles } from './components/AmbientBubbles';
import { AppProvider, useAppContext } from './context/AppContext';
import { AutostartToggle } from './components/AutostartToggle';
import { CloseToTrayToggle } from './components/CloseToTrayToggle';
import { ScreenTransition } from './components/ScreenTransition';
import { TitleBar } from './components/TitleBar';
import { appQuit, hasElectronApi } from './lib/electron';
import type { AppState } from './lib/types';
import { AboutScreen } from './screens/AboutScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { ReflectionScreen } from './screens/ReflectionScreen';
import { SelectionScreen } from './screens/SelectionScreen';
import { SetupScreen } from './screens/SetupScreen';

type AppView = 'workflow' | 'history' | 'edit' | 'about' | 'settings';

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
    a.download = `haven-export-${new Date().toISOString().slice(0, 10)}.json`;
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
        <h2>Your Preferences</h2>
      </header>

      <section className="panel stack-md animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="section-header">
          <div>
            <p className="eyebrow">Window</p>
            <h3>Close Button Behavior</h3>
          </div>
          <p className="section-copy">
            Choose whether clicking X hides Haven to the tray or exits the app completely.
          </p>
        </div>
        <CloseToTrayToggle />
      </section>

      <section className="panel stack-md animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <div className="section-header">
          <div>
            <p className="eyebrow">Startup</p>
            <h3>Windows Autostart</h3>
          </div>
          <p className="section-copy">
            Open Haven automatically when you start your computer.
          </p>
        </div>
        <AutostartToggle />
      </section>

      <section className="panel stack-md animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="section-header">
          <div>
            <p className="eyebrow">Application</p>
            <h3>Quit Application</h3>
          </div>
          <p className="section-copy">
            Exit Haven completely instead of sending it to the tray.
          </p>
        </div>
        <div className="action-row">
          <button
            className="button secondary"
            disabled={!hasElectronApi()}
            onClick={appQuit}
            type="button"
          >
            Quit Application
          </button>
        </div>
      </section>

      <section className="panel stack-md animate-slide-up" style={{ animationDelay: '0.25s' }}>
        <div className="section-header">
          <div>
            <p className="eyebrow">Data</p>
            <h3>Export &amp; Backup</h3>
          </div>
          <p className="section-copy">
            Download all your data as a file. {history.length} completed {history.length === 1 ? 'week' : 'weeks'} saved.
          </p>
        </div>
        <div className="action-row">
          <button className="button secondary" onClick={handleExport} type="button">
            Export All Data
          </button>
        </div>
      </section>

      <section className="panel stack-md reset-panel animate-slide-up" style={{ animationDelay: '0.35s' }}>
        <div className="section-header">
          <div>
            <p className="eyebrow danger-text">Danger Zone</p>
            <h3>Reset Everything</h3>
          </div>
          <p className="section-copy">
            This permanently removes everything — values, focuses, weeks, and reflections. There's no undo.
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
            <p className="field-error">Are you sure? This removes all your data and can't be undone.</p>
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
      className={[
        'button',
        'secondary',
        'small',
        'nav-tab',
        active ? 'nav-tab-active' : '',
      ].filter(Boolean).join(' ')}
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
  const workflowLabel = state === 'setup' ? 'Setup' : 'Dashboard';

  const getScreenKey = () => {
    if (activeView === 'workflow') return `workflow-${state}`;
    return activeView;
  };

  return (
    <div className="app-shell">
      <TitleBar />
      <AmbientBubbles />
      <header 
        className={`app-header panel ${headerVisible ? 'animate-slide-up' : ''}`}
        style={{ opacity: headerVisible ? 1 : 0 }}
      >
        <div className="brand-block">
          <h1 className="app-logo">Haven</h1>
          <p className="screen-copy">
            Your space for gentle growth, one week at a time
          </p>
        </div>
        <div className="header-controls">
          <span className={`badge state-pill state-${state}`}>{getStateLabel(state)}</span>
          <nav className="action-row">
            <NavButton
              active={activeView === 'workflow'}
              onClick={() => changeView('workflow')}
            >
              {workflowLabel}
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
              Edit
            </NavButton>
            <NavButton
              active={activeView === 'about'}
              onClick={() => changeView('about')}
            >
              About
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
        {activeView === 'about' ? <AboutScreen /> : null}
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
