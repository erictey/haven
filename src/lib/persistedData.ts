import {
  CATEGORY_ORDER,
  createEmptyCycleEvidence,
  createEmptyIntentions,
  type AppData,
  type CycleEvidence,
  type CycleIntentions,
  type EvidenceAttachment,
  type EvidenceEntry,
  type HistoryCycle,
  type MissionItem,
} from './types';

export const APP_DATA_VERSION = 2;
export const HAVEN_STORAGE_KEY = 'haven_app_envelope';
export const LEGACY_STORAGE_KEYS = {
  setupCompleted: 'tim_setup_completed',
  coreValues: 'tim_core_values',
  missionItems: 'tim_mission_items',
  activeCycle: 'tim_active_cycle',
  history: 'tim_history',
} as const;

export type PersistedAppEnvelope = {
  version: typeof APP_DATA_VERSION;
  savedAt: string;
  data: AppData;
};

type BackupAttachment = Omit<EvidenceAttachment, 'fileUrl'> & {
  dataUrl: string;
};

type BackupEvidenceEntry = Omit<EvidenceEntry, 'attachment'> & {
  attachment?: BackupAttachment;
};

type BackupHistoryCycle = Omit<HistoryCycle, 'evidence'> & {
  evidence: Record<(typeof CATEGORY_ORDER)[number], BackupEvidenceEntry[]>;
};

type BackupActiveCycle = NonNullable<AppData['activeCycle']>;

type BackupAppData = Omit<AppData, 'activeCycle' | 'history'> & {
  activeCycle: (Omit<BackupActiveCycle, 'evidence'> & {
    evidence: Record<(typeof CATEGORY_ORDER)[number], BackupEvidenceEntry[]>;
  }) | null;
  history: BackupHistoryCycle[];
};

type BackupEnvelope = {
  version: typeof APP_DATA_VERSION;
  exportedAt: string;
  data: BackupAppData;
};

export function createEmptyAppData(): AppData {
  return {
    setupCompleted: false,
    coreValues: [],
    missionItems: [],
    activeCycle: null,
    history: [],
    pendingRecapCycleId: null,
  };
}

export function createPersistedEnvelope(
  data: AppData,
  savedAt = new Date().toISOString(),
): PersistedAppEnvelope {
  return {
    version: APP_DATA_VERSION,
    savedAt,
    data: normalizeAppData(data),
  };
}

