import { getActiveMissionItems, isMissionItemEligible } from './rotation';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type ActiveCycle,
  type AppData,
  type AppState,
  type CycleSelection,
  type SelectionErrors,
} from './types';

export const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

export function hasMinimumSetup(data: AppData) {
  return (
    data.coreValues.length > 0 &&
    CATEGORY_ORDER.every((category) => getActiveMissionItems(data.missionItems, category).length > 0)
  );
}

export function getLiveCycleStatus(activeCycle: ActiveCycle, nowIso: string) {
  if (!activeCycle) {
    return null;
  }

  if (activeCycle.reflection?.text.trim()) {
    return 'completed';
  }

  if (activeCycle.status === 'completed') {
    return 'completed';
  }

  if (
    activeCycle.status === 'awaiting_reflection' ||
    Date.parse(nowIso) >= Date.parse(activeCycle.endDate)
  ) {
    return 'awaiting_reflection';
  }

  return 'active';
}

export function deriveAppState(data: AppData, nowIso: string): AppState {
  if (!hasMinimumSetup(data)) {
    return 'setup';
  }

  if (!data.setupCompleted) {
    return 'setup';
  }

  const cycleStatus = getLiveCycleStatus(data.activeCycle, nowIso);

  if (!cycleStatus) {
    if (
      data.pendingRecapCycleId &&
      data.history.some((entry) => entry.id === data.pendingRecapCycleId)
    ) {
      return 'completed_cycle';
    }

    return 'ready_to_select';
  }

  if (cycleStatus === 'active') {
    return 'active_week';
  }

  if (cycleStatus === 'awaiting_reflection') {
    return 'awaiting_reflection';
  }

  return 'completed_cycle';
}

export function canEditFramework(state: AppState) {
  return state !== 'active_week' && state !== 'awaiting_reflection';
}

export function canDeleteMissionItem(data: AppData, itemId: string) {
  if (!data.activeCycle) {
    return true;
  }

  return ![
    data.activeCycle.buildItemId,
    data.activeCycle.shapeItemId,
    data.activeCycle.workWithItemId,
  ].includes(itemId);
}

export function validateSelection(
  data: AppData,
  selection: CycleSelection,
  nowIso: string,
): { isValid: boolean; errors: SelectionErrors } {
  const errors: SelectionErrors = {};
  const appState = deriveAppState(data, nowIso);

  if (appState === 'setup') {
    errors.form = 'Almost there! Add at least one value and one focus in each category to get started.';
  }

  if (data.activeCycle) {
    errors.form = 'Finish up your current week before starting a new one.';
  }

  for (const category of CATEGORY_ORDER) {
    const selectedId = selection[category];

    if (!selectedId) {
      errors[category] = `Pick a ${CATEGORY_LABELS[category]} focus for this week.`;
      continue;
    }

    if (!isMissionItemEligible(data.missionItems, selectedId)) {
      errors[category] = 'This one had a turn recently — try a different pick this week.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getCycleDates(startIso: string) {
  return {
    startDate: startIso,
    endDate: new Date(Date.parse(startIso) + WEEK_IN_MS).toISOString(),
  };
}
