import { auth, db, getUserRefs } from './firebase.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js';
import { onSnapshot, doc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';

// ── DOM refs ─────────────────────────────────────────────────
const widgetWrapper = document.getElementById('widget-wrapper');
const widgetBtn    = document.getElementById('widget-btn');
const widgetPanel  = document.getElementById('widget-panel');
const iconBadge    = document.getElementById('icon-badge');
const panelDate    = document.getElementById('panel-date');
const panelCount   = document.getElementById('panel-count');
const panelStatus  = document.getElementById('panel-status');
const panelStatusTxt = document.getElementById('panel-status-text');
const panelProgressWrap = document.getElementById('panel-progress-wrap');
const panelProgressFill = document.getElementById('panel-progress-fill');
const panelProgressLabel = document.getElementById('panel-progress-label');
const taskListEl   = document.getElementById('task-list');
const closeBtn     = document.getElementById('panel-close-btn');

const authForm     = document.getElementById('auth-form');
const authEmail    = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authError    = document.getElementById('auth-error');
const authGoogleBtn= document.getElementById('auth-google-btn');

const panelFooter  = document.getElementById('panel-footer');
const addTaskForm  = document.getElementById('add-task-form');
const addTaskInput = document.getElementById('add-task-input');
const logoutBtn    = document.getElementById('logout-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');

// ── Theme Init ───────────────────────────────────────────────
let isLightMode = localStorage.getItem('focusbook_theme') === 'light';
if (isLightMode) {
  document.body.classList.add('light-theme');
  themeToggleBtn.textContent = '🌙';
}

themeToggleBtn.addEventListener('click', () => {
  isLightMode = !isLightMode;
  if (isLightMode) {
    document.body.classList.add('light-theme');
    themeToggleBtn.textContent = '🌙';
    localStorage.setItem('focusbook_theme', 'light');
  } else {
    document.body.classList.remove('light-theme');
    themeToggleBtn.textContent = '☀️';
    localStorage.setItem('focusbook_theme', 'dark');
  }
});

// ── State ────────────────────────────────────────────────────
let currentTasks   = [];
let todayStr       = '';
let unsubscribeTasks = null;
let isExpanded     = false;
let currentUser    = null;
let expandedTaskId = null;
let currentAddPriority = 'low';
let isRecurringMode = false;

const prioritySelector = document.getElementById('add-priority-selector');
const recurringSelector = document.getElementById('add-recurring-selector');
const recurringToggleBtn = document.getElementById('recurring-toggle-btn');
const recurDaysInput = document.getElementById('recur-days-input');

if (prioritySelector) {
  prioritySelector.addEventListener('click', (e) => {
    if (e.target.classList.contains('prio-dot')) {
      document.querySelectorAll('.add-priority-selector .prio-dot').forEach(d => d.classList.remove('selected'));
      e.target.classList.add('selected');
      currentAddPriority = e.target.dataset.p;
    }
  });
}

if (recurringToggleBtn) {
  recurringToggleBtn.addEventListener('click', () => {
    isRecurringMode = !isRecurringMode;
    if (isRecurringMode) {
      prioritySelector.style.display = 'none';
      recurringSelector.style.display = 'flex';
      recurringToggleBtn.classList.add('active');
      addTaskInput.placeholder = 'Add recurring task...';
    } else {
      prioritySelector.style.display = 'flex';
      recurringSelector.style.display = 'none';
      recurringToggleBtn.classList.remove('active');
      addTaskInput.placeholder = 'Add a new task...';
    }
  });
}

// ── Expand / Collapse ────────────────────────────────────────
function expandWidget() {
  if (isExpanded) return;
  isExpanded = true;
  window.overlayAPI.expand();
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
  setTimeout(() => {
    document.body.classList.remove('expanded');
    document.body.classList.add('collapsed');
    window.overlayAPI.collapse();
  }, 300);
}

// ── Click & Drag Logic ───────────────────────────────────────
let clickOffset = { x: 0, y: 0 };
let isDragging = false;
let hasMoved = false;
let dragStartScreen = { x: 0, y: 0 };

widgetBtn.addEventListener('pointerdown', (e) => {
  if (isExpanded) return;
  clickOffset = { x: e.clientX, y: e.clientY };
  dragStartScreen = { x: e.screenX, y: e.screenY };
  isDragging = true;
  hasMoved = false;
  widgetBtn.style.transition = 'none';
  widgetBtn.setPointerCapture(e.pointerId);
});

window.addEventListener('pointermove', (e) => {
  if (!isDragging || isExpanded) return;
  const dx = e.screenX - dragStartScreen.x;
  const dy = e.screenY - dragStartScreen.y;
  if (!hasMoved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
  hasMoved = true;
  const newScreenX = e.screenX - clickOffset.x;
  const newScreenY = e.screenY - clickOffset.y;
  window.overlayAPI.drag(newScreenX, newScreenY);
});

window.addEventListener('pointerup', (e) => {
  if (!isDragging) return;
  isDragging = false;
  widgetBtn.style.transition = '';
  widgetBtn.releasePointerCapture(e.pointerId);
  if (!hasMoved) {
    if (!isExpanded) expandWidget();
  } else {
    window.overlayAPI.snap();
  }
});

closeBtn.addEventListener('click', collapseWidget);

let leaveTimer = null;
widgetPanel.addEventListener('mouseleave', () => {
  leaveTimer = setTimeout(collapseWidget, 900);
});
widgetPanel.addEventListener('mouseenter', () => {
  clearTimeout(leaveTimer);
});

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

// ── Firebase Auth ────────────────────────────────────────────
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.textContent = '';
  const email = authEmail.value;
  const password = authPassword.value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    authError.textContent = err.message;
  }
});

