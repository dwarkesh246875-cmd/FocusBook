/* preload-overlay.js — context bridge for the overlay widget */
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('overlayAPI', {
  expand:       ()       => ipcRenderer.send('overlay-expand'),
  collapse:     ()       => ipcRenderer.send('overlay-collapse'),
  showMain:     ()       => ipcRenderer.send('show-main-window'),
  drag:         (dx, dy) => ipcRenderer.send('overlay-drag', dx, dy),
  snap:         ()       => ipcRenderer.send('overlay-snap'),
  toggleTask:   (id, d)  => ipcRenderer.send('overlay-toggle-task', id, d),
  onOrientation: (cb)    => ipcRenderer.on('set-orientation', (e, dir) => cb(dir)),
  onTasks:      (cb)     => ipcRenderer.on('tasks-updated', (e, tasks) => cb(tasks))
});
