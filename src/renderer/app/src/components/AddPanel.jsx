import React, { useState } from 'react';
import { useStore } from '../services/store';

const ALL_AREAS_FULL = ['Client', 'Creative', 'Learning', 'Admin', 'Health', 'Personal', 'Finance', 'Social'];

export function AddPanel({ isOpen, onClose, editingTask, onEditAreas }) {
  const { addTask, updateTask, areas: storeAreas } = useStore();
  const [name, setName] = useState('');
  const [priority, setPriority] = useState('high');
  const [schedule, setSchedule] = useState('today');
  const [area, setArea] = useState('client');
  const [customDate, setCustomDate] = useState('');
  
  const [subItemInput, setSubItemInput] = useState('');
  const [subItems, setSubItems] = useState([]);

  React.useEffect(() => {
    if (isOpen && editingTask) {
      setName(editingTask.name || '');
      setPriority(editingTask.priority || 'high');
      setArea(editingTask.area || 'client');
      setSubItems(editingTask.subItems || []);
      if (editingTask.schedule === 'someday') {
        setSchedule('someday');
      } else if (editingTask.date && editingTask.date !== todayStr) {
        setSchedule('date');
        setCustomDate(editingTask.date);
      } else {
        setSchedule('today');
      }
    } else if (isOpen && !editingTask) {
      setName('');
      setPriority('high');
      setSchedule('today');
      setArea(localStorage.getItem('fb_last_area') || 'client');
      setCustomDate('');
      setSubItems([]);
    }
  }, [isOpen, editingTask]);

  const todayStr = (() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();

  const handleAddSubItem = (e) => {
    e.preventDefault();
    const val = subItemInput.trim();
    if (!val) return;
    setSubItems([...subItems, { id: crypto.randomUUID(), name: val, done: false }]);
    setSubItemInput('');
  };

  const handleRemoveSubItem = (id) => {
    setSubItems(subItems.filter(s => s.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const targetDate = schedule === 'today' ? todayStr : (schedule === 'date' ? customDate : null);

    if (editingTask) {
      updateTask(editingTask.id, {
        name: name.trim(),
        priority,
        area,
        schedule: schedule === 'someday' ? 'someday' : 'date',
        date: targetDate,
        subItems
      });
    } else {
      addTask({
        name: name.trim(),
        priority,
        area,
        schedule: schedule === 'someday' ? 'someday' : 'date',
        date: targetDate,
        subItems
      });
    }
    
    // Reset state
    setName('');
    setSubItems([]);
    setCustomDate('');
    onClose();
  };

  return (
    <>
      <div className={`panel-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose}></div>
      <div className={`add-panel ${isOpen ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Add new task" onClick={e => e.stopPropagation()}>
        <div className="panel-handle"></div>
        <h2 className="panel-title">{editingTask ? 'Edit task' : 'New task'}</h2>
        
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            className="task-input" 
            placeholder="What needs to get done?" 
            maxLength="120" 
            autoComplete="off" 
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus 
          />
          
          <div className="panel-field-group">
            <label className="panel-label">Priority</label>
            <div className="chip-row">
              <button type="button" className={`chip chip-high ${priority === 'high' ? 'active' : ''}`} onClick={() => setPriority('high')}>High — 100 XP</button>
              <button type="button" className={`chip chip-med ${priority === 'medium' ? 'active' : ''}`} onClick={() => setPriority('medium')}>Medium — 60 XP</button>
              <button type="button" className={`chip chip-low ${priority === 'low' ? 'active' : ''}`} onClick={() => setPriority('low')}>Low — 30 XP</button>
            </div>
          </div>
          
          <div className="panel-field-group">
            <div className="panel-label-row">
              <label className="panel-label">Area</label>
              <button type="button" className="panel-edit-areas-btn" aria-label="Edit areas" onClick={onEditAreas}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 1.5l2 2L4 9.5H2V7.5L8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                Edit areas
              </button>
            </div>
            <div className="chip-row">
              {ALL_AREAS_FULL.filter(a => storeAreas.includes(a.toLowerCase())).map(a => {
                const val = a.toLowerCase();
                return (
                  <button 
                    key={val} 
                    type="button" 
                    className={`chip ${area === val ? 'active' : ''}`} 
                    onClick={() => {
                      setArea(val);
                      localStorage.setItem('fb_last_area', val);
                    }}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="panel-field-group">
            <label className="panel-label">Schedule</label>
            <div className="chip-row">
              <button type="button" className={`chip ${schedule === 'today' ? 'active' : ''}`} onClick={() => setSchedule('today')}>Today</button>
              <button type="button" className={`chip ${schedule === 'date' ? 'active' : ''}`} onClick={() => setSchedule('date')}>Pick date</button>
              <button type="button" className={`chip ${schedule === 'someday' ? 'active' : ''}`} onClick={() => setSchedule('someday')}>Someday</button>
            </div>
            {schedule === 'date' && (
              <input 
                type="date" 
                className="date-input" 
                value={customDate} 
                onChange={e => setCustomDate(e.target.value)} 
                required 
              />
            )}
          </div>

          <div className="panel-field-group">
            <label className="panel-label">Sub-items <span className="panel-label-hint">(optional checklist)</span></label>
            <div className="subitem-input-row">
              <input 
                type="text" 
                className="subitem-input" 
                placeholder="Add a sub-item…" 
                maxLength="80" 
                autoComplete="off"
                value={subItemInput}
                onChange={e => setSubItemInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' ? handleAddSubItem(e) : null}
              />
              <button type="button" className="subitem-add-btn" aria-label="Add sub-item" onClick={handleAddSubItem}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            
            {subItems.length > 0 && (
              <div className="subitem-list">
                {subItems.map((sub, i) => (
                  <div key={sub.id} className="subitem-panel-item">
                    <span className="subitem-panel-num">{i + 1}</span>
                    <span className="subitem-panel-name">{sub.name}</span>
                    <button type="button" className="subitem-panel-remove" onClick={() => handleRemoveSubItem(sub.id)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="save-btn" disabled={!name.trim()}>Save task</button>
        </form>
      </div>
    </>
  );
}
