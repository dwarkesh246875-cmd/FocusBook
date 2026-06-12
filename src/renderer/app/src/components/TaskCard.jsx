import React, { useState } from 'react';
import { useStore, getSystemDate, todayStr as getTodayStr } from '../services/store';

export function TaskCard({ task, onDragStart, onDragEnd, onDragOver, onDrop, onEditTask }) {
  const { toggleTask, toggleSubItem, deleteTask, updateTask } = useStore();
  const [subItemsOpen, setSubItemsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDraggable, setIsDraggable] = useState(false);

  const priorityLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
  const areaLabel = task.area ? task.area.charAt(0).toUpperCase() + task.area.slice(1) : 'Client';

  const subItems = task.subItems || [];
  const doneSubCount = subItems.filter(s => s.done).length;

  const handleDelete = () => {
    if (window.confirm('Delete this task?')) {
      setIsDeleting(true);
      setTimeout(() => deleteTask(task.id), 300); // Wait for CSS transition
    }
  };

  const getDaysCarried = (orig, cur) => {
    if (!orig || !cur) return 0;
    const d1 = new Date(orig);
    const d2 = new Date(cur);
    return Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
  };

  const daysCarried = getDaysCarried(task.originalDate, task.date);
  
  const diffDaysFromToday = (() => {
    if (!task.originalDate) return 0;
    const d1 = new Date(task.originalDate);
    const d2 = new Date(getTodayStr());
    return Math.max(0, Math.round((d2.getTime() - d1.getTime()) / 86400000));
  })();
  
  const isPenalty = diffDaysFromToday >= 5 && !task.done;
  const isRottingSoon = diffDaysFromToday >= 3 && diffDaysFromToday < 5 && !task.done;
  const daysLeft = 5 - diffDaysFromToday;

  const triggerXPPop = (e, xpAmt) => {
    let el = document.getElementById('xp-pop');
    if (!el) {
      el = document.createElement('div');
      el.id = 'xp-pop';
      el.className = 'xp-pop';
      document.body.appendChild(el);
    }
    el.textContent = `+${xpAmt} XP`;
    el.style.left = `${e.clientX - 20}px`;
    el.style.top = `${e.clientY - 40}px`;
    el.classList.remove('animate');
    void el.offsetWidth;
    el.classList.add('animate');
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    const wasDone = task.done;
    toggleTask(task.id);
    if (!wasDone) {
      const xp = task.priority === 'high' ? 100 : task.priority === 'medium' ? 60 : 30;
      triggerXPPop(e, xp);
    }
  };

  if (isDeleting) {
    return <div style={{ height: 0, opacity: 0, overflow: 'hidden', transition: 'all 0.3s ease' }}></div>;
  }

  return (
    <div
      className="task-card"
      data-priority={task.priority}
      data-done={String(task.done)}
      data-id={task.id}
      draggable={isDraggable}
      onDragStart={e => { if (isDraggable && onDragStart) onDragStart(e, task); else e.preventDefault(); }}
      onDragEnd={onDragEnd}
      onDragOver={e => { if (onDragOver) onDragOver(e, task); }}
      onDrop={e => { if (onDrop) onDrop(e, task.id); }}
    >
      {task.originalDate && task.originalDate !== task.date && (
        <div className="task-carried-badge" title={`Carried over ${daysCarried} day${daysCarried !== 1 ? 's' : ''}`}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
          {daysCarried}d
        </div>
      )}
      <div className="task-card-main" onClick={handleToggle} onContextMenu={(e) => { e.preventDefault(); handleDelete(); }}>
        <div
          className="drag-handle"
          title="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={() => setIsDraggable(true)}
          onMouseUp={() => setIsDraggable(false)}
          onMouseLeave={() => setIsDraggable(false)}
          onTouchStart={() => setIsDraggable(true)}
          onTouchEnd={() => setIsDraggable(false)}
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
            <circle cx="3" cy="3" r="1.5" fill="currentColor" />
            <circle cx="3" cy="8" r="1.5" fill="currentColor" />
            <circle cx="3" cy="13" r="1.5" fill="currentColor" />
            <circle cx="7" cy="3" r="1.5" fill="currentColor" />
            <circle cx="7" cy="8" r="1.5" fill="currentColor" />
            <circle cx="7" cy="13" r="1.5" fill="currentColor" />
          </svg>
        </div>
        <div className="task-check" onClick={handleToggle}>
          <svg className="task-check-svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="var(--page-bg)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="task-body">
          <p className="task-name">{task.name}</p>
          <div className="task-meta">
            <span className={`badge badge-${task.priority}`}>{priorityLabel}</span>
            {task.area && <span className={`badge badge-${task.area}`}>{areaLabel}</span>}
            
            {isPenalty && (
              <span className="badge" style={{ background: 'var(--high-bg)', color: 'var(--high-color)', border: '1px solid var(--high-color)' }}>
                -1 Streak/Day
              </span>
            )}
            {isRottingSoon && (
              <span className="badge" style={{ background: 'var(--med-bg)', color: 'var(--med-color)', border: '1px solid var(--med-color)' }}>
                ⚠️ Penalty in {daysLeft}d
              </span>
            )}

            {subItems.length > 0 && (
              <span style={{ fontFamily: 'Caveat, cursive', fontSize: 12, color: 'var(--ink-faint)', marginLeft: 2 }}>
                ▸ {doneSubCount}/{subItems.length}
              </span>
            )}
          </div>
          {subItems.length > 0 && (
            <button
              className={`task-subitems-toggle ${subItemsOpen ? 'open' : ''}`}
              aria-label="Toggle sub-items"
              onClick={(e) => { e.stopPropagation(); setSubItemsOpen(!subItemsOpen); }}
            >
              <svg className="task-subitems-toggle-arrow" width="14" height="14" viewBox="0 0 10 10" fill="none">
                <path d="M2 3l3 4 3-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {subItems.length} sub-item{subItems.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
        <div className="task-actions" onClick={e => e.stopPropagation()}>
          <button className="task-action-btn edit" aria-label="Edit task" title="Edit task" onClick={(e) => { e.stopPropagation(); if (onEditTask) onEditTask(); }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9.5 2.5l2 2-6.5 6.5H3v-2L9.5 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="task-action-btn" onClick={handleDelete}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
      {subItems.length > 0 && (
        <div className={`task-subitems-list ${subItemsOpen ? 'open' : ''}`}>
          {subItems.map(s => (
            <div key={s.id} className={`task-subitem ${s.done ? 'done' : ''}`}>
              <button className="task-subitem-check" aria-label="Toggle sub-item" onClick={async (e) => {
                e.stopPropagation();
                const becameDone = await toggleSubItem(task.id, s.id);
                if (becameDone) {
                  const xp = task.priority === 'high' ? 100 : task.priority === 'medium' ? 60 : 30;
                  triggerXPPop(e, xp);
                }
              }}>
                {s.done && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="var(--page-bg)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </button>
              <span className="task-subitem-name">{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
