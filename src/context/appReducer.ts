import {
  createEmptyAppData,
} from '../lib/storage';
import {
  createEmptyCycleEvidence,
  createEmptyIntentions,
  type AppData,
  type CoreValue,
  type CycleIntentions,
  type CycleSelection,
  type EvidenceAttachment,
  type EvidenceEntry,
  type HistoryCycle,
  type MissionCategory,
  type MissionItem,
} from '../lib/types';
import { applySelectionToRotation } from '../lib/rotation';
import { getCycleDates, hasMinimumSetup } from '../lib/stateMachine';

export type AppAction =
  | { type: 'add_core_value'; text: string; timestamp: string }
  | { type: 'update_core_value'; id: string; text: string; timestamp: string }
  | { type: 'delete_core_value'; id: string }
  | { type: 'add_mission_item'; category: MissionCategory; text: string }
  | { type: 'update_mission_item'; id: string; text: string }
  | { type: 'toggle_mission_item_active'; id: string }
  | { type: 'delete_mission_item'; id: string }
  | {
      type: 'add_evidence';
      category: MissionCategory;
      text?: string;
      imageDataUrl?: string;
      attachment?: EvidenceAttachment;
      timestamp: string;
    }
  | { type: 'delete_evidence'; category: MissionCategory; evidenceId: string }
  | { type: 'complete_setup' }
  | {
      type: 'start_cycle';
      selection: CycleSelection;
      intentions: CycleIntentions;
      timestamp: string;
    }
  | { type: 'mark_awaiting_reflection' }
  | { type: 'submit_reflection'; text: string; timestamp: string }
  | { type: 'delete_history_record'; id: string }
  | { type: 'acknowledge_completed_cycle' }
  | { type: 'replace_all'; data: AppData }
  | { type: 'clear_all' };