authGoogleBtn.addEventListener('click', async () => {
  authError.textContent = '';
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  } catch (err) {
    authError.textContent = err.message;
  }
});

logoutBtn.addEventListener('click', () => {
  signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    // Logged in
    authForm.style.display = 'none';
    panelFooter.style.display = 'flex';
    setStatus('Loading tasks...');
    
    const { tasksRef } = getUserRefs(user.uid);
    unsubscribeTasks = onSnapshot(tasksRef, (snapshot) => {
      const loadedTasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      renderTasks(loadedTasks);
    }, (err) => {
      console.error(err);
      setStatus('Failed to load tasks. You might be offline.');
    });
  } else {
    // Logged out
    if (unsubscribeTasks) {
      unsubscribeTasks();
      unsubscribeTasks = null;
    }
    currentTasks = [];
    taskListEl.innerHTML = '';
    iconBadge.style.display = 'none';
    panelProgressWrap.style.display = 'none';
    panelFooter.style.display = 'none';
    
    panelStatus.classList.remove('hidden');
    document.getElementById('status-spinner').style.display = 'none';
    panelStatusTxt.innerHTML = 'Welcome! Please log in.';
    authForm.style.display = 'flex';
  }
});

// ── Add Task ─────────────────────────────────────────────────
addTaskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser) return;
  const taskName = addTaskInput.value.trim();
  if (!taskName) return;

  let newTask;
  if (isRecurringMode) {
    const days = Math.max(1, Math.min(365, parseInt(recurDaysInput.value, 10) || 7));
    newTask = {
      id: crypto.randomUUID(),
      name: taskName,
      recurring: true,
      recurDays: days,
      recurStartDate: getTodayStr(),
      recurDoneByDate: {},
      created: Date.now()
    };
  } else {
    newTask = {
      id: crypto.randomUUID(),
      name: taskName,
      priority: currentAddPriority,
      schedule: 'date',
      date: getTodayStr(),
      done: false,
      created: Date.now()
    };
  }

  const { tasksRef } = getUserRefs(currentUser.uid);
  try {
    addTaskInput.value = '';
    await setDoc(doc(tasksRef, newTask.id), newTask);
  } catch (err) {
    console.error('Failed to add task:', err);
  }
});

