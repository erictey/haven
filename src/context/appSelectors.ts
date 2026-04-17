import { getEligibleMissionItems } from '../lib/rotation';
import type { AppData, HistoryCycle, MissionCategory, MissionItem } from '../lib/types';

export function getEligibleItems(data: AppData): Record<MissionCategory, MissionItem[]> {
  return {
    build: getEligibleMissionItems(data.missionItems, 'build'),
    shape: getEligibleMissionItems(data.missionItems, 'shape'),
    workWith: getEligibleMissionItems(data.missionItems, 'workWith'),
  };
}

export function getActiveCycleItems(data: AppData): Record<MissionCategory, MissionItem | null> {
  return {
    build: data.activeCycle
      ? data.missionItems.find((item) => item.id === data.activeCycle?.buildItemId) ?? null
      : null,
    shape: data.activeCycle
      ? data.missionItems.find((item) => item.id === data.activeCycle?.shapeItemId) ?? null
      : null,
    workWith: data.activeCycle
      ? data.missionItems.find((item) => item.id === data.activeCycle?.workWithItemId) ?? null
      : null,
  };
}

export function getPendingRecapCycle(data: AppData): HistoryCycle | null {
  if (!data.pendingRecapCycleId) {
    return null;
  }

  return data.history.find((entry) => entry.id === data.pendingRecapCycleId) ?? null;
}
