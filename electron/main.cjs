const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

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
