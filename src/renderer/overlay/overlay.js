/* ============================================================
   overlay.js — FocusBook Widget Renderer
   ============================================================ */
'use strict';

// ── Firebase removed ──
// The overlay now receives tasks directly from the main window via IPC.

// ── DOM refs ─────────────────────────────────────────────────
const widgetWrapper = document.getElementById('widget-wrapper');
const widgetBtn    = document.getElementById('widget-btn');
const widgetPanel  = document.getElementById('widget-panel');
const iconBadge    = document.getElementById('icon-badge');
const hoverCircle  = document.getElementById('hover-ring-circle');
const panelDate    = document.getElementById('panel-date');
const panelCount   = document.getElementById('panel-count');
const panelStatus  = document.getElementById('panel-status');
const panelStatusTxt = document.getElementById('panel-status-text');
const panelProgressWrap = document.getElementById('panel-progress-wrap');
const panelProgressFill = document.getElementById('panel-progress-fill');
const panelProgressLabel = document.getElementById('panel-progress-label');
const taskListEl   = document.getElementById('task-list');
const closeBtn     = document.getElementById('panel-close-btn');
const openAppBtn   = document.getElementById('open-app-btn');

// ── State ────────────────────────────────────────────────────
let currentTasks   = [];
let todayStr       = '';
let unsubscribeTasks = null;
let isExpanded     = false;

// ── Expand / Collapse ────────────────────────────────────────
function expandWidget() {
  if (isExpanded) return;
  isExpanded = true;

  // Tell main process to resize the Electron window
  window.overlayAPI.expand();

  // Show panel with animation after a tiny delay (so resize happens first)
  setTimeout(() => {
    document.body.classList.remove('collapsed');
    document.body.classList.add('expanded');
    requestAnimationFrame(() => {
      widgetPanel.classList.add('visible');
    });
  }, 60);
}

function collapseWidget() {
  if (!isExpanded) return;
  isExpanded = false;

  widgetPanel.classList.remove('visible');

  // Wait for CSS fade-out before telling main to shrink the window
  setTimeout(() => {
    document.body.classList.remove('expanded');
    document.body.classList.add('collapsed');
    window.overlayAPI.collapse();
  }, 300);
}

// ── Click & Drag Logic (Smooth Absolute JS) ──────────────────
let clickOffset = { x: 0, y: 0 };
let isDragging = false;
let hasMoved = false;

let dragStartScreen = { x: 0, y: 0 };

widgetBtn.addEventListener('pointerdown', (e) => {
  if (isExpanded) return;
  // Calculate offset inside the window so dragging feels natural
  clickOffset = { x: e.clientX, y: e.clientY };
  dragStartScreen = { x: e.screenX, y: e.screenY };
  isDragging = true;
  hasMoved = false;
  widgetBtn.style.transition = 'none'; // disable CSS transition while dragging
  widgetBtn.setPointerCapture(e.pointerId); // Keep events even if mouse leaves bounds
});

window.addEventListener('pointermove', (e) => {
  if (!isDragging || isExpanded) return;
  
  // Check jitter threshold
  const dx = e.screenX - dragStartScreen.x;
  const dy = e.screenY - dragStartScreen.y;
  if (!hasMoved && Math.abs(dx) < 3 && Math.abs(dy) < 3) {
    return; // Wait for at least 3px movement before initiating drag
  }
  
  hasMoved = true;
  
  // Calculate new absolute screen position
  const newScreenX = e.screenX - clickOffset.x;
  const newScreenY = e.screenY - clickOffset.y;
  
  window.overlayAPI.drag(newScreenX, newScreenY);
});

window.addEventListener('pointerup', (e) => {
  if (!isDragging) return;
  isDragging = false;
  widgetBtn.style.transition = ''; // restore CSS transition
  widgetBtn.releasePointerCapture(e.pointerId);
  
  if (!hasMoved) {
    // It was a click. Expand.
    if (!isExpanded) expandWidget();
  } else {
    // After dragging manually, snap to the nearest edge
    window.overlayAPI.snap();
  }
});

// Close button
closeBtn.addEventListener('click', collapseWidget);

// Collapse when mouse leaves the expanded panel (with a grace period)
let leaveTimer = null;
widgetPanel.addEventListener('mouseleave', () => {
  leaveTimer = setTimeout(collapseWidget, 900);
});
widgetPanel.addEventListener('mouseenter', () => {
  clearTimeout(leaveTimer);
});

// Open main app
openAppBtn.addEventListener('click', () => {
  window.overlayAPI.showMain();
});

// Flip orientation based on snap
window.overlayAPI.onOrientation(dir => {
  if (dir === 'left') {
    widgetWrapper.classList.remove('edge-right');
    widgetWrapper.classList.add('edge-left');
  } else {
    widgetWrapper.classList.remove('edge-left');
    widgetWrapper.classList.add('edge-right');
  }
});

// ── Helpers ──────────────────────────────────────────────────
function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function priorityOrder(p) {
  return p === 'high' ? 0 : p === 'medium' ? 1 : 2;
}

