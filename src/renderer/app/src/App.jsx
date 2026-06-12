import React from 'react';
import { useTheme } from './features/theme/ThemeContext';
import { useStore, getSystemDate, todayStr as getTodayStr } from './services/store';

import { AuthOverlay } from './components/AuthOverlay';
import { Header } from './components/Header';
import { Tabs } from './components/Tabs';
import { Fab } from './components/Fab';
import { ThemeSyncBtn } from './components/ThemeSyncBtn';
import { TaskCard } from './components/TaskCard';
import { AddPanel } from './components/AddPanel';
import { PlanYourDay } from './components/PlanYourDay';
import { Calendar } from './components/Calendar';
import { Questionnaire } from './components/Questionnaire';
import { ProgressOverlay } from './components/ProgressOverlay';
import { DevTools } from './components/DevTools';

function App() {
  const { currentTheme } = useTheme();
  const { user, tasks, syncStatus, updateTask } = useStore();
  const [activeTab, setActiveTab] = React.useState('today');
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState(null);
  const [isPYDOpen, setIsPYDOpen] = React.useState(false);
  const [isProgressOpen, setIsProgressOpen] = React.useState(false);
  const [isQuestOpen, setIsQuestOpen] = React.useState(false);

  React.useEffect(() => {
    if (!user || syncStatus !== 'synced') return;
    const todayStr = getTodayStr();
    const pydKey = `pyd_done_${todayStr}`;
    const h = getSystemDate().getHours();
    const shouldShow = h >= 5 && h < 12 
      && !localStorage.getItem(pydKey) 
      && tasks.filter(t => t.date === todayStr).length === 0;
      
    if (shouldShow) {
      setTimeout(() => setIsPYDOpen(true), 2000);
      localStorage.setItem(pydKey, '1');
    }
  }, [user, syncStatus, tasks]);

  const priorityOrder = (p) => p === 'high' ? 1 : p === 'medium' ? 2 : 3;
  const todayStr = getTodayStr();
  const todayTasks = tasks
    .filter(t => t.date === todayStr)
    .sort((a, b) => {
      const pd = priorityOrder(a.priority) - priorityOrder(b.priority);
      if (pd !== 0) return pd;
      return (a.sortOrder || a.created || 0) - (b.sortOrder || b.created || 0);
    });
  const upcomingTasks = tasks.filter(t => t.schedule === 'date' && t.date > todayStr).sort((a,b)=>a.date.localeCompare(b.date));
  const somedayTasks = tasks.filter(t => t.schedule === 'someday');

  const handleDragStart = (e, task) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    setTimeout(() => {
      e.target.classList.add('dragging');
      document.body.classList.add('drag-active');
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    document.body.classList.remove('drag-active');
    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
  };

  const handleDragOver = (e, targetTask) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Throttle DOM manipulation slightly
    const card = e.currentTarget;
    if (card.dataset.id === e.dataTransfer.getData('text/plain')) return;

    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
    const rect = card.getBoundingClientRect();
    const isAbove = e.clientY < rect.top + rect.height / 2;
    
    const indicator = document.createElement('div');
    indicator.className = 'drop-indicator';
    
    if (isAbove) {
      card.parentNode.insertBefore(indicator, card);
      card.dataset.dropTarget = 'before';
    } else {
      card.parentNode.insertBefore(indicator, card.nextSibling);
      card.dataset.dropTarget = 'after';
    }
  };

  const handleDrop = async (e, targetId) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetId) return;

    const card = e.currentTarget;
    const position = card.dataset.dropTarget || 'after';
    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());

    const draggedTask = tasks.find(t => t.id === draggedId);
    const targetTask = tasks.find(t => t.id === targetId);
    if (!draggedTask || !targetTask) return;

    const insertBefore = position === 'before';
    const newPriority = targetTask.priority;

    const reordered = todayTasks.filter(t => t.id !== draggedId);
    const targetIdx = reordered.findIndex(t => t.id === targetId);
    if (targetIdx === -1) return;
    
    const draggedCopy = { ...draggedTask, priority: newPriority };
    reordered.splice(insertBefore ? targetIdx : targetIdx + 1, 0, draggedCopy);

    for (let i = 0; i < reordered.length; i++) {
      const newOrder = (i + 1) * 1000;
      if (reordered[i].sortOrder !== newOrder || reordered[i].id === draggedId) {
        await updateTask(reordered[i].id, { sortOrder: newOrder, priority: reordered[i].id === draggedId ? newPriority : reordered[i].priority });
      }
    }
  };

  return (
    <>
      <div className="theme-environment">
        <div className="env-sun-glow"></div>
        <div className="env-stars">
          {Array(24).fill(0).map((_, i) => <div key={i} className="star"></div>)}
        </div>
      </div>

      <div className="app-main">
        {!user && <AuthOverlay />}

        <Header onOpenCal={() => setIsProgressOpen(true)} />
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className={`tab-panel ${activeTab === 'today' ? 'active' : ''}`} id="tab-today" role="tabpanel" style={{ display: activeTab === 'today' ? 'block' : 'none' }}>
          <div className="task-list" id="today-list">
            {todayTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onEditTask={() => {
                  setEditingTask(task);
                  setIsAddOpen(true);
                }}
              />
            ))}
          </div>
          
          {todayTasks.length === 0 && (
            <div className="empty-state" id="today-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none"><rect x="12" y="8" width="40" height="48" rx="4" stroke="var(--ink-faint)" strokeWidth="1.5" strokeDasharray="4 3"/><line x1="20" y1="22" x2="44" y2="22" stroke="var(--ink-faint)" strokeWidth="1.2" strokeLinecap="round"/><line x1="20" y1="30" x2="44" y2="30" stroke="var(--ink-faint)" strokeWidth="1.2" strokeLinecap="round"/><line x1="20" y1="38" x2="34" y2="38" stroke="var(--ink-faint)" strokeWidth="1.2" strokeLinecap="round"/></svg>
              <p className="empty-text">Nothing planned yet.<br/>Add your first task below.</p>
              <button className="pyd-trigger-btn" onClick={() => setIsPYDOpen(true)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2C8 2 11 5 11 7C11 8.7 9.65 10 8 10C6.35 10 5 8.7 5 7C5 5.8 5.7 4.7 6.6 3.9C6.6 5.1 7.3 5.6 8 5.6C8 4 8 2 8 2Z" fill="currentColor" opacity=".85"/></svg>
                Plan your day
              </button>
            </div>
          )}
        </main>

        <main className={`tab-panel ${activeTab === 'upcoming' ? 'active' : ''}`} id="tab-upcoming" role="tabpanel" style={{ display: activeTab === 'upcoming' ? 'block' : 'none', padding: 0 }}>
          <Calendar />
        </main>

        <main className={`tab-panel ${activeTab === 'someday' ? 'active' : ''}`} id="tab-someday" role="tabpanel" style={{ display: activeTab === 'someday' ? 'block' : 'none' }}>
          <div className="task-list">
            {somedayTasks.map(task => <TaskCard key={task.id} task={task} onEditTask={() => {
              setEditingTask(task);
              setIsAddOpen(true);
            }} />)}
          </div>
          {somedayTasks.length === 0 && (
            <div className="empty-state" id="someday-empty">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="20" stroke="var(--ink-faint)" strokeWidth="1.5" strokeDasharray="4 3"/><path d="M24 32 Q32 20 40 32 Q32 44 24 32Z" stroke="var(--ink-faint)" strokeWidth="1.2"/></svg>
              <p className="empty-text">Your someday list is empty.<br/>Drop ideas here, no pressure.</p>
            </div>
          )}
        </main>

        <Fab onClick={() => { setEditingTask(null); setIsAddOpen(true); }} />
        <ThemeSyncBtn />

        <AddPanel isOpen={isAddOpen} onClose={() => { setIsAddOpen(false); setEditingTask(null); }} editingTask={editingTask} onEditAreas={() => setIsQuestOpen(true)} />
        <PlanYourDay isOpen={isPYDOpen} onClose={() => setIsPYDOpen(false)} />
        <ProgressOverlay isOpen={isProgressOpen} onClose={() => setIsProgressOpen(false)} />
        <Questionnaire isOpen={isQuestOpen} onClose={() => setIsQuestOpen(false)} />
        <DevTools />
        <div className="toast-container" id="toast-container"></div>
      </div>
    </>
  );
}

export default App;
