import type { EvidenceAttachment, MissionCategory } from './types';

// Type-safe bridge to Electron APIs exposed via preload
declare global {
  interface Window {
    electronAPI?: {
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      quit: () => Promise<void>;
      isMaximized: () => Promise<boolean>;
      toggleFullscreen: () => Promise<void>;
      getAutostart: () => Promise<boolean>;
      setAutostart: (enabled: boolean) => Promise<boolean>;
      getCloseToTray: () => Promise<boolean>;
      setCloseToTray: (enabled: boolean) => Promise<boolean>;
      data?: {
        load: () => string | null;
        save: (raw: string) => { ok: boolean; error?: string };
        export: (raw: string) => { ok: boolean; cancelled?: boolean; error?: string; path?: string };
        import: () => { ok: boolean; cancelled?: boolean; error?: string; raw?: string };
        clear: () => { ok: boolean; error?: string };
        saveAttachment: (dataUrl: string, fileName?: string) => EvidenceAttachment | null;
      };
      onQuickJournal?: (
        callback: (payload: { category?: MissionCategory }) => void,
      ) => (() => void) | void;
    };
  }
}

export const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

export function hasElectronApi() {
  return typeof window !== 'undefined' && !!window.electronAPI;
}

export function hasAutostartApi() {
  return (
    typeof window !== 'undefined' &&
    typeof window.electronAPI?.getAutostart === 'function' &&
    typeof window.electronAPI?.setAutostart === 'function'
  );
}

export function hasCloseToTrayApi() {
  return (
    typeof window !== 'undefined' &&
    typeof window.electronAPI?.getCloseToTray === 'function' &&
    typeof window.electronAPI?.setCloseToTray === 'function'
  );
}

export function hasElectronDataApi() {
  return (
    typeof window !== 'undefined' &&
    typeof window.electronAPI?.data?.load === 'function' &&
    typeof window.electronAPI?.data?.save === 'function'
  );
}

export function windowMinimize() {
  window.electronAPI?.minimize();
}

export function windowMaximize() {
  window.electronAPI?.maximize();
}

export function windowClose() {
  window.electronAPI?.close();
}

export function appQuit() {
  window.electronAPI?.quit();
}

export async function windowIsMaximized() {
  return (await window.electronAPI?.isMaximized()) ?? false;
}

export function windowToggleFullscreen() {
  window.electronAPI?.toggleFullscreen();
}

export async function getAutostart() {
  return (await window.electronAPI?.getAutostart()) ?? false;
}

export async function setAutostart(enabled: boolean) {
  return (await window.electronAPI?.setAutostart(enabled)) ?? false;
}

export async function getCloseToTray() {
  return (await window.electronAPI?.getCloseToTray()) ?? false;
}

export async function setCloseToTray(enabled: boolean) {
  return (await window.electronAPI?.setCloseToTray(enabled)) ?? false;
}

export function loadPersistedData() {
  return window.electronAPI?.data?.load() ?? null;
}

export function savePersistedData(raw: string) {
  return window.electronAPI?.data?.save(raw) ?? { ok: false, error: 'Persistence API unavailable' };
}

export function exportPersistedData(raw: string) {
  return window.electronAPI?.data?.export(raw) ?? {
    ok: false,
    error: 'Export API unavailable',
  };
}

export function importPersistedData() {
  return window.electronAPI?.data?.import() ?? {
    ok: false,
    error: 'Import API unavailable',
  };
}

export function clearPersistedData() {
  return window.electronAPI?.data?.clear() ?? {
    ok: false,
    error: 'Clear API unavailable',
  };
}

export function saveEvidenceAttachment(dataUrl: string, fileName?: string) {
  return window.electronAPI?.data?.saveAttachment(dataUrl, fileName) ?? null;
}

export function subscribeToQuickJournal(
  callback: (payload: { category?: MissionCategory }) => void,
) {
  return window.electronAPI?.onQuickJournal?.(callback);
}
