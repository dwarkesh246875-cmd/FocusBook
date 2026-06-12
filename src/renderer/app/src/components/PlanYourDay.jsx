import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../services/store';

export function PlanYourDay({ isOpen, onClose }) {
  const { tasks, addTask, updateTask, addXP } = useStore();
  
  const [screen, setScreen] = useState('dump'); // 'dump', 'prio', 'commit'
  const [dumped, setDumped] = useState([]);
  const [rapidInput, setRapidInput] = useState('');
  const [cardIdx, setCardIdx] = useState(0);
  const [prioritised, setPrioritised] = useState([]);
  const [pydSaving, setPydSaving] = useState(false);

  // Encouragement messages
  const ENCOURAGE = [
    'A start is a start.',
    'Two tasks — building momentum.',
    'Three! The day is taking shape.',
    'Four tasks — solid foundation.',
    'Five tasks. That\'s a full day.',
    'Six — you mean business.',
    'Seven tasks — on fire 🔥',
  ];
  const encourageText = dumped.length <= ENCOURAGE.length 
    ? ENCOURAGE[dumped.length - 1] 
    : `${dumped.length} tasks — let's go!`;

  // Greetings
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good morning.';
    if (h >= 12 && h < 17) return 'Good afternoon.';
    if (h >= 17 && h < 21) return 'Good evening.';
    return 'Working late?';
  };
  
  const getDaySubtitle = () => {
    const d = new Date();
    const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const MOS  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${DAYS[d.getDay()]}, ${MOS[d.getMonth()]} ${d.getDate()} — let's make it count.`;
  };

  const todayStr = (() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();

  useEffect(() => {
    if (isOpen) {
      const carryOvers = tasks.filter(t => !t.done && t.date && t.date < todayStr);
      setScreen('dump');
      setDumped(carryOvers.map(t => ({ name: t.name, id: t.id, isCarryOver: true, originalDate: t.originalDate || t.date, oldTask: t })));
      setPrioritised([]);
      setCardIdx(0);
      setRapidInput('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddDump = (e) => {
    e.preventDefault();
    const name = rapidInput.trim();
    if (!name) return;
    setDumped(prev => [...prev, { name, id: `pyd_${Date.now()}_${Math.random().toString(36).slice(2,6)}` }]);
    setRapidInput('');
  };

  const handleRemoveDump = (id) => {
    setDumped(prev => prev.filter(t => t.id !== id));
  };

  const startPrioritising = () => {
    if (dumped.length === 0) return;
    setPrioritised([]);
    setCardIdx(0);
    setScreen('prio');
  };

  const assignPriority = (priority) => {
    const task = dumped[cardIdx];
    if (!task) return;
    
    setPrioritised(prev => [...prev, { ...task, priority }]);
    
    if (cardIdx + 1 >= dumped.length) {
      setTimeout(() => setScreen('commit'), 380);
    } else {
      setCardIdx(prev => prev + 1);
    }
  };

  const handleCommit = async () => {
    if (pydSaving) return;
    setPydSaving(true);
    try {
      const defaultArea = 'client'; // Could load from prefs later
      for (const t of prioritised) {
        if (t.isCarryOver) {
          await updateTask(t.id, {
            date: todayStr,
            priority: t.priority,
            schedule: 'date',
            originalDate: t.originalDate,
            carriedFrom: [...(t.oldTask.carriedFrom || []), t.oldTask.date]
          });
        } else {
          await addTask({
            name: t.name,
            priority: t.priority,
            area: defaultArea,
            schedule: 'date',
            date: todayStr,
            subItems: []
          });
        }
      }
      await addXP(25); // PLANNING_XP
      onClose();
      // Show toast ideally
    } finally {
      setPydSaving(false);
    }
  };

  const highN = prioritised.filter(t => t.priority === 'high').length;
  const potXP = prioritised.reduce((s, t) => s + (t.priority === 'high' ? 100 : t.priority === 'medium' ? 60 : 30), 0);

  return (
    <div className="pyd-overlay pyd-enter" role="dialog" aria-modal="true" aria-label="Plan your day" style={{display: 'flex'}}>
      
      {/* SCREEN 1: DUMP */}
      {screen === 'dump' && (
        <div className="pyd-screen">
          <div className="pyd-header">
            <div className="pyd-wordmark">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2C9 2 12.5 5 12.5 7.5C12.5 9.4 10.93 11 9 11C7.07 11 5.5 9.4 5.5 7.5C5.5 6 6.5 4.5 7.5 3.5C7.5 5 8.2 5.6 9 5.6C9 4 9 2 9 2Z" fill="var(--accent)" opacity=".8"/></svg>
              <span>Morning Ritual</span>
            </div>
            <button className="pyd-skip-btn" onClick={onClose}>skip →</button>
          </div>

          <div className="pyd-greeting-wrap">
            <h1 className="pyd-heading">{getGreeting()}</h1>
            <p className="pyd-subheading">{getDaySubtitle()}</p>
          </div>

          <div className="pyd-dump-section">
            <div className="pyd-dump-header">
              <span className="pyd-field-label">Brain dump</span>
              <span className="pyd-counter">{dumped.length} tasks</span>
            </div>
            <p className="pyd-dump-hint">Type a task and hit Enter — no priority needed yet</p>

            <form className="pyd-rapid-input-wrap" onSubmit={handleAddDump}>
              <input type="text" className="pyd-rapid-input" placeholder="Add a task…" maxLength="120" autoComplete="off" 
                value={rapidInput} onChange={e => setRapidInput(e.target.value)} autoFocus />
              <button type="submit" className="pyd-rapid-add-btn" aria-label="Add task">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><line x1="9" y1="3" x2="9" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </form>

            <div className="pyd-encourage" style={{opacity: dumped.length > 0 ? 1 : 0}}>{encourageText}</div>
            
            <div className="pyd-dump-list">
              {dumped.map((t, i) => (
                <div key={t.id} className="pyd-dump-item pyd-bounce-in">
                  <span className="pyd-dump-num">{i + 1}</span>
                  <span className="pyd-dump-name">{t.name}</span>
                  <button className="pyd-dump-remove" onClick={() => handleRemoveDump(t.id)}>×</button>
                </div>
              ))}
            </div>
          </div>

          <div className="pyd-dump-footer">
            <button className="pyd-next-btn" disabled={dumped.length === 0} onClick={startPrioritising}>
              <span>{dumped.length === 0 ? 'Prioritise tasks →' : `Prioritise ${dumped.length} task${dumped.length>1?'s':''} →`}</span>
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 2: PRIO */}
      {screen === 'prio' && (
        <div className="pyd-screen">
          <div className="pyd-header">
            <button className="pyd-back-btn" onClick={() => setScreen('dump')}>← back</button>
            <div className="pyd-progress-dots">
              {dumped.map((_, i) => (
                <span key={i} className={`pyd-dot ${i === cardIdx ? 'active' : ''} ${i < cardIdx ? 'done' : ''}`}></span>
              ))}
            </div>
            <span className="pyd-step-label">{cardIdx + 1} of {dumped.length}</span>
          </div>

          <div className="pyd-prioritise-wrap">
            <h2 className="pyd-prioritise-heading">How important is this?</h2>

            <div className="pyd-card-stack">
              {/* Render cards back to front */}
              {dumped.slice(cardIdx, cardIdx + 3).reverse().map((t, index, array) => {
                const isTop = index === array.length - 1;
                return (
                  <SwipeableCard key={t.id} task={t} isTop={isTop} onSwipe={(dir) => assignPriority(dir === 'left' ? 'low' : 'high')} />
                );
              })}
            </div>

            <div className="pyd-swipe-labels">
              <div className="pyd-swipe-label pyd-label-low">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                Low
              </div>
              <div className="pyd-swipe-label pyd-label-high">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7l5-5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                High
              </div>
            </div>

            <div className="pyd-priority-btns">
              <button className="pyd-prio-btn pyd-prio-low" onClick={() => assignPriority('low')}>Low<span className="pyd-prio-xp">+30 XP</span></button>
              <button className="pyd-prio-btn pyd-prio-med" onClick={() => assignPriority('medium')}>Med<span className="pyd-prio-xp">+60 XP</span></button>
              <button className="pyd-prio-btn pyd-prio-high" onClick={() => assignPriority('high')}>High<span className="pyd-prio-xp">+100 XP</span></button>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 3: COMMIT */}
      {screen === 'commit' && (
        <div className="pyd-screen">
          <div className="pyd-commit-wrap">
            <div className="pyd-commit-icon">
              <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                <circle cx="36" cy="36" r="30" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="188" strokeDashoffset="188" className="pyd-circle-anim"/>
                <path d="M22 36l9 9 19-19" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="46" strokeDashoffset="46" className="pyd-check-anim"/>
              </svg>
            </div>
            <h2 className="pyd-commit-heading">Your day is set.</h2>
            
            <div className="pyd-commit-stats">
              <div className="pyd-commit-stat"><span className="pyd-cstat-num">{prioritised.length}</span><span className="pyd-cstat-lbl">tasks</span></div>
              {highN > 0 && <div className="pyd-commit-stat"><span className="pyd-cstat-num">{highN}</span><span className="pyd-cstat-lbl">high priority</span></div>}
              <div className="pyd-commit-stat"><span className="pyd-cstat-num">{potXP}</span><span className="pyd-cstat-lbl">potential XP</span></div>
            </div>
            
            <div className="pyd-planning-xp">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polygon points="7,1 9,5 13,5.5 10,8.5 11,13 7,10.5 3,13 4,8.5 1,5.5 5,5" fill="var(--accent)"/></svg>
              +25 XP for planning your day
            </div>
            
            <button className="pyd-start-btn" onClick={handleCommit} disabled={pydSaving}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6 4l9 5-9 5V4z" fill="currentColor"/></svg>
              Start my day
            </button>
            <button className="pyd-edit-plan-btn" onClick={() => setScreen('dump')}>edit plan</button>
          </div>
        </div>
      )}

    </div>
  );
}

// Helper component for swipeable cards
function SwipeableCard({ task, isTop, onSwipe }) {
  const [drag, setDrag] = useState({ active: false, startX: 0, currentX: 0 });
  const [exitClass, setExitClass] = useState('');
  const cardRef = useRef(null);

  const handlePointerDown = (e) => {
    if (!isTop) return;
    setDrag({ active: true, startX: e.clientX || (e.touches && e.touches[0].clientX), currentX: 0 });
  };

  const handlePointerMove = (e) => {
    if (!drag.active) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const currentX = clientX - drag.startX;
    setDrag(prev => ({ ...prev, currentX }));
  };

  const handlePointerUp = () => {
    if (!drag.active) return;
    
    if (drag.currentX < -65) {
      setExitClass('pyd-exit-left');
      onSwipe('left');
    } else if (drag.currentX > 65) {
      setExitClass('pyd-exit-right');
      onSwipe('right');
    }
    
    setDrag({ active: false, startX: 0, currentX: 0 });
  };

  // Setup global event listeners when active
  useEffect(() => {
    if (drag.active) {
      document.addEventListener('mousemove', handlePointerMove);
      document.addEventListener('mouseup', handlePointerUp);
      document.addEventListener('touchmove', handlePointerMove, { passive: false });
      document.addEventListener('touchend', handlePointerUp);
      return () => {
        document.removeEventListener('mousemove', handlePointerMove);
        document.removeEventListener('mouseup', handlePointerUp);
        document.removeEventListener('touchmove', handlePointerMove);
        document.removeEventListener('touchend', handlePointerUp);
      };
    }
  }, [drag.active, drag.currentX]);

  const style = drag.active ? {
    transform: `translateX(${drag.currentX}px) rotate(${drag.currentX * 0.07}deg)`,
    transition: 'none'
  } : {
    transform: 'none',
    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
  };

  return (
    <div 
      ref={cardRef}
      className={`pyd-prio-card ${drag.active ? 'is-dragging' : ''} ${drag.currentX < -30 ? 'tilt-left' : ''} ${drag.currentX > 30 ? 'tilt-right' : ''} ${exitClass}`} 
      style={style}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
    >
      <p className="pyd-card-name">{task.name}</p>
      <p className="pyd-card-hint">swipe left = Low &nbsp;·&nbsp; right = High &nbsp;·&nbsp; or tap below</p>
    </div>
  );
}
