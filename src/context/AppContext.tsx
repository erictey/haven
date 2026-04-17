import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import { getMessageForDate } from '../lib/messages';
import { canDeleteMissionItem as canDeleteMissionItemGuard, canEditFramework as canEditFrameworkForState, deriveAppState, validateSelection } from '../lib/stateMachine';
import {
  clearStoredAppData,
  exportAppData,
  importAppData,
  loadAppData,
  saveAppData,
} from '../lib/storage';
import {
  type AppData,
  type AppState,
  type HistoryCycle,
  type EvidenceAttachment,
  type CycleSelection,
  type CycleIntentions,
  type MissionCategory,
  type MissionItem,
  type SelectionErrors,
} from '../lib/types';
import { appReducer } from './appReducer';
import { getActiveCycleItems, getEligibleItems, getPendingRecapCycle } from './appSelectors';

type AppContextValue = AppData & {
  nowIso: string;
  state: AppState;
  canEditFramework: boolean;
  eligibleItems: Record<MissionCategory, MissionItem[]>;
  activeCycleItems: Record<MissionCategory, MissionItem | null>;
  pendingRecapCycle: HistoryCycle | null;
  cycleMessage: ReturnType<typeof getMessageForDate>;
  persistenceNotice: string | null;
  addCoreValue: (text: string) => void;
  updateCoreValue: (id: string, text: string) => void;
  deleteCoreValue: (id: string) => void;
  addMissionItem: (category: MissionCategory, text: string) => void;
  updateMissionItem: (id: string, text: string) => void;
  toggleMissionItemActive: (id: string) => void;
  deleteMissionItem: (id: string) => boolean;
  addEvidence: (
    category: MissionCategory,
    payload: { text?: string; imageDataUrl?: string; attachment?: EvidenceAttachment },
  ) => boolean;
  deleteEvidence: (category: MissionCategory, evidenceId: string) => void;
  completeSetup: () => void;
  startCycle: (
    selection: CycleSelection,
    intentions: CycleIntentions,
  ) => { ok: boolean; errors: SelectionErrors };
  submitReflection: (text: string) => boolean;
  deleteHistoryRecord: (id: string) => void;
  clearAllData: () => boolean;
  exportBackup: () => boolean;
  importBackup: () => boolean;
  acknowledgeCompletedCycle: () => void;
  clearPersistenceNotice: () => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

function initialAppData(_: undefined) {
  return loadAppData();
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(appReducer, undefined, initialAppData);
  const [now, setNow] = useState(() => new Date());
  const [persistenceNotice, setPersistenceNotice] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const nowIso = now.toISOString();
  const state = deriveAppState(data, nowIso);

  useEffect(() => {
    const result = saveAppData(data);
    if (!result.ok) {
      setPersistenceNotice(result.error ?? 'Could not save your latest changes.');
    }
  }, [data]);

  useEffect(() => {
    if (state === 'awaiting_reflection' && data.activeCycle?.status === 'active') {
      dispatch({ type: 'mark_awaiting_reflection' });
    }
  }, [data.activeCycle, state]);

  const eligibleItems = useMemo(() => getEligibleItems(data), [data]);
  const activeCycleItems = useMemo(() => getActiveCycleItems(data), [data]);
  const pendingRecapCycle = useMemo(() => getPendingRecapCycle(data), [data]);

  const value: AppContextValue = {
    ...data,
    nowIso,
    state,
    canEditFramework: canEditFrameworkForState(state),
    eligibleItems,
    activeCycleItems,
    pendingRecapCycle,
    cycleMessage: getMessageForDate(nowIso),
    persistenceNotice,
    addCoreValue: (text) =>
      dispatch({ type: 'add_core_value', text, timestamp: new Date().toISOString() }),
    updateCoreValue: (id, text) =>
      dispatch({
        type: 'update_core_value',
        id,
        text,
        timestamp: new Date().toISOString(),
      }),
    deleteCoreValue: (id) => dispatch({ type: 'delete_core_value', id }),
    addMissionItem: (category, text) => dispatch({ type: 'add_mission_item', category, text }),
    updateMissionItem: (id, text) => dispatch({ type: 'update_mission_item', id, text }),
    toggleMissionItemActive: (id) => dispatch({ type: 'toggle_mission_item_active', id }),
    deleteMissionItem: (id) => {
      if (!canDeleteMissionItemGuard(data, id)) {
        return false;
      }

      dispatch({ type: 'delete_mission_item', id });
      return true;
    },
    completeSetup: () => dispatch({ type: 'complete_setup' }),
    addEvidence: (category, payload) => {
      const text = payload.text?.trim();
      const imageDataUrl = payload.imageDataUrl?.trim();
      const attachment = payload.attachment;

      if (!data.activeCycle || (!text && !imageDataUrl && !attachment)) {
        return false;
      }

      dispatch({
        type: 'add_evidence',
        category,
        text,
        imageDataUrl,
        attachment,
        timestamp: new Date().toISOString(),
      });
      return true;
    },
    deleteEvidence: (category, evidenceId) =>
      dispatch({ type: 'delete_evidence', category, evidenceId }),
    startCycle: (selection, intentions) => {
      const validation = validateSelection(data, selection, nowIso);

      if (!validation.isValid) {
        return {
          ok: false,
          errors: validation.errors,
        };
      }

      dispatch({ type: 'start_cycle', selection, intentions, timestamp: nowIso });

      return {
        ok: true,
        errors: {},
      };
    },
    submitReflection: (text) => {
      if (!text.trim()) {
        return false;
      }

      dispatch({ type: 'submit_reflection', text, timestamp: new Date().toISOString() });
      return true;
    },
    deleteHistoryRecord: (id) => dispatch({ type: 'delete_history_record', id }),
    clearAllData: () => {
      const result = clearStoredAppData();
      if (!result.ok) {
        setPersistenceNotice(result.error ?? 'Could not clear data.');
        return false;
      }
      dispatch({ type: 'clear_all' });
      setPersistenceNotice(null);
      return true;
    },
    exportBackup: () => {
      const result = exportAppData(data);
      if (!result.ok && !result.cancelled) {
        setPersistenceNotice(result.error ?? 'Could not export your backup.');
      }
      return result.ok;
    },
    importBackup: () => {
      const result = importAppData();
      if (!('data' in result)) {
        if (!('cancelled' in result) || !result.cancelled) {
          setPersistenceNotice(
            ('error' in result ? result.error : undefined) ?? 'Could not import that backup.',
          );
        }
        return false;
      }

      dispatch({ type: 'replace_all', data: result.data });
      setPersistenceNotice(null);
      return true;
    },
    acknowledgeCompletedCycle: () => dispatch({ type: 'acknowledge_completed_cycle' }),
    clearPersistenceNotice: () => setPersistenceNotice(null),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used inside AppProvider');
  }

  return context;
}
