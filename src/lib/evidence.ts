import type { EvidenceEntry } from './types';

export function getEvidenceImageSource(entry: EvidenceEntry) {
  return entry.imageDataUrl ?? entry.attachment?.fileUrl ?? null;
}