export function parsePersistedEnvelope(raw: string): PersistedAppEnvelope | null {
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedAppEnvelope>;

    if (parsed.version === APP_DATA_VERSION && parsed.data) {
      return {
        version: APP_DATA_VERSION,
        savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
        data: normalizeAppData(parsed.data),
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function migrateLegacyStorageSnapshot(
  snapshot: Partial<Record<(typeof LEGACY_STORAGE_KEYS)[keyof typeof LEGACY_STORAGE_KEYS], string | null>>,
): PersistedAppEnvelope | null {
  const data = createEmptyAppData();
  const coreValues = parseJson(snapshot[LEGACY_STORAGE_KEYS.coreValues], data.coreValues);
  const missionItems = parseJson(snapshot[LEGACY_STORAGE_KEYS.missionItems], data.missionItems);
  const activeCycle = parseJson(snapshot[LEGACY_STORAGE_KEYS.activeCycle], data.activeCycle);
  const history = parseJson(snapshot[LEGACY_STORAGE_KEYS.history], data.history);
  const setupCompleted = parseJson(snapshot[LEGACY_STORAGE_KEYS.setupCompleted], false);

  if (
    !coreValues.length &&
    !missionItems.length &&
    !activeCycle &&
    !(Array.isArray(history) && history.length > 0) &&
    !setupCompleted
  ) {
    return null;
  }

  return createPersistedEnvelope({
    setupCompleted: Boolean(setupCompleted),
    coreValues: Array.isArray(coreValues) ? coreValues : [],
    missionItems: Array.isArray(missionItems) ? missionItems : [],
    activeCycle: activeCycle ? normalizeActiveCycle(activeCycle) : null,
    history: Array.isArray(history) ? history.map(normalizeHistoryCycle) : [],
    pendingRecapCycleId: null,
  });
}

export function serializeBackupEnvelope(
  data: AppData,
  attachmentDataByPath: Record<string, string> = {},
  exportedAt = new Date().toISOString(),
): string {
  const normalized = normalizeAppData(data);
  const backup: BackupEnvelope = {
    version: APP_DATA_VERSION,
    exportedAt,
    data: {
      ...normalized,
      activeCycle: normalized.activeCycle
        ? {
            ...normalized.activeCycle,
            evidence: mapEvidenceForBackup(normalized.activeCycle.evidence, attachmentDataByPath),
          }
        : null,
      history: normalized.history.map((entry) => ({
        ...entry,
        evidence: mapEvidenceForBackup(entry.evidence, attachmentDataByPath),
      })),
    },
  };

  return JSON.stringify(backup, null, 2);
}

export function parseBackupImport(raw: string): AppData {
  const parsed = JSON.parse(raw) as Partial<BackupEnvelope>;
  const parsedData = parsed.data ?? createEmptyAppData();

  return normalizeAppData({
    ...parsedData,
    activeCycle: parsedData.activeCycle
      ? {
          ...parsedData.activeCycle,
          evidence: mapEvidenceFromBackup(parsedData.activeCycle.evidence),
        }
      : null,
    history: Array.isArray(parsedData.history)
      ? parsedData.history.map((entry) => ({
          ...entry,
          evidence: mapEvidenceFromBackup(entry.evidence),
        }))
      : [],
  });
}

export function normalizeAppData(value: unknown): AppData {
  if (!value || typeof value !== 'object') {
    return createEmptyAppData();
  }

  const record = value as Partial<AppData>;

  return {
    setupCompleted: Boolean(record.setupCompleted),
    coreValues: Array.isArray(record.coreValues) ? record.coreValues : [],
    missionItems: Array.isArray(record.missionItems)
      ? record.missionItems.map(normalizeMissionItem)
      : [],
    activeCycle: record.activeCycle ? normalizeActiveCycle(record.activeCycle) : null,
    history: Array.isArray(record.history) ? record.history.map(normalizeHistoryCycle) : [],
    pendingRecapCycleId:
      typeof record.pendingRecapCycleId === 'string' ? record.pendingRecapCycleId : null,
  };
}

function normalizeMissionItem(item: unknown): MissionItem {
  const record = (item && typeof item === 'object' ? item : {}) as Partial<MissionItem>;
  return {
    id: typeof record.id === 'string' ? record.id : '',
    category:
      record.category === 'build' || record.category === 'shape' || record.category === 'workWith'
        ? record.category
        : 'build',
    text: typeof record.text === 'string' ? record.text : '',
    isActive: record.isActive !== false,
    usedInCurrentRotation: Boolean(record.usedInCurrentRotation),
  };
}

function normalizeActiveCycle(value: unknown): NonNullable<AppData['activeCycle']> {
  const record = (value && typeof value === 'object' ? value : {}) as NonNullable<AppData['activeCycle']>;
  return {
    id: typeof record.id === 'string' ? record.id : '',
    buildItemId: typeof record.buildItemId === 'string' ? record.buildItemId : '',
    shapeItemId: typeof record.shapeItemId === 'string' ? record.shapeItemId : '',
    workWithItemId: typeof record.workWithItemId === 'string' ? record.workWithItemId : '',
    intentions: normalizeIntentions(record.intentions),
    startDate: typeof record.startDate === 'string' ? record.startDate : '',
    endDate: typeof record.endDate === 'string' ? record.endDate : '',
    status:
      record.status === 'awaiting_reflection' || record.status === 'completed'
        ? record.status
        : 'active',
    reflection:
      record.reflection && typeof record.reflection.text === 'string' && typeof record.reflection.submittedAt === 'string'
        ? record.reflection
        : undefined,
    evidence: normalizeEvidence(record.evidence),
  };
}

function normalizeHistoryCycle(value: unknown): HistoryCycle {
  const record = (value && typeof value === 'object' ? value : {}) as Partial<HistoryCycle>;
  return {
    id: typeof record.id === 'string' ? record.id : '',
    buildItemId: typeof record.buildItemId === 'string' ? record.buildItemId : '',
    shapeItemId: typeof record.shapeItemId === 'string' ? record.shapeItemId : '',
    workWithItemId: typeof record.workWithItemId === 'string' ? record.workWithItemId : '',
    buildText: typeof record.buildText === 'string' ? record.buildText : '',
    shapeText: typeof record.shapeText === 'string' ? record.shapeText : '',
    workWithText: typeof record.workWithText === 'string' ? record.workWithText : '',
    intentions: normalizeIntentions(record.intentions),
    startDate: typeof record.startDate === 'string' ? record.startDate : '',
    endDate: typeof record.endDate === 'string' ? record.endDate : '',
    evidence: normalizeEvidence(record.evidence),
    reflection:
      record.reflection && typeof record.reflection.text === 'string' && typeof record.reflection.submittedAt === 'string'
        ? record.reflection
        : { text: '', submittedAt: '' },
  };
}

function normalizeIntentions(value: unknown): CycleIntentions {
  const fallback = createEmptyIntentions();
  if (!value || typeof value !== 'object') {
    return fallback;
  }

  const record = value as Partial<Record<keyof CycleIntentions, unknown>>;
  return {
    build: typeof record.build === 'string' ? record.build : '',
    shape: typeof record.shape === 'string' ? record.shape : '',
    workWith: typeof record.workWith === 'string' ? record.workWith : '',
  };
}

function normalizeEvidence(value: unknown): CycleEvidence {
  const fallback = createEmptyCycleEvidence();
  if (!value || typeof value !== 'object') {
    return fallback;
  }

  const record = value as Partial<Record<keyof CycleEvidence, unknown>>;
  return {
    build: normalizeEvidenceList(record.build),
    shape: normalizeEvidenceList(record.shape),
    workWith: normalizeEvidenceList(record.workWith),
  };
}

function normalizeEvidenceList(value: unknown): EvidenceEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const record = (entry && typeof entry === 'object' ? entry : {}) as Partial<EvidenceEntry>;
    return {
      id: typeof record.id === 'string' ? record.id : '',
      text: typeof record.text === 'string' ? record.text : undefined,
      imageDataUrl: typeof record.imageDataUrl === 'string' ? record.imageDataUrl : undefined,
      attachment: normalizeAttachment(record.attachment),
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : '',
    };
  });
}

