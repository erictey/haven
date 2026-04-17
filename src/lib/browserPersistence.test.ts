import { describe, expect, it } from 'vitest';
import { createPersistedEnvelope } from './persistedData';
import { saveEnvelopeToStorage } from './browserPersistence';

describe('saveEnvelopeToStorage', () => {
  it('reports a user-facing error when persistence fails', () => {
    const envelope = createPersistedEnvelope({
      setupCompleted: false,
      coreValues: [],
      missionItems: [],
      activeCycle: null,
      history: [],
    });

    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('Quota exceeded');
      },
      removeItem: () => undefined,
    };

    const result = saveEnvelopeToStorage(storage, envelope);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Quota exceeded');
  });
});
