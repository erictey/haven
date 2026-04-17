import { describe, expect, it } from 'vitest';
import type { AppData } from './types';
import {
  APP_DATA_VERSION,
  createPersistedEnvelope,
  migrateLegacyStorageSnapshot,
  parseBackupImport,
  serializeBackupEnvelope,
} from './persistedData';

function makeAppData(): AppData {
  return {
    setupCompleted: true,
    coreValues: [
      {
        id: 'value-1',
        text: 'Integrity',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    missionItems: [
      { id: 'build-1', category: 'build', text: 'Write daily', isActive: true, usedInCurrentRotation: false },
      { id: 'shape-1', category: 'shape', text: 'Tidy desk', isActive: true, usedInCurrentRotation: false },
      { id: 'work-1', category: 'workWith', text: 'Uncertainty', isActive: true, usedInCurrentRotation: false },
    ],
    activeCycle: {
      id: 'cycle-1',
      buildItemId: 'build-1',
      shapeItemId: 'shape-1',
      workWithItemId: 'work-1',
      intentions: {
        build: 'Show up daily',
        shape: 'Leave the room better',
        workWith: 'Pause before reacting',
      },
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-01-08T00:00:00.000Z',
      status: 'active',
      evidence: {
        build: [
          {
            id: 'evidence-1',
            createdAt: '2026-01-02T00:00:00.000Z',
            text: 'Wrote for 25 minutes',
            attachment: {
              kind: 'image',
              filePath: 'C:/vault/haven/attachments/evidence-1.png',
              fileName: 'evidence-1.png',
              fileUrl: 'file:///C:/vault/haven/attachments/evidence-1.png',
              mimeType: 'image/png',
              size: 128,
            },
          },
        ],
        shape: [],
        workWith: [],
      },
    },
    history: [],
  } as AppData;
}

describe('createPersistedEnvelope', () => {
  it('wraps app data in a versioned Haven envelope', () => {
    const envelope = createPersistedEnvelope(makeAppData(), '2026-01-03T00:00:00.000Z');

    expect(envelope.version).toBe(APP_DATA_VERSION);
    expect(envelope.savedAt).toBe('2026-01-03T00:00:00.000Z');
    expect(envelope.data.coreValues).toHaveLength(1);
  });
});

describe('migrateLegacyStorageSnapshot', () => {
  it('migrates legacy tim_* local storage into the new Haven envelope', () => {
    const snapshot = {
      tim_setup_completed: JSON.stringify(true),
      tim_core_values: JSON.stringify([
        {
          id: 'value-1',
          text: 'Integrity',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
      tim_mission_items: JSON.stringify([
        { id: 'build-1', category: 'build', text: 'Write daily', isActive: true, usedInCurrentRotation: false },
        { id: 'shape-1', category: 'shape', text: 'Tidy desk', isActive: true, usedInCurrentRotation: false },
        { id: 'work-1', category: 'workWith', text: 'Uncertainty', isActive: true, usedInCurrentRotation: false },
      ]),
      tim_active_cycle: JSON.stringify({
        id: 'cycle-1',
        buildItemId: 'build-1',
        shapeItemId: 'shape-1',
        workWithItemId: 'work-1',
        intentions: {
          build: 'Show up daily',
          shape: 'Leave the room better',
          workWith: 'Pause before reacting',
        },
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-01-08T00:00:00.000Z',
        status: 'active',
        evidence: {
          build: [
            {
              id: 'evidence-1',
              createdAt: '2026-01-02T00:00:00.000Z',
              imageDataUrl: 'data:image/png;base64,AAAA',
            },
          ],
          shape: [],
          workWith: [],
        },
      }),
      tim_history: JSON.stringify([]),
    };

    const migrated = migrateLegacyStorageSnapshot(snapshot);

    expect(migrated?.version).toBe(APP_DATA_VERSION);
    expect(migrated?.data.activeCycle?.evidence.build[0]).toMatchObject({
      imageDataUrl: 'data:image/png;base64,AAAA',
    });
  });
});

describe('backup import/export', () => {
  it('round-trips attachment-backed evidence through a portable backup file', () => {
    const raw = serializeBackupEnvelope(
      makeAppData(),
      {
        'C:/vault/haven/attachments/evidence-1.png': 'data:image/png;base64,AAAA',
      },
      '2026-01-05T00:00:00.000Z',
    );

    const imported = parseBackupImport(raw);

    expect(imported.activeCycle?.evidence.build[0]).toMatchObject({
      imageDataUrl: 'data:image/png;base64,AAAA',
    });
    expect(imported.activeCycle?.evidence.build[0]?.attachment).toBeUndefined();
  });
});
