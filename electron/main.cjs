const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { pathToFileURL } = require('url');

let mainWindow = null;
let tray = null;
let isQuitting = false;

const DEFAULT_PREFERENCES = {
  closeToTray: true,
  closeToTrayNoticeShown: false,
};

let preferences = { ...DEFAULT_PREFERENCES };

function getPreferencesPath() {
  return path.join(app.getPath('userData'), 'preferences.json');
}

function getDataFilePath() {
  return path.join(app.getPath('userData'), 'haven-data.json');
}

function getAttachmentsDirectory() {
  return path.join(app.getPath('userData'), 'attachments');
}

function loadPreferences() {
  try {
    const raw = fs.readFileSync(getPreferencesPath(), 'utf8');
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PREFERENCES,
      ...(parsed && typeof parsed === 'object' ? parsed : {}),
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function savePreferences(nextPreferences) {
  preferences = {
    ...DEFAULT_PREFERENCES,
    ...nextPreferences,
  };

  try {
    fs.writeFileSync(getPreferencesPath(), JSON.stringify(preferences, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to save preferences', error);
  }
}

function usesBorderlessFullscreen() {
  return process.platform === 'win32';
}

function isWindowExpanded(window) {
  if (!window) return false;
  return usesBorderlessFullscreen() ? window.isFullScreen() : window.isMaximized();
}

function expandWindow(window) {
  if (!window) return;

  if (usesBorderlessFullscreen()) {
    window.setFullScreen(true);
    return;
  }

  window.maximize();
}

function toggleWindowExpanded(window) {
  if (!window) return;

  if (usesBorderlessFullscreen()) {
    window.setFullScreen(!window.isFullScreen());
    return;
  }

  if (window.isMaximized()) {
    window.unmaximize();
  } else {
    window.maximize();
  }
}

function getTrayIconPath() {
  return path.join(__dirname, '..', 'public', 'icon.png');
}

function createTrayIcon() {
  const iconPath = getTrayIconPath();

  if (fs.existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath);
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="18" fill="#0a1a14"/>
      <path d="M20 14h8v16h8V14h8v36h-8V38h-8v12h-8z" fill="#4ade80"/>
    </svg>
  `;

  return nativeImage
    .createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`)
    .resize({ width: 16, height: 16 });
}

function showMainWindow() {
  if (!mainWindow) return;

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.show();
  mainWindow.focus();
}

function destroyTray() {
  if (!tray) return;
  tray.destroy();
  tray = null;
}

function updateTrayMenu() {
  if (!tray) return;

  const windowVisible = mainWindow?.isVisible() ?? false;
  const menu = Menu.buildFromTemplate([
    {
      label: windowVisible ? 'Hide Haven' : 'Show Haven',
      click: () => {
        if (!mainWindow) return;
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          showMainWindow();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quick Journal: Build',
      click: () => openQuickJournal('build'),
    },
    {
      label: 'Quick Journal: Shape',
      click: () => openQuickJournal('shape'),
    },
    {
      label: 'Quick Journal: Work With',
      click: () => openQuickJournal('workWith'),
    },
    { type: 'separator' },
    {
      label: 'Quit Haven',
      click: () => {
        isQuitting = true;
        destroyTray();
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(menu);
}

function ensureTray() {
  if (tray) {
    updateTrayMenu();
    return tray;
  }

  tray = new Tray(createTrayIcon());
  tray.setToolTip('Haven');
  tray.on('click', () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      showMainWindow();
    }
    updateTrayMenu();
  });
  updateTrayMenu();
  return tray;
}

function openQuickJournal(category) {
  showMainWindow();
  mainWindow?.webContents.send('journal:quick', { category });
}

function hideToTray() {
  if (!mainWindow) return;
  ensureTray();
  mainWindow.hide();
  updateTrayMenu();
  maybeShowCloseToTrayNotice();
}

function maybeShowCloseToTrayNotice() {
  if (
    preferences.closeToTrayNoticeShown ||
    !tray ||
    process.platform !== 'win32' ||
    typeof tray.displayBalloon !== 'function'
  ) {
    return;
  }

  tray.displayBalloon({
    iconType: 'info',
    title: 'Haven is still running',
    content: 'Haven moved to your system tray. Click the tray icon to reopen it, or right-click it to quit.',
  });

  savePreferences({
    ...preferences,
    closeToTrayNoticeShown: true,
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a1a14',
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load from Vite dev server or built files
  const isDev = process.argv.includes('--dev');

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('close', (event) => {
    if (isQuitting || !preferences.closeToTray) {
      return;
    }

    event.preventDefault();
    hideToTray();
  });

  mainWindow.on('show', updateTrayMenu);
  mainWindow.on('hide', updateTrayMenu);

  // Start expanded for immersive feel.
  expandWindow(mainWindow);
}

// Window control IPC handlers
ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window:maximize', () => {
  toggleWindowExpanded(mainWindow);
});

ipcMain.handle('window:close', () => {
  mainWindow?.close();
});

ipcMain.handle('app:quit', () => {
  isQuitting = true;
  destroyTray();
  app.quit();
});

ipcMain.handle('window:isMaximized', () => {
  return isWindowExpanded(mainWindow);
});

ipcMain.handle('window:toggleFullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  }
});

// Autostart IPC handlers
ipcMain.handle('autostart:get', () => {
  const settings = app.getLoginItemSettings();
  return settings.openAtLogin;
});

ipcMain.handle('autostart:set', (_event, enabled) => {
  app.setLoginItemSettings({ openAtLogin: enabled });
  return enabled;
});

ipcMain.handle('preferences:getCloseToTray', () => {
  return preferences.closeToTray;
});

ipcMain.handle('preferences:setCloseToTray', (_event, enabled) => {
  const nextEnabled = Boolean(enabled);
  savePreferences({ ...preferences, closeToTray: nextEnabled });

  if (!nextEnabled) {
    destroyTray();
  }

  return preferences.closeToTray;
});

ipcMain.on('data:load', (event) => {
  try {
    const dataPath = getDataFilePath();

    if (!fs.existsSync(dataPath)) {
      event.returnValue = null;
      return;
    }

    event.returnValue = fs.readFileSync(dataPath, 'utf8');
  } catch (error) {
    console.error('Failed to load Haven data', error);
    event.returnValue = null;
  }
});

ipcMain.on('data:save', (event, raw) => {
  try {
    JSON.parse(raw);
    fs.mkdirSync(path.dirname(getDataFilePath()), { recursive: true });
    fs.writeFileSync(getDataFilePath(), raw, 'utf8');
    event.returnValue = { ok: true };
  } catch (error) {
    console.error('Failed to save Haven data', error);
    event.returnValue = {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown save error',
    };
  }
});

ipcMain.on('data:export', (event, raw) => {
  try {
    const parsed = JSON.parse(raw);
    const backup = buildPortableBackup(parsed);
    const savePath = require('electron').dialog.showSaveDialogSync(mainWindow, {
      title: 'Export Haven backup',
      defaultPath: path.join(
        app.getPath('documents'),
        `haven-export-${new Date().toISOString().slice(0, 10)}.json`,
      ),
      filters: [{ name: 'Haven Backup', extensions: ['json'] }],
    });

    if (!savePath) {
      event.returnValue = { ok: false, cancelled: true };
      return;
    }

    fs.writeFileSync(savePath, JSON.stringify(backup, null, 2), 'utf8');
    event.returnValue = { ok: true, path: savePath };
  } catch (error) {
    console.error('Failed to export Haven backup', error);
    event.returnValue = {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown export error',
    };
  }
});

ipcMain.on('data:import', (event) => {
  try {
    const result = require('electron').dialog.showOpenDialogSync(mainWindow, {
      title: 'Import Haven backup',
      properties: ['openFile'],
      filters: [{ name: 'Haven Backup', extensions: ['json'] }],
    });

    const filePath = result?.[0];
    if (!filePath) {
      event.returnValue = { ok: false, cancelled: true };
      return;
    }

    event.returnValue = {
      ok: true,
      raw: fs.readFileSync(filePath, 'utf8'),
    };
  } catch (error) {
    console.error('Failed to import Haven backup', error);
    event.returnValue = {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown import error',
    };
  }
});

ipcMain.on('data:clear', (event) => {
  try {
    const dataPath = getDataFilePath();
    const attachmentsPath = getAttachmentsDirectory();

    if (fs.existsSync(dataPath)) {
      fs.unlinkSync(dataPath);
    }

    if (fs.existsSync(attachmentsPath)) {
      fs.rmSync(attachmentsPath, { recursive: true, force: true });
    }

    event.returnValue = { ok: true };
  } catch (error) {
    console.error('Failed to clear Haven data', error);
    event.returnValue = {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown clear error',
    };
  }
});

ipcMain.on('data:saveAttachment', (event, payload) => {
  try {
    event.returnValue = saveAttachmentFromDataUrl(payload?.dataUrl, payload?.fileName);
  } catch (error) {
    console.error('Failed to store Haven attachment', error);
    event.returnValue = null;
  }
});

function buildPortableBackup(envelope) {
  const clone = JSON.parse(JSON.stringify(envelope));

  forEachEvidenceEntry(clone?.data, (entry) => {
    if (!entry?.attachment?.filePath || !fs.existsSync(entry.attachment.filePath)) {
      return;
    }

    entry.attachment.dataUrl = fileToDataUrl(
      entry.attachment.filePath,
      entry.attachment.mimeType,
    );
  });

  if (clone && typeof clone === 'object') {
    clone.exportedAt = new Date().toISOString();
  }

  return clone;
}

function forEachEvidenceEntry(data, visitor) {
  if (!data || typeof data !== 'object') {
    return;
  }

  const visitEvidenceGroup = (evidence) => {
    if (!evidence || typeof evidence !== 'object') {
      return;
    }

    for (const entries of Object.values(evidence)) {
      if (!Array.isArray(entries)) {
        continue;
      }

      for (const entry of entries) {
        visitor(entry);
      }
    }
  };

  visitEvidenceGroup(data.activeCycle?.evidence);

  if (Array.isArray(data.history)) {
    for (const historyEntry of data.history) {
      visitEvidenceGroup(historyEntry?.evidence);
    }
  }
}

function fileToDataUrl(filePath, mimeType) {
  const buffer = fs.readFileSync(filePath);
  return `data:${mimeType || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
}

function saveAttachmentFromDataUrl(dataUrl, fileName = 'evidence') {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return null;
  }

  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    return null;
  }

  const mimeType = match[1];
  const payload = match[2];
  const extension = getExtensionForMimeType(mimeType, fileName);
  const safeName = `${randomUUID()}.${extension}`;
  const targetDirectory = getAttachmentsDirectory();
  const targetPath = path.join(targetDirectory, safeName);
  const buffer = Buffer.from(payload, 'base64');

  fs.mkdirSync(targetDirectory, { recursive: true });
  fs.writeFileSync(targetPath, buffer);

  return {
    kind: 'image',
    filePath: targetPath,
    fileName: path.basename(fileName, path.extname(fileName)) + `.${extension}`,
    fileUrl: pathToFileURL(targetPath).href,
    mimeType,
    size: buffer.byteLength,
  };
}

function getExtensionForMimeType(mimeType, fileName) {
  const ext = path.extname(fileName || '').replace('.', '').toLowerCase();
  if (ext) {
    return ext;
  }

  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/gif':
      return 'gif';
    case 'image/webp':
      return 'webp';
    default:
      return 'png';
  }
}

app.whenReady().then(() => {
  preferences = loadPreferences();
  createWindow();
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    showMainWindow();
  }
});