// ── Helpers for recurring tasks ───────────────────────────────
function daysBetween(dateStrA, dateStrB) {
  const a = new Date(dateStrA);
  const b = new Date(dateStrB);
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

function isRecurringActive(task, today) {
  if (!task.recurring || !task.recurStartDate) return false;
  const elapsed = daysBetween(task.recurStartDate, today);
  return elapsed >= 0 && elapsed < task.recurDays;
}

// ── Render tasks ─────────────────────────────────────────────
function renderTasks(tasks) {
  todayStr = getTodayStr();

  // Split into recurring (active today) and regular (today's date)
  const recurringTasks = tasks
    .filter(t => isRecurringActive(t, todayStr))
    .sort((a, b) => (a.created || 0) - (b.created || 0));

  const regularTasks = tasks
    .filter(t => !t.recurring && t.date === todayStr)
    .sort((a, b) => {
      const pd = priorityOrder(a.priority) - priorityOrder(b.priority);
      return pd !== 0 ? pd : (a.sortOrder || a.created || 0) - (b.sortOrder || b.created || 0);
    });

  currentTasks = tasks; // store all tasks so snapshot re-renders work

  // Count for badge & progress (combine both)
  const allVisible = [
    ...regularTasks,
    ...recurringTasks
  ];
  const doneCount = (
    regularTasks.filter(t => t.done).length +
    recurringTasks.filter(t => (t.recurDoneByDate || {})[todayStr]).length
  );
  const totalCount = allVisible.length;

  panelDate.textContent = formatDate(todayStr);
  panelCount.textContent = `${doneCount}/${totalCount} done`;

  const remaining = totalCount - doneCount;
  if (remaining > 0) {
    iconBadge.style.display = 'flex';
    iconBadge.textContent = remaining > 9 ? '9+' : remaining;
  } else {
    iconBadge.style.display = 'none';
  }

  if (totalCount > 0) {
    panelProgressWrap.style.display = 'flex';
    const pct = Math.round(doneCount / totalCount * 100);
    panelProgressFill.style.width = pct + '%';
    panelProgressLabel.textContent = pct + '%';
  } else {
    panelProgressWrap.style.display = 'none';
  }

  taskListEl.innerHTML = '';

  if (allVisible.length === 0) {
    setStatus('🎉 No tasks for today!<br>Add one below.');
    return;
  }

  setStatus(null);
  let animDelay = 0;

  // ── Regular tasks (grouped by priority) ──
  if (regularTasks.length > 0) {
    const groups = { high: [], med: [], low: [] };
    regularTasks.forEach(t => {
      const key = t.priority === 'medium' ? 'med' : (t.priority || 'low');
      const g = groups[key] || groups.low;
      g.push(t);
    });

    const labels = { high: 'High Priority', med: 'Medium', low: 'Low' };

    Object.entries(groups).forEach(([priority, items]) => {
      if (!items.length) return;

      const header = document.createElement('div');
      header.className = 'w-group-header';
      header.textContent = labels[priority];
      taskListEl.appendChild(header);

      items.forEach(task => {
        taskListEl.appendChild(buildRegularTaskRow(task, priority, animDelay));
        animDelay += 40;
      });
    });
  }

  // ── Recurring tasks section ──
  if (recurringTasks.length > 0) {
    const recurHeader = document.createElement('div');
    recurHeader.className = 'w-group-header w-group-header-recurring';
    recurHeader.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.7"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> Recurring`;
    taskListEl.appendChild(recurHeader);

    recurringTasks.forEach(task => {
      taskListEl.appendChild(buildRecurringTaskRow(task, animDelay));
      animDelay += 40;
    });
  }
}

// ── Build a regular task row ──────────────────────────────────
function buildRegularTaskRow(task, priority, animDelay) {
  const isTaskExpanded = task.id === expandedTaskId;
  const row = document.createElement('div');
  row.className = 'w-task' + (task.done ? ' done' : '') + (isTaskExpanded ? ' expanded' : '');
  row.style.animationDelay = animDelay + 'ms';

  const subCount = Array.isArray(task.subItems) ? task.subItems.length : 0;
  const doneSubCount = Array.isArray(task.subItems) ? task.subItems.filter(s => s.done).length : 0;

  
  let subPreviewHtml = '';
  if (subCount > 0 && !isTaskExpanded) {
    const previewItems = task.subItems.slice(0, 2);
    subPreviewHtml = `
      <div class="w-subtask-preview" style="font-size: 11px; color: rgba(255,255,255,0.4); padding-left: 22px; margin-top: -6px; padding-bottom: 6px; pointer-events: none;">
        ${previewItems.map(s => `<div>${s.done ? '<s>' : ''}• ${escHtml(s.text)}${s.done ? '</s>' : ''}</div>`).join('')}
        ${subCount > 2 ? `<div style="font-size: 10px; margin-top: 2px;">+ ${subCount - 2} more</div>` : ''}
      </div>
    `;
  }

  row.innerHTML = `
    <div class="w-task-main-row" style="padding-bottom: ${subCount > 0 && !isTaskExpanded ? '8px' : '0'}">
      <div class="w-priority-dot ${priority}" title="Cycle Priority"></div>
      <span class="w-task-title" title="${escHtml(task.name)}">${escHtml(task.name)}</span>
      <div class="w-row-actions">
        <div class="w-icon-btn edit-btn" title="Rename task">✏️</div>
        <div class="w-icon-btn del-btn" title="Delete task">🗑️</div>
      </div>
      <div class="w-check" data-id="${task.id}" title="${task.done ? 'Mark incomplete' : 'Mark done'}">
        ${task.done ? checkmarkSvg() : ''}
      </div>
    </div>
    ${subPreviewHtml}
  `;

  const mainRow = row.querySelector('.w-task-main-row');

  // Rename
  row.querySelector('.edit-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    mainRow.innerHTML = '';
    const editInput = document.createElement('input');
    editInput.className = 'add-subtask-input';
    editInput.style.flex = '1';
    editInput.style.marginTop = '0';
    editInput.value = task.name;
    const saveBtn = document.createElement('button');
    saveBtn.className = 'w-action-btn';
    saveBtn.textContent = 'Save';
    const doSave = async () => {
      const newName = editInput.value.trim();
      if (newName) {
        task.name = newName;
        renderTasks(currentTasks);
        const { tasksRef } = getUserRefs(currentUser.uid);
        await setDoc(doc(tasksRef, task.id), { name: task.name }, { merge: true });
      }
    };
    saveBtn.addEventListener('click', (ev) => { ev.stopPropagation(); doSave(); });
    editInput.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.stopPropagation(); doSave(); } });
    editInput.addEventListener('click', ev => ev.stopPropagation());
    mainRow.appendChild(editInput);
    mainRow.appendChild(saveBtn);
    editInput.focus();
  });

  // Delete
  const delBtn = row.querySelector('.del-btn');
  let confirmDelete = false;
  delBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!confirmDelete) {
      confirmDelete = true;
      delBtn.innerHTML = '⚠️';
      setTimeout(() => { if (confirmDelete) { confirmDelete = false; delBtn.innerHTML = '🗑️'; } }, 3000);
    } else {
      const { tasksRef } = getUserRefs(currentUser.uid);
      await deleteDoc(doc(tasksRef, task.id));
    }
  });

  // Expanded details (subtasks + area)
  if (isTaskExpanded) {
    const details = document.createElement('div');
    details.className = 'w-task-details';

    const areaBadge = document.createElement('div');
    areaBadge.className = 'w-task-area-badge';
    areaBadge.textContent = task.area || 'No Area';
    areaBadge.addEventListener('click', async (e) => {
      e.stopPropagation();
      const areaWrap = document.createElement('div');
      areaWrap.style.cssText = 'display:flex;gap:4px;margin-top:6px';
      const areaInput = document.createElement('input');
      areaInput.className = 'add-subtask-input';
      areaInput.style.cssText = 'margin-top:0;flex:1';
      areaInput.value = task.area || '';
      areaInput.placeholder = 'Area name...';
      const saveAreaBtn = document.createElement('button');
      saveAreaBtn.className = 'w-action-btn';
      saveAreaBtn.textContent = 'OK';
      const doSaveArea = async () => {
        const newArea = areaInput.value.trim();
        task.area = newArea;
        renderTasks(currentTasks);
        const { tasksRef } = getUserRefs(currentUser.uid);
        await setDoc(doc(tasksRef, task.id), { area: newArea }, { merge: true });
      };
      saveAreaBtn.addEventListener('click', (ev) => { ev.stopPropagation(); doSaveArea(); });
      areaInput.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.stopPropagation(); doSaveArea(); } });
      areaInput.addEventListener('click', ev => ev.stopPropagation());
      areaBadge.replaceWith(areaWrap);
      areaWrap.appendChild(areaInput);
      areaWrap.appendChild(saveAreaBtn);
      areaInput.focus();
    });
    details.appendChild(areaBadge);

    if (task.subItems) {
      task.subItems.forEach((sub, sIdx) => {
        const sRow = document.createElement('div');
        sRow.className = 'w-subtask' + (sub.done ? ' done' : '');
        sRow.innerHTML = `
          <div class="w-sub-check">${sub.done ? checkmarkSvg() : ''}</div>
          <span class="w-sub-title" style="flex:1">${escHtml(sub.name)}</span>
          <div class="w-sub-del" title="Delete subtask">✕</div>
        `;
        sRow.addEventListener('click', async (e) => {
          if (e.target.closest('.w-sub-del')) return;
          e.stopPropagation();
          sub.done = !sub.done;
          renderTasks(currentTasks);
          const { tasksRef } = getUserRefs(currentUser.uid);
          await setDoc(doc(tasksRef, task.id), { subItems: task.subItems }, { merge: true });
        });
        sRow.querySelector('.w-sub-del').addEventListener('click', async (e) => {
          e.stopPropagation();
          task.subItems.splice(sIdx, 1);
          renderTasks(currentTasks);
          const { tasksRef } = getUserRefs(currentUser.uid);
          await setDoc(doc(tasksRef, task.id), { subItems: task.subItems }, { merge: true });
        });
        details.appendChild(sRow);
      });
    }

    const addSubInput = document.createElement('input');
    addSubInput.className = 'add-subtask-input';
    addSubInput.placeholder = 'Add subtask...';
    addSubInput.addEventListener('click', e => e.stopPropagation());
    addSubInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = addSubInput.value.trim();
        if (val) {
          if (!task.subItems) task.subItems = [];
          task.subItems.push({ name: val, done: false, type: 'checkbox' });
          renderTasks(currentTasks);
          const { tasksRef } = getUserRefs(currentUser.uid);
          await setDoc(doc(tasksRef, task.id), { subItems: task.subItems }, { merge: true });
        }
      }
    });
    details.appendChild(addSubInput);
    row.appendChild(details);
  }

  // Cycle priority
  row.querySelector('.w-priority-dot').addEventListener('click', async (e) => {
    e.stopPropagation();
    const cycle = { 'high': 'med', 'med': 'low', 'low': 'high', 'medium': 'low' };
    const newPri = cycle[task.priority] || 'low';
    task.priority = newPri === 'med' ? 'medium' : newPri;
    renderTasks(currentTasks);
    const { tasksRef } = getUserRefs(currentUser.uid);
    await setDoc(doc(tasksRef, task.id), { priority: task.priority }, { merge: true });
  });

  // Toggle done
  row.querySelector('.w-check').addEventListener('click', async (e) => {
    e.stopPropagation();
    await toggleTask(task);
  });

  // Expand
  row.querySelector('.w-task-main-row').addEventListener('click', (e) => {
    if (e.target.classList.contains('w-priority-dot') || e.target.closest('.w-check')) return;
    expandedTaskId = isTaskExpanded ? null : task.id;
    renderTasks(currentTasks);
  });

  return row;
}

