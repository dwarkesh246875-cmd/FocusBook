# FocusBook Code Map — AI Agent Directory
> **Auto-reference this file before making any changes to the codebase.**
> Last updated: 2026-06-20

## Files
| File | Purpose | Lines |
|------|---------|-------|
| `app.js` | All application logic (single file) | ~2677 |
| `style2.css` | All visual styling (single file) | ~4709 |
| `index.html` | DOM structure, overlays, panels | ~708 |

---

## app.js — Function & Feature Map

### Firebase & Auth (Lines 1–566)
| Line Range | Function/Feature | Description |
|-----------|-----------------|-------------|
| 7–17 | Firebase config | `firebaseConfig`, `firebase.initializeApp`, `db`, `auth` |
| 22–25 | `initRefs(uid)` | Sets `tasksRef` and `metaRef` for current user |
| 28–32 | `setSyncStatus(state)` | Updates sync indicator dot |
| 34–140 | **Theme Engine** | `themeMode`, `applyTheme()`, `getAutoTheme()`, `updateGradientForTime()`, `lerpColor()` |
| 142–174 | **Date/Time** | `formatDate()`, `formatTime()`, `todayStr()`, `updateClock()` |
| 176–184 | **State Variables** | `tasks[]`, `totalXP`, `streak{}`, `openSubTaskIds`, `pendingDeletes` |
| 186–206 | **Lottie Init** | `FIRE_LOTTIE_DATA`, `initLottie()` |
| 208–346 | **Fire Animation** | `getFlameFilter(count)`, `updateFireIcon(streakCount)` — flame colour/size by streak |
| 348–371 | **Cloud Helpers** | `saveTask()`, `deleteTaskCloud()`, `saveMeta()` |
| 374–434 | `startSync()` | Firestore realtime listeners for tasks and meta |
| 436–566 | **Auth Flow** | `showAuthOverlay()`, `showApp()`, `hideApp()`, Google/email/guest sign-in, `onAuthStateChanged` |

### Notifications & Onboarding (Lines 568–724)
| Line Range | Function/Feature | Description |
|-----------|-----------------|-------------|
| 573–641 | **Notifications** | `setupNotifications()`, `scheduleNotifications()` — morning 8am + evening 7pm |
| 646–724 | **Onboarding** | 5-slide walkthrough IIFE, `showOnboarding(key)` |

### Core Task Logic (Lines 727–1252)
| Line Range | Function/Feature | Description |
|-----------|-----------------|-------------|
| 728–747 | `updateStreak()` | Streak increment logic — checks if any task done today |
| 750–780 | `renderProgress()` | Progress bar, XP display, today count badge, end-of-day summary trigger |
| 783–788 | `showXPPop(amt, x, y)` | Floating "+XP" animation |
| 791 | `priorityOrder(p)` | Returns 0/1/2 for high/medium/low |
| 793–804 | **Recurring Helpers** | `daysBetween()`, `isRecurringActive()`, `isRecurringDoneToday()` |
| 806–951 | `createTaskCard(task)` | **Main task card builder** — HTML template, subtask toggles, check/edit listeners, long-press delete, swipe attachment |
| 953–1019 | `createRecurringTaskCard(task)` | Recurring task card variant |
| 1021–1109 | `renderTasks()` | **Master render** — builds Today/Upcoming/Someday lists, priority sections, recurring section |
| 1112–1144 | `toggleTask(id, event)` | **Task completion** — subtask validation guard, XP award/deduct, streak update |
| 1146–1197 | `deleteTask(id)` | **Delete with undo** — animate out, 5s undo window, then cloud delete |
| 1199–1228 | `addTask(...)` | Creates new task or recurring task, saves to Firestore |
| 1231–1262 | **Recent Updates (V2 Overhaul)** | |

1. **Calendar Day Detail** — `showDayDetail()` now correctly renders subtask lists.
2. **Delete Long-Press** — Added `window.justLongPressed` flag to prevent accidental task toggling after discarding a task via long-press.
3. **Streak Logic** — `updateStreak()` now enforces that ALL tasks must be completed without carry-over to trigger a perfect day.
4. **Fire Element** — Flame enlarged and glowing persistently.
5. **Calendar Heatmap** — Implemented GitHub-style heatmap gradient using `--heatmap-opacity` with square cells instead of dots.
6. **Camera Focus Picker** — Add panel converted into a sleek horizontal scrolling chip picker (`.camera-scroll`), blurring off-screen elements.
7. **Minimal Task Cards** — Drag handles, heavy badges, and timestamps removed/subdued.
8. **Electron API Sync** — `electronAPI.onToggleTask` now strictly enforces subtask completion before checking off main task.
10. **Dark Mode FAB** — Fixed FAB CSS so it renders perfectly readable (`--bg-elevated` background with `--ink` text) in dark mode.
11. **Long-Press & Recurring Tasks** — Increased touch `moveCancel` tolerance from 5px to 15px to make long-press deletion more reliable. Replaced the static delete button on recurring tasks with an Edit button, and implemented standard long-press-to-delete logic for them.
12. **Carried-Over Glow** — Tasks with `carriedOver: true` now get a `.task-card-carried` class that renders a pulsing yellow dot (top-right, `@keyframes carried-glow`) as a visual reminder.
| 1231–1262 | **Carryover** | `carryOver()` — moves past-due tasks to today with XP penalty |