export function createId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `haven-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
}

function getMissionText(items: MissionItem[], id: string) {
  return items.find((item) => item.id === id)?.text ?? 'Removed mission item';
}

function buildHistoryCycle(
  activeCycle: NonNullable<AppData['activeCycle']>,
  items: MissionItem[],
  reflectionText: string,
  submittedAt: string,
): HistoryCycle {
  return {
    id: activeCycle.id,
    buildItemId: activeCycle.buildItemId,
    shapeItemId: activeCycle.shapeItemId,
    workWithItemId: activeCycle.workWithItemId,
    buildText: getMissionText(items, activeCycle.buildItemId),
    shapeText: getMissionText(items, activeCycle.shapeItemId),
    workWithText: getMissionText(items, activeCycle.workWithItemId),
    intentions: activeCycle.intentions ?? createEmptyIntentions(),
    startDate: activeCycle.startDate,
    endDate: activeCycle.endDate,
    evidence: activeCycle.evidence,
    reflection: {
      text: reflectionText.trim(),
      submittedAt,
    },
  };
}

export function appReducer(state: AppData, action: AppAction): AppData {
  switch (action.type) {
    case 'add_core_value': {
      const text = action.text.trim();

      if (!text) {
        return state;
      }

      const newValue: CoreValue = {
        id: createId(),
        text,
        createdAt: action.timestamp,
        updatedAt: action.timestamp,
      };

      return {
        ...state,
        coreValues: [...state.coreValues, newValue],
      };
    }

    case 'update_core_value': {
      const text = action.text.trim();

      if (!text) {
        return state;
      }

      return {
        ...state,
        coreValues: state.coreValues.map((value) =>
          value.id === action.id ? { ...value, text, updatedAt: action.timestamp } : value,
        ),
      };
    }

    case 'delete_core_value':
      return {
        ...state,
        coreValues: state.coreValues.filter((value) => value.id !== action.id),
      };

    case 'add_mission_item': {
      const text = action.text.trim();

      if (!text) {
        return state;
      }

      const newItem: MissionItem = {
        id: createId(),
        category: action.category,
        text,
        isActive: true,
        usedInCurrentRotation: false,
      };

      return {
        ...state,
        missionItems: [...state.missionItems, newItem],
      };
    }

    case 'update_mission_item': {
      const text = action.text.trim();

      if (!text) {
        return state;
      }

      return {
        ...state,
        missionItems: state.missionItems.map((item) =>
          item.id === action.id ? { ...item, text } : item,
        ),
      };
    }

    case 'toggle_mission_item_active':
      return {
        ...state,
        missionItems: state.missionItems.map((item) =>
          item.id === action.id
            ? {
                ...item,
                isActive: !item.isActive,
                usedInCurrentRotation: item.isActive ? item.usedInCurrentRotation : false,
              }
            : item,
        ),
      };

    case 'delete_mission_item':
      return {
        ...state,
        missionItems: state.missionItems.filter((item) => item.id !== action.id),
      };

    case 'add_evidence': {
      if (!state.activeCycle) {
        return state;
      }

      const text = action.text?.trim();
      const imageDataUrl = action.imageDataUrl?.trim();

      if (!text && !imageDataUrl && !action.attachment) {
        return state;
      }

      const entry: EvidenceEntry = {
        id: createId(),
        createdAt: action.timestamp,
        ...(text ? { text } : {}),
        ...(imageDataUrl ? { imageDataUrl } : {}),
        ...(action.attachment ? { attachment: action.attachment } : {}),
      };

      const evidence = state.activeCycle.evidence ?? createEmptyCycleEvidence();
      const categoryEvidence = evidence[action.category] ?? [];

      return {
        ...state,
        activeCycle: {
          ...state.activeCycle,
          evidence: {
            ...evidence,
            [action.category]: [entry, ...categoryEvidence],
          },
        },
      };
    }

    case 'delete_evidence': {
      if (!state.activeCycle) {
        return state;
      }

      const evidence = state.activeCycle.evidence ?? createEmptyCycleEvidence();
      const categoryEvidence = evidence[action.category] ?? [];

      return {
        ...state,
        activeCycle: {
          ...state.activeCycle,
          evidence: {
            ...evidence,
            [action.category]: categoryEvidence.filter((entry) => entry.id !== action.evidenceId),
          },
        },
      };
    }

    case 'complete_setup':
      if (!hasMinimumSetup(state)) {
        return state;
      }

      return {
        ...state,
        setupCompleted: true,
      };

    case 'start_cycle': {
      const { startDate, endDate } = getCycleDates(action.timestamp);
      const nextMissionItems = applySelectionToRotation(state.missionItems, action.selection);

      return {
        ...state,
        setupCompleted: true,
        pendingRecapCycleId: null,
        missionItems: nextMissionItems,
        activeCycle: {
          id: createId(),
          buildItemId: action.selection.build ?? '',
          shapeItemId: action.selection.shape ?? '',
          workWithItemId: action.selection.workWith ?? '',
          intentions: {
            build: action.intentions.build.trim(),
            shape: action.intentions.shape.trim(),
            workWith: action.intentions.workWith.trim(),
          },
          startDate,
          endDate,
          status: 'active',
          evidence: createEmptyCycleEvidence(),
        },
      };
    }

    case 'mark_awaiting_reflection':
      if (!state.activeCycle || state.activeCycle.status !== 'active') {
        return state;
      }

      return {
        ...state,
        activeCycle: {
          ...state.activeCycle,
          status: 'awaiting_reflection',
        },
      };

    case 'submit_reflection':
      if (!state.activeCycle || !action.text.trim()) {
        return state;
      }

      return {
        ...state,
        activeCycle: null,
        pendingRecapCycleId: state.activeCycle.id,
        history: [
          buildHistoryCycle(state.activeCycle, state.missionItems, action.text, action.timestamp),
          ...state.history,
        ],
      };

    case 'delete_history_record':
      return {
        ...state,
        history: state.history.filter((entry) => entry.id !== action.id),
        pendingRecapCycleId:
          state.pendingRecapCycleId === action.id ? null : state.pendingRecapCycleId ?? null,
      };

    case 'acknowledge_completed_cycle':
      return {
        ...state,
        pendingRecapCycleId: null,
      };

    case 'replace_all':
      return action.data;

    case 'clear_all':
      return createEmptyAppData();

    default:
      return state;
  }
}