// ── Build a recurring task row ────────────────────────────────
function buildRecurringTaskRow(task, animDelay) {
  const isDoneToday = !!(task.recurDoneByDate || {})[todayStr];
  const elapsed = daysBetween(task.recurStartDate, todayStr);
  const dayNum = elapsed + 1; // 1-indexed
  const totalDays = task.recurDays;

  const row = document.createElement('div');
  row.className = 'w-task w-task-recurring' + (isDoneToday ? ' done' : '');
  row.style.animationDelay = animDelay + 'ms';

  row.innerHTML = `
    <div class="w-task-main-row">
      <div class="w-recur-icon" title="Recurring task">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 2l4 4-4 4"/>
          <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
          <path d="M7 22l-4-4 4-4"/>
          <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        </svg>
      </div>
      <span class="w-task-title" title="${escHtml(task.name)}">${escHtml(task.name)}</span>
      <span class="w-recur-badge" title="Day ${dayNum} of ${totalDays}">Day ${dayNum}/${totalDays}</span>
      <div class="w-row-actions">
        <div class="w-icon-btn edit-recur-btn" title="Rename task">✏️</div>
        <div class="w-icon-btn del-recur-btn" title="Delete recurring task">🗑️</div>
      </div>
      <div class="w-check" title="${isDoneToday ? 'Mark incomplete' : 'Mark done'}">
        ${isDoneToday ? checkmarkSvg() : ''}
      </div>
    </div>
  `;

  const mainRow = row.querySelector('.w-task-main-row');

  // Rename recurring task
  row.querySelector('.edit-recur-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    mainRow.innerHTML = '';
    const editInput = document.createElement('input');
    editInput.className = 'add-subtask-input';
    editInput.style.flex = '1';
    editInput.style.marginTop = '0';
    editInput.value = task.name;
    const saveBtn = document.createElement('button');
    saveBtn.className = 'w-action-btn';
    saveBtn.textContent = 'Save';
    const doSave = async () => {
      const newName = editInput.value.trim();
      if (newName) {
        task.name = newName;
        renderTasks(currentTasks);
        const { tasksRef } = getUserRefs(currentUser.uid);
        await setDoc(doc(tasksRef, task.id), { name: task.name }, { merge: true });
      }
    };
    saveBtn.addEventListener('click', (ev) => { ev.stopPropagation(); doSave(); });
    editInput.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.stopPropagation(); doSave(); } });
    editInput.addEventListener('click', ev => ev.stopPropagation());
    mainRow.appendChild(editInput);
    mainRow.appendChild(saveBtn);
    editInput.focus();
  });

  // Delete recurring task
  const delBtn = row.querySelector('.del-recur-btn');
  let confirmDelete = false;
  delBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!confirmDelete) {
      confirmDelete = true;
      delBtn.innerHTML = '⚠️';
      setTimeout(() => { if (confirmDelete) { confirmDelete = false; delBtn.innerHTML = '🗑️'; } }, 3000);
    } else {
      const { tasksRef } = getUserRefs(currentUser.uid);
      await deleteDoc(doc(tasksRef, task.id));
    }
  });

  // Toggle done for today
  row.querySelector('.w-check').addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!currentUser) return;
    const recurDoneByDate = { ...(task.recurDoneByDate || {}) };
    if (isDoneToday) {
      delete recurDoneByDate[todayStr];
    } else {
      recurDoneByDate[todayStr] = true;
    }
    task.recurDoneByDate = recurDoneByDate;
    renderTasks(currentTasks);
    const { tasksRef } = getUserRefs(currentUser.uid);
    await setDoc(doc(tasksRef, task.id), { recurDoneByDate }, { merge: true });
  });

  return row;
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