function formatDate(str) {
  if (!str) return '';
  const parts = str.split('-');
  if (parts.length !== 3) return str;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

// ── Render tasks ─────────────────────────────────────────────
function renderTasks(tasks) {
  todayStr = getTodayStr();
  const today = tasks
    .filter(t => t.date === todayStr)
    .sort((a, b) => {
      const pd = priorityOrder(a.priority) - priorityOrder(b.priority);
      return pd !== 0 ? pd : (a.sortOrder || a.created || 0) - (b.sortOrder || b.created || 0);
    });

  currentTasks = today;

  // Update date + count in header
  panelDate.textContent  = formatDate(todayStr);
  const doneCount  = today.filter(t => t.done).length;
  const totalCount = today.length;
  panelCount.textContent = `${doneCount}/${totalCount} done`;

  // Badge on icon
  const remaining = today.filter(t => !t.done).length;
  if (remaining > 0) {
    iconBadge.style.display = 'flex';
    iconBadge.textContent   = remaining > 9 ? '9+' : remaining;
  } else {
    iconBadge.style.display = 'none';
  }

  // Progress bar
  if (totalCount > 0) {
    panelProgressWrap.style.display = 'flex';
    const pct = Math.round(doneCount / totalCount * 100);
    panelProgressFill.style.width   = pct + '%';
    panelProgressLabel.textContent  = pct + '%';
  } else {
    panelProgressWrap.style.display = 'none';
  }

  // Task list
  taskListEl.innerHTML = '';

  if (today.length === 0) {
    setStatus('🎉 No tasks for today!<br>Open FocusBook to add some.');
    return;
  }

  setStatus(null); // hide status

  // Group by priority
  const groups = { high: [], med: [], low: [] };
  today.forEach(t => {
    const g = groups[t.priority] || groups.low;
    g.push(t);
  });

  const labels = { high: 'High Priority', med: 'Medium', low: 'Low' };
  let animDelay = 0;

  Object.entries(groups).forEach(([priority, items]) => {
    if (!items.length) return;

    const header = document.createElement('div');
    header.className = 'w-group-header';
    header.textContent = labels[priority];
    taskListEl.appendChild(header);

    items.forEach(task => {
      const row = document.createElement('div');
      row.className = 'w-task' + (task.done ? ' done' : '');
      row.style.animationDelay = animDelay + 'ms';
      animDelay += 40;

      const subCount = Array.isArray(task.subItems) ? task.subItems.length : 0;
      const doneSubCount = Array.isArray(task.subItems) ? task.subItems.filter(s => s.done).length : 0;

      row.innerHTML = `
        <div class="w-priority-dot ${priority}"></div>
        <span class="w-task-title" title="${escHtml(task.name)}">${escHtml(task.name)}</span>
        ${subCount > 0 ? `<span class="w-sub-count">${doneSubCount}/${subCount}</span>` : ''}
        <div class="w-check" data-id="${task.id}" title="${task.done ? 'Mark incomplete' : 'Mark done'}">
          ${task.done ? checkmarkSvg() : ''}
        </div>
      `;

      // Click row = open main app
      row.addEventListener('click', (e) => {
        if (e.target.closest('.w-check')) return;
        window.overlayAPI.showMain();
      });

      // Checkbox click
      row.querySelector('.w-check').addEventListener('click', async (e) => {
        e.stopPropagation();
        await toggleTask(task);
      });

      taskListEl.appendChild(row);
    });
  });
}

function checkmarkSvg() {
  return `<svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M1.5 5l2.5 2.5 5-5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Toggle task via IPC ──────────────────────────────────────
function toggleTask(task) {
  const newDone = !task.done;
  
  // Optimistic UI update
  task.done = newDone;
  if (newDone && Array.isArray(task.subItems) && task.subItems.length > 0) {
    task.subItems = task.subItems.map(s => ({ ...s, done: true }));
  }
  renderTasks(currentTasks);

  window.overlayAPI.toggleTask(task.id, newDone);
}

// ── Status helper ─────────────────────────────────────────────
function setStatus(html) {
  if (html) {
    panelStatus.classList.remove('hidden');
    panelStatusTxt.innerHTML = html;
    const spinner = panelStatus.querySelector('.status-spinner');
    if (spinner) spinner.style.display = 'none';
    taskListEl.innerHTML = '';
  } else {
    panelStatus.classList.add('hidden');
  }
}

// ── Receive Tasks via IPC ────────────────────────────────────
window.overlayAPI.onTasks((tasks) => {
  if (tasks.length > 0) {
    renderTasks(tasks);
  } else {
    setStatus('🎉 No tasks for today!<br>Open FocusBook to add some.');
    iconBadge.style.display = 'none';
    panelProgressWrap.style.display = 'none';
    taskListEl.innerHTML = '';
  }
});

// ── Init body state ──────────────────────────────────────────
document.body.classList.add('collapsed');

// ── Keep today updated (for widgets left open overnight) ─────
setInterval(() => {
  const newToday = getTodayStr();
  if (newToday !== todayStr) {
    todayStr = newToday;
    renderTasks(currentTasks);
  }
}, 60 * 1000);
