const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  quit: () => ipcRenderer.invoke('app:quit'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggleFullscreen'),
  getAutostart: () => ipcRenderer.invoke('autostart:get'),
  setAutostart: (enabled) => ipcRenderer.invoke('autostart:set', enabled),
  getCloseToTray: () => ipcRenderer.invoke('preferences:getCloseToTray'),
  setCloseToTray: (enabled) => ipcRenderer.invoke('preferences:setCloseToTray', enabled),
  data: {
    load: () => ipcRenderer.sendSync('data:load'),
    save: (raw) => ipcRenderer.sendSync('data:save', raw),
    export: (raw) => ipcRenderer.sendSync('data:export', raw),
    import: () => ipcRenderer.sendSync('data:import'),
    clear: () => ipcRenderer.sendSync('data:clear'),
    saveAttachment: (dataUrl, fileName) =>
      ipcRenderer.sendSync('data:saveAttachment', { dataUrl, fileName }),
  },
  onQuickJournal: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('journal:quick', listener);
    return () => ipcRenderer.removeListener('journal:quick', listener);
  },
});
