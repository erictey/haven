import {
  HAVEN_STORAGE_KEY,
  parsePersistedEnvelope,
  type PersistedAppEnvelope,
} from './persistedData';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function loadEnvelopeFromStorage(storage: StorageLike): PersistedAppEnvelope | null {
  return parsePersistedEnvelope(storage.getItem(HAVEN_STORAGE_KEY) ?? '');
}

export function saveEnvelopeToStorage(storage: StorageLike, envelope: PersistedAppEnvelope) {
  try {
    storage.setItem(HAVEN_STORAGE_KEY, JSON.stringify(envelope));
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : 'Unknown storage failure',
    };
  }
}

export function clearEnvelopeFromStorage(storage: StorageLike) {
  storage.removeItem(HAVEN_STORAGE_KEY);
}