async function toggleTask(task) {
  if (!currentUser) return;
  const newDone = !task.done;
  
  // Optimistic UI update
  task.done = newDone;
  if (newDone && Array.isArray(task.subItems) && task.subItems.length > 0) {
    task.subItems = task.subItems.map(s => ({ ...s, done: true }));
  }
  
  // The onSnapshot listener will quickly overwrite our optimistic UI,
  // but it makes the click feel instant.
  renderTasks(currentTasks);

  const { tasksRef } = getUserRefs(currentUser.uid);
  try {
    await setDoc(doc(tasksRef, task.id), task, { merge: true });
  } catch (err) {
    console.error('Failed to update task:', err);
  }
}

function setStatus(html) {
  if (html) {
    panelStatus.classList.remove('hidden');
    panelStatusTxt.innerHTML = html;
    const spinner = document.getElementById('status-spinner');
    if (spinner) spinner.style.display = 'none';
    taskListEl.innerHTML = '';
  } else {
    panelStatus.classList.add('hidden');
  }
}

document.body.classList.add('collapsed');

setInterval(() => {
  const newToday = getTodayStr();
  if (newToday !== todayStr) {
    todayStr = newToday;
    if (currentUser) {
      renderTasks(currentTasks);
    }
  }
}, 60 * 1000);
