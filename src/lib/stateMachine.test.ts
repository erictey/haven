import { describe, expect, it } from 'vitest';
import {
  canDeleteMissionItem,
  canEditFramework,
  deriveAppState,
  getCycleDates,
  getLiveCycleStatus,
  hasMinimumSetup,
  validateSelection,
  WEEK_IN_MS,
} from './stateMachine';
import type { ActiveCycle, AppData, MissionItem } from './types';

function makeItem(
  id: string,
  category: MissionItem['category'],
  active = true,
): MissionItem {
  return { id, category, text: id, isActive: active, usedInCurrentRotation: false };
}

function makeMinimalData(overrides: Partial<AppData> = {}): AppData {
  return {
    setupCompleted: true,
    coreValues: [{ id: 'v1', text: 'Integrity', createdAt: '', updatedAt: '' }],
    missionItems: [
      makeItem('b1', 'build'),
      makeItem('s1', 'shape'),
      makeItem('w1', 'workWith'),
    ],
    activeCycle: null,
    history: [],
    ...overrides,
  };
}

const FUTURE = new Date(Date.now() + WEEK_IN_MS).toISOString();
const PAST = new Date(Date.now() - WEEK_IN_MS).toISOString();
const NOW = new Date().toISOString();

function makeCycle(overrides: Partial<NonNullable<ActiveCycle>> = {}): NonNullable<ActiveCycle> {
  return {
    id: 'c1',
    buildItemId: 'b1',
    shapeItemId: 's1',
    workWithItemId: 'w1',
    intentions: { build: '', shape: '', workWith: '' },
    startDate: PAST,
    endDate: FUTURE,
    status: 'active',
    evidence: { build: [], shape: [], workWith: [] },
    ...overrides,
  };
}

describe('hasMinimumSetup', () => {
  it('false with no core values', () => {
    expect(hasMinimumSetup(makeMinimalData({ coreValues: [] }))).toBe(false);
  });

  it('false with missing category', () => {
    const data = makeMinimalData({ missionItems: [makeItem('b1', 'build')] });
    expect(hasMinimumSetup(data)).toBe(false);
  });

  it('false when category only has inactive items', () => {
    const data = makeMinimalData({
      missionItems: [makeItem('b1', 'build'), makeItem('s1', 'shape'), makeItem('w1', 'workWith', false)],
    });
    expect(hasMinimumSetup(data)).toBe(false);
  });

  it('true with all categories covered', () => {
    expect(hasMinimumSetup(makeMinimalData())).toBe(true);
  });
});

describe('getLiveCycleStatus', () => {
  it('null for null cycle', () => {
    expect(getLiveCycleStatus(null, NOW)).toBeNull();
  });

  it('completed when reflection present', () => {
    const cycle = makeCycle({ reflection: { text: 'done', submittedAt: NOW } });
    expect(getLiveCycleStatus(cycle, NOW)).toBe('completed');
  });

  it('completed when status=completed', () => {
    const cycle = makeCycle({ status: 'completed' });
    expect(getLiveCycleStatus(cycle, NOW)).toBe('completed');
  });

  it('awaiting_reflection when past end date', () => {
    const cycle = makeCycle({ endDate: PAST });
    expect(getLiveCycleStatus(cycle, NOW)).toBe('awaiting_reflection');
  });

  it('awaiting_reflection when status=awaiting_reflection', () => {
    const cycle = makeCycle({ status: 'awaiting_reflection' });
    expect(getLiveCycleStatus(cycle, NOW)).toBe('awaiting_reflection');
  });

  it('active when within window', () => {
    const cycle = makeCycle({ status: 'active', endDate: FUTURE });
    expect(getLiveCycleStatus(cycle, NOW)).toBe('active');
  });
});

