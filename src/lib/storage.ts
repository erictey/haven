import {
  clearEnvelopeFromStorage,
  loadEnvelopeFromStorage,
  saveEnvelopeToStorage,
} from './browserPersistence';
import {
  clearPersistedData,
  exportPersistedData,
  hasElectronDataApi,
  importPersistedData,
  loadPersistedData,
  saveEvidenceAttachment,
  savePersistedData,
} from './electron';
import {
  createEmptyAppData,
  createPersistedEnvelope,
  HAVEN_STORAGE_KEY,
  LEGACY_STORAGE_KEYS,
  migrateLegacyStorageSnapshot,
  parseBackupImport,
  parsePersistedEnvelope,
  serializeBackupEnvelope,
} from './persistedData';
import type { AppData, CycleEvidence, EvidenceEntry } from './types';

export { createEmptyAppData, HAVEN_STORAGE_KEY, LEGACY_STORAGE_KEYS };

export function loadAppData() {
  if (typeof window === 'undefined') {
    return createEmptyAppData();
  }

  if (hasElectronDataApi()) {
    const raw = loadPersistedData();
    const persisted = raw ? parsePersistedEnvelope(raw) : null;
    if (persisted) {
      return persisted.data;
    }
  }

  const browserEnvelope = loadEnvelopeFromStorage(window.localStorage);
  if (browserEnvelope) {
    if (hasElectronDataApi()) {
      savePersistedData(JSON.stringify(createPersistedEnvelope(browserEnvelope.data)));
      clearEnvelopeFromStorage(window.localStorage);
    }
    return browserEnvelope.data;
  }

  const migrated = migrateLegacyStorageSnapshot(readLegacySnapshot(window.localStorage));
  if (!migrated) {
    return createEmptyAppData();
  }

  const nextData = materializeInlineImages(migrated.data);
  saveAppData(nextData);
  clearLegacyData();
  return nextData;
}

export function saveAppData(data: AppData) {
  if (typeof window === 'undefined') {
    return { ok: true as const };
  }

  const prepared = materializeInlineImages(data);
  const envelope = createPersistedEnvelope(prepared);

  if (hasElectronDataApi()) {
    return savePersistedData(JSON.stringify(envelope));
  }

  return saveEnvelopeToStorage(window.localStorage, envelope);
}

export function clearStoredAppData() {
  if (typeof window === 'undefined') {
    return { ok: true as const };
  }

  clearLegacyData();

  if (hasElectronDataApi()) {
    return clearPersistedData();
  }

  clearEnvelopeFromStorage(window.localStorage);
  return { ok: true as const };
}

export function exportAppData(data: AppData) {
  const prepared = materializeInlineImages(data);

  if (typeof window === 'undefined') {
    return { ok: false as const, error: 'Export unavailable in this environment.' };
  }

  if (hasElectronDataApi()) {
    return exportPersistedData(JSON.stringify(createPersistedEnvelope(prepared)));
  }

  const raw = serializeBackupEnvelope(prepared);
  downloadTextFile(makeExportFilename(new Date()), raw);
  return { ok: true as const };
}

export function importAppData() {
  if (typeof window === 'undefined' || !hasElectronDataApi()) {
    return { ok: false as const, error: 'Import is only available in the desktop app.' };
  }

  const result = importPersistedData();
  if (!result.ok || !result.raw) {
    return result;
  }

  try {
    const imported = materializeInlineImages(parseBackupImport(result.raw));
    return { ok: true as const, data: imported };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : 'Could not parse backup file.',
    };
  }
}

export function makeExportFilename(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `haven-export-${year}-${month}-${day}.json`;
}

export function downloadTextFile(filename: string, content: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const blob = new Blob([content], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function readLegacySnapshot(storage: Storage) {
  return {
    [LEGACY_STORAGE_KEYS.setupCompleted]: storage.getItem(LEGACY_STORAGE_KEYS.setupCompleted),
    [LEGACY_STORAGE_KEYS.coreValues]: storage.getItem(LEGACY_STORAGE_KEYS.coreValues),
    [LEGACY_STORAGE_KEYS.missionItems]: storage.getItem(LEGACY_STORAGE_KEYS.missionItems),
    [LEGACY_STORAGE_KEYS.activeCycle]: storage.getItem(LEGACY_STORAGE_KEYS.activeCycle),
    [LEGACY_STORAGE_KEYS.history]: storage.getItem(LEGACY_STORAGE_KEYS.history),
  };
}

function clearLegacyData() {
  if (typeof window === 'undefined') {
    return;
  }

  for (const key of Object.values(LEGACY_STORAGE_KEYS)) {
    window.localStorage.removeItem(key);
  }
}

function materializeInlineImages(data: AppData): AppData {
  if (!hasElectronDataApi()) {
    return data;
  }

  const materializeEntries = (entries: EvidenceEntry[]) =>
    entries.map((entry) => {
      if (!entry.imageDataUrl || entry.attachment) {
        return entry;
      }

      const attachment = saveEvidenceAttachment(
        entry.imageDataUrl,
        `${entry.id || 'evidence'}.png`,
      );

      if (!attachment) {
        return entry;
      }

      return {
        ...entry,
        imageDataUrl: undefined,
        attachment,
      };
    });

  const materializeEvidence = (evidence: CycleEvidence): CycleEvidence => ({
    build: materializeEntries(evidence.build),
    shape: materializeEntries(evidence.shape),
    workWith: materializeEntries(evidence.workWith),
  });

  return {
    ...data,
    activeCycle: data.activeCycle
      ? {
          ...data.activeCycle,
          evidence: materializeEvidence(data.activeCycle.evidence),
        }
      : null,
    history: data.history.map((entry) => ({
      ...entry,
      evidence: materializeEvidence(entry.evidence),
    })),
  };
}
