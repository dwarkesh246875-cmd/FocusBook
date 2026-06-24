/* ============================================================
   FOCUSBOOK — main.js (Electron main process)
   ============================================================ */
'use strict';

const { app, BrowserWindow, ipcMain, screen, shell } = require('electron');
const path = require('path');
const fs   = require('fs');
const http = require('http');

// ── Built-in static server for Firebase Auth ─────────────────
let serverPort = null;
const mimeTypes = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml'
};
const rendererPath = path.join(__dirname, '../renderer');

const server = http.createServer((req, res) => {
  let filePath = path.join(rendererPath, req.url.split('?')[0]);
  if (filePath === rendererPath + '\\' || filePath === rendererPath + '/') {
    filePath = path.join(rendererPath, 'app/dist/index.html');
  } else if (req.url.startsWith('/app/')) {
    // Reroute /app/ paths to /app/dist/ for the Vite output
    filePath = path.join(rendererPath, req.url.split('?')[0].replace('/app/', '/app/dist/'));
  }
  const ext = String(path.extname(filePath)).toLowerCase();
  
  fs.readFile(filePath, (err, content) => {
    if (err) { res.writeHead(404); res.end('Not found'); }
    else { res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' }); res.end(content, 'utf-8'); }
  });
});

// ── Config (persists widget position) ───────────────────────
const configPath = path.join(app.getPath('userData'), 'widget-config.json');

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(configPath, 'utf8')); }
  catch { return {}; }
}
function saveConfig(data) {
  try { fs.writeFileSync(configPath, JSON.stringify(data, null, 2)); }
  catch (e) { console.error('Config save failed:', e); }
}

// ── Window dimensions ────────────────────────────────────────
const COLLAPSED = { w: 36, h: 64 }; // Width gives enough room for the slide-out button
const EXPANDED  = { w: 340, h: 480 };

let mainWin = null;
let overlayWin = null;
let lastTasks = [];



// ── Overlay widget window ────────────────────────────────────
function createOverlayWindow() {
  const cfg = loadConfig();
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;

  // Default: bottom-right with a 20px margin
  const defaultX = sw - COLLAPSED.w - 20;
  const defaultY = sh - COLLAPSED.h - 20;
  const x = (typeof cfg.widgetX === 'number') ? cfg.widgetX : defaultX;
  const y = (typeof cfg.widgetY === 'number') ? cfg.widgetY : defaultY;

  overlayWin = new BrowserWindow({
    width:  COLLAPSED.w,
    height: COLLAPSED.h,
    x, y,
    frame:        false,
    transparent:  true,
    alwaysOnTop:  true,
    hasShadow:    false,
    resizable:    false,
    skipTaskbar:  true,
    webPreferences: {
      partition: 'persist:focusbook',   // shared session = shared Firebase auth
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
      preload: path.join(__dirname, 'preload-overlay.js'),
    },
  });

  // Stay above full-screen apps and across all workspaces (macOS)
  overlayWin.setAlwaysOnTop(true, 'screen-saver');
  if (process.platform === 'darwin') {
    overlayWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }

  overlayWin.webContents.setWindowOpenHandler(({ url }) => { return { action: \'allow\', overrideBrowserWindowOptions: { autoHideMenuBar: true, webPreferences: { nodeIntegration: false, contextIsolation: true } } }; });\n  overlayWin.loadURL(`http://localhost:${serverPort}/overlay/overlay.html`);
  overlayWin.webContents.on('did-finish-load', () => {
    if (lastTasks.length > 0) {
      overlayWin.webContents.send('tasks-updated', lastTasks);
    }
  });
  overlayWin.on('closed', () => { overlayWin = null; });

  // Auto-save position whenever user drags the widget
  overlayWin.on('moved', () => {
    if (!overlayWin) return;
    const [wx, wy] = overlayWin.getPosition();
    const cfg = loadConfig();
    cfg.widgetX = wx;
    cfg.widgetY = wy;
    saveConfig(cfg);
  });
}

app.whenReady().then(() => {
  server.listen(0, 'localhost', () => {
    serverPort = server.address().port;
    createOverlayWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── IPC: Overlay expand / collapse ──────────────────────────
ipcMain.on('overlay-expand', () => {
  if (!overlayWin) return;
  const [wx, wy]   = overlayWin.getPosition();
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;

  // Determine edge. Expand inward.
  const isRight  = wx > sw / 2;
  const isBottom = wy > sh / 2;

  const newX = isRight ? Math.max(0, sw - EXPANDED.w - 10) : 10;
  // Try to keep it near its vertical position, but don't go off-screen
  const newY = Math.min(Math.max(0, wy - (EXPANDED.h / 2)), sh - EXPANDED.h - 10);

  overlayWin.setSize(EXPANDED.w, EXPANDED.h);
  overlayWin.setPosition(newX, Math.round(newY));
});

ipcMain.on('overlay-collapse', () => {
  if (!overlayWin) return;
  // Restore to saved collapsed position
  const cfg = loadConfig();
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  const x = (typeof cfg.widgetX === 'number') ? cfg.widgetX : sw - COLLAPSED.w;
  const y = (typeof cfg.widgetY === 'number') ? cfg.widgetY : Math.round(sh / 2 - COLLAPSED.h / 2);

  overlayWin.setSize(COLLAPSED.w, COLLAPSED.h);
  overlayWin.setPosition(x, y);
});

// ── IPC: Dragging ────────────────────────────────────────────
ipcMain.on('overlay-drag', (e, newX, newY) => {
  if (!overlayWin) return;
  overlayWin.setPosition(Math.round(newX), Math.round(newY));
});

ipcMain.on('overlay-snap', () => {
  if (!overlayWin) return;
  const [x, y] = overlayWin.getPosition();
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  
  // Snap strictly to left or right edge based on which half of the screen it's on
  let newX = x < sw / 2 ? 0 : sw - COLLAPSED.w;
  let newY = Math.max(0, Math.min(y, sh - COLLAPSED.h)); // clamp vertical

  overlayWin.setPosition(newX, newY);

  // Return whether it snapped to left or right so the renderer can point the arrow correctly
  const orientation = (newX === 0) ? 'left' : 'right';
  overlayWin.webContents.send('set-orientation', orientation);

  // Save snapped position
  const cfg = loadConfig();
  cfg.widgetX = newX;
  cfg.widgetY = newY;
  saveConfig(cfg);
});

// ── IPC: Tasks ───────────────────────────────────────────────
ipcMain.on('tasks-updated', (e, tasks) => {
  lastTasks = tasks;
  if (overlayWin && !overlayWin.isDestroyed()) {
    overlayWin.webContents.send('tasks-updated', tasks);
  }
});