describe('deriveAppState', () => {
  it('setup when no minimum setup', () => {
    expect(deriveAppState(makeMinimalData({ coreValues: [] }), NOW)).toBe('setup');
  });

  it('setup when setupCompleted=false', () => {
    expect(deriveAppState(makeMinimalData({ setupCompleted: false }), NOW)).toBe('setup');
  });

  it('ready_to_select with no active cycle', () => {
    expect(deriveAppState(makeMinimalData(), NOW)).toBe('ready_to_select');
  });

  it('active_week with active cycle', () => {
    const data = makeMinimalData({ activeCycle: makeCycle() });
    expect(deriveAppState(data, NOW)).toBe('active_week');
  });

  it('awaiting_reflection when cycle past end', () => {
    const data = makeMinimalData({ activeCycle: makeCycle({ endDate: PAST }) });
    expect(deriveAppState(data, NOW)).toBe('awaiting_reflection');
  });

  it('completed_cycle after reflection submitted', () => {
    const data = makeMinimalData({
      activeCycle: makeCycle({ reflection: { text: 'great week', submittedAt: NOW } }),
    });
    expect(deriveAppState(data, NOW)).toBe('completed_cycle');
  });

  it('completed_cycle when a freshly completed week is waiting for recap', () => {
    const data = makeMinimalData({
      history: [
        {
          id: 'history-1',
          buildItemId: 'b1',
          shapeItemId: 's1',
          workWithItemId: 'w1',
          buildText: 'Build',
          shapeText: 'Shape',
          workWithText: 'Work With',
          intentions: { build: '', shape: '', workWith: '' },
          startDate: PAST,
          endDate: NOW,
          evidence: { build: [], shape: [], workWith: [] },
          reflection: { text: 'Closed the loop', submittedAt: NOW },
        },
      ],
      pendingRecapCycleId: 'history-1',
    });

    expect(deriveAppState(data, NOW)).toBe('completed_cycle');
  });
});

describe('canEditFramework', () => {
  it('false during active_week', () => {
    expect(canEditFramework('active_week')).toBe(false);
  });

  it('false during awaiting_reflection', () => {
    expect(canEditFramework('awaiting_reflection')).toBe(false);
  });

  it('true in all other states', () => {
    expect(canEditFramework('setup')).toBe(true);
    expect(canEditFramework('ready_to_select')).toBe(true);
    expect(canEditFramework('completed_cycle')).toBe(true);
  });
});

describe('canDeleteMissionItem', () => {
  it('true with no active cycle', () => {
    expect(canDeleteMissionItem(makeMinimalData(), 'b1')).toBe(true);
  });

  it('false for item in active cycle', () => {
    const data = makeMinimalData({ activeCycle: makeCycle() });
    expect(canDeleteMissionItem(data, 'b1')).toBe(false);
    expect(canDeleteMissionItem(data, 's1')).toBe(false);
    expect(canDeleteMissionItem(data, 'w1')).toBe(false);
  });

  it('true for item not in active cycle', () => {
    const data = makeMinimalData({
      missionItems: [...makeMinimalData().missionItems, makeItem('b2', 'build')],
      activeCycle: makeCycle(),
    });
    expect(canDeleteMissionItem(data, 'b2')).toBe(true);
  });
});

describe('validateSelection', () => {
  it('valid selection passes', () => {
    const data = makeMinimalData();
    const selection = { build: 'b1', shape: 's1', workWith: 'w1' };
    const { isValid, errors } = validateSelection(data, selection, NOW);
    expect(isValid).toBe(true);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('error when category missing', () => {
    const data = makeMinimalData();
    const selection = { build: null, shape: 's1', workWith: 'w1' };
    const { isValid, errors } = validateSelection(data, selection, NOW);
    expect(isValid).toBe(false);
    expect(errors.build).toBeDefined();
  });

  it('error when active cycle exists', () => {
    const data = makeMinimalData({ activeCycle: makeCycle() });
    const selection = { build: 'b1', shape: 's1', workWith: 'w1' };
    const { isValid, errors } = validateSelection(data, selection, NOW);
    expect(isValid).toBe(false);
    expect(errors.form).toBeDefined();
  });
});

describe('getCycleDates', () => {
  it('end date is exactly 7 days after start', () => {
    const start = '2024-01-01T00:00:00.000Z';
    const { startDate, endDate } = getCycleDates(start);
    expect(startDate).toBe(start);
    expect(Date.parse(endDate) - Date.parse(startDate)).toBe(WEEK_IN_MS);
  });
});
