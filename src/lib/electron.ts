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