### Tabs & Add/Edit Panel (Lines 1264–1514)
| Line Range | Function/Feature | Description |
|-----------|-----------------|-------------|
| 1265–1277 | `switchTab(name)` | Tab switching (today/upcoming/someday) |
| 1283–1346 | **Panel State** | `panelMode`, `editingTask`, `sel{}`, `panelSubItems[]`, `resetPanel()`, `renderPanelSubItems()` |
| 1349–1371 | **Sub-item Panel** | Add sub-item input + button logic, area edit button |
| 1373–1436 | **Open/Close Panel** | `openAddPanel()`, `openEditPanel(task)`, `closePanel()` |
| 1438–1477 | **Chip Listeners** | Priority/area/schedule chip selection, recurring field toggle |
| 1480–1514 | **Save/Update** | Save button handler — snapshots values, calls `addTask()` or updates `editingTask` |

### Calendar (Lines 1516–1695)
| Line Range | Function/Feature | Description |
|-----------|-----------------|-------------|
| 1518–1555 | **Calendar Toggle** | Open/close calendar overlay from streak badge |
| 1568–1583 | `buildDayMap()` | Maps tasks by date for calendar rendering |
| 1589–1664 | `renderCalendar()` | Builds calendar grid — perfect/partial/missed/streak indicators |
| 1666–1695 | `showDayDetail(ds)` | Day detail panel — shows tasks for selected day (**BUG: doesn't show subtasks**) |

### Summary & Drag-and-Drop (Lines 1697–1913)
| Line Range | Function/Feature | Description |
|-----------|-----------------|-------------|
| 1698–1726 | `showSummary()` | End-of-day completion summary overlay |
| 1734–1913 | **Drag-and-Drop** | `initTodayDragDrop()`, `performTodayReorder()` — mouse + touch reorder |

### Toast System (Lines 1915–2015)
| Line Range | Function/Feature | Description |
|-----------|-----------------|-------------|
| 1930–2010 | `showToast({...})` | Toast notification system — success/error/warning/info, undo support, hover-pause |

### Utility & Questionnaire (Lines 2012–2153)
| Line Range | Function/Feature | Description |
|-----------|-----------------|-------------|
| 2013–2015 | `escHtml(s)` | HTML escape utility |
| 2024–2153 | **Questionnaire** | Area setup IIFE — step 1 (select areas), step 2 (pick default), `applyAreaPrefs()` |

### Plan Your Day (Lines 2155–2565)
| Line Range | Function/Feature | Description |
|-----------|-----------------|-------------|
| 2160–2565 | **PYD IIFE** | Morning ritual — brain dump → swipe-to-prioritise → commit |
| 2229–2264 | `openPYD()` / `closePYD()` | Show/hide PYD overlay |
| 2268–2331 | **Rapid Entry** | `addDumpTask()`, `renderDump()`, `renumberDump()` |
| 2337–2513 | **Prioritise Screen** | Card stack, drag-to-assign, `assignPriority()`, `showCommit()` |
| 2516–2539 | **Start My Day** | Saves all prioritised tasks, awards planning XP |

### Swipe & Command Palette (Lines 2567–2677)
| Line Range | Function/Feature | Description |
|-----------|-----------------|-------------|
| 2570–2622 | `attachSwipeListeners(card, task)` | Touch swipe to complete/delete |
| 2625–2676 | **Command Palette** | Cmd+K palette IIFE |

---

## index.html — DOM Structure Map

| Line Range | Element | ID / Class |
|-----------|---------|-----------|
| 17–31 | Theme background | `.theme-environment` |
| 34–81 | Auth overlay | `#auth-overlay` |
| 85–277 | Onboarding slides | `#ob-overlay` |
| 282–309 | App header | `.app-header`, `#streak-badge`, `#user-chip`, `#theme-sync-btn` |
| 312–373 | Calendar overlay | `#cal-inline-wrap`, `#streak-hero-dash`, `#cal-grid` |
| 375–388 | Progress section | `.progress-section`, `#progress-fill`, `#xp-value` |
| 391–405 | Tab navigation | `.tab-nav`, `.tab-btn[data-tab]` |
| 408–430 | Tab panels | `#tab-today`, `#tab-upcoming`, `#tab-someday` |
| 432–438 | FAB | `#fab-add` |
| 444 | Panel overlay | `#panel-overlay` |
| 447–504 | Add/Edit panel | `#add-panel`, `#task-input`, `#priority-chips`, `#area-chips`, `#schedule-chips` |
| 506–522 | Summary overlay | `#summary-overlay` |
| 524–526 | XP pop + toasts | `#xp-pop`, `#toast-container` |
| 532–589 | Questionnaire | `#quest-overlay` |
| 595–690 | Plan Your Day | `#pyd-overlay` |
| 694–704 | Command palette | `#cmd-palette` |

---

## style2.css — Section Map

| Line Range | Section |
|-----------|---------|
| 1–87 | Light theme tokens |
| 89–150 | Dark theme tokens |
| ~150–250 | Base reset, typography |
| ~250–400 | App header, streak badge |
| ~400–600 | Progress section, tabs |
| ~600–1000 | Task cards, badges, subtasks |
| ~1000–1200 | Add panel, chips |
| ~1200–1500 | Calendar overlay |
| ~1500–1700 | Summary overlay |
| ~1700–2000 | Toast system |
| ~2000–2500 | Onboarding |
| ~2500–3200 | Plan Your Day |
| ~3200–3600 | Questionnaire |
| ~3600–4000 | Drag-and-drop, swipe |
| ~4000–4709 | Auth, misc, responsive overrides |

---


