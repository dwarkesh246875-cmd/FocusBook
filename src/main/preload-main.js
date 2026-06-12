/* preload-main.js — context bridge for the main FocusBook window */
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Called from main window to tell overlay it's running
  isElectron: true,
  sendTasks: (tasks) => ipcRenderer.send('tasks-updated', tasks),
  onToggleTask: (cb) => ipcRenderer.on('overlay-toggle-task', (e, id, d) => cb(id, d))
});