function normalizeAttachment(value: unknown): EvidenceAttachment | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const record = value as Partial<EvidenceAttachment>;
  if (
    typeof record.filePath !== 'string' ||
    typeof record.fileName !== 'string' ||
    typeof record.fileUrl !== 'string' ||
    typeof record.mimeType !== 'string' ||
    typeof record.size !== 'number'
  ) {
    return undefined;
  }

  return {
    kind: 'image',
    filePath: record.filePath,
    fileName: record.fileName,
    fileUrl: record.fileUrl,
    mimeType: record.mimeType,
    size: record.size,
  };
}

function mapEvidenceForBackup(
  evidence: CycleEvidence,
  attachmentDataByPath: Record<string, string>,
): Record<(typeof CATEGORY_ORDER)[number], BackupEvidenceEntry[]> {
  return {
    build: evidence.build.map((entry) => mapEntryForBackup(entry, attachmentDataByPath)),
    shape: evidence.shape.map((entry) => mapEntryForBackup(entry, attachmentDataByPath)),
    workWith: evidence.workWith.map((entry) => mapEntryForBackup(entry, attachmentDataByPath)),
  };
}

function mapEntryForBackup(
  entry: EvidenceEntry,
  attachmentDataByPath: Record<string, string>,
): BackupEvidenceEntry {
  if (!entry.attachment) {
    const { attachment: _attachment, ...rest } = entry;
    return rest;
  }

  const dataUrl = attachmentDataByPath[entry.attachment.filePath];
  if (!dataUrl) {
    const { attachment: _attachment, ...rest } = entry;
    return rest;
  }

  return {
    ...entry,
    attachment: {
      kind: 'image',
      filePath: entry.attachment.filePath,
      fileName: entry.attachment.fileName,
      mimeType: entry.attachment.mimeType,
      size: entry.attachment.size,
      dataUrl,
    },
  };
}

function mapEvidenceFromBackup(
  evidence: unknown,
): Record<(typeof CATEGORY_ORDER)[number], EvidenceEntry[]> {
  const fallback = createEmptyCycleEvidence();
  if (!evidence || typeof evidence !== 'object') {
    return fallback;
  }

  const record = evidence as Partial<Record<keyof CycleEvidence, unknown>>;
  return {
    build: normalizeBackupEvidenceList(record.build),
    shape: normalizeBackupEvidenceList(record.shape),
    workWith: normalizeBackupEvidenceList(record.workWith),
  };
}

function normalizeBackupEvidenceList(value: unknown): EvidenceEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const record = (entry && typeof entry === 'object' ? entry : {}) as Partial<
      EvidenceEntry & { attachment?: BackupAttachment }
    >;
    const attachment = record.attachment;

    return {
      id: typeof record.id === 'string' ? record.id : '',
      text: typeof record.text === 'string' ? record.text : undefined,
      imageDataUrl:
        typeof record.imageDataUrl === 'string'
          ? record.imageDataUrl
          : typeof attachment?.dataUrl === 'string'
            ? attachment.dataUrl
            : undefined,
      attachment: undefined,
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : '',
    };
  });
}

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
