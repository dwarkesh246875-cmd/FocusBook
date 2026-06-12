import React from 'react';
import { useStore } from '../services/store';

export function Tabs({ activeTab, setActiveTab }) {
  const { tasks } = useStore();
  const todayStr = (() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const rem = tasks.filter(t => t.date === todayStr && !t.done).length;

  return (
    <nav className="tab-nav" role="tablist">
      <button className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`} role="tab" aria-selected={activeTab === 'today'} onClick={() => setActiveTab('today')}>
        <svg className="tab-icon" width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M9 5.5V9l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span className="tab-label">Today</span>
        <span className="tab-count" style={{ display: rem > 0 ? 'flex' : 'none' }}>{rem}</span>
      </button>
      <button className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`} role="tab" aria-selected={activeTab === 'upcoming'} onClick={() => setActiveTab('upcoming')}>
        <svg className="tab-icon" width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2.5" y="4" width="13" height="11.5" rx="2" stroke="currentColor" strokeWidth="1.5"/><line x1="6" y1="2" x2="6" y2="6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><line x1="5" y1="10" x2="13" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="5" y1="13" x2="10" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        <span className="tab-label">Upcoming</span>
      </button>
      <button className={`tab-btn ${activeTab === 'someday' ? 'active' : ''}`} role="tab" aria-selected={activeTab === 'someday'} onClick={() => setActiveTab('someday')}>
        <svg className="tab-icon" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2a7 7 0 1 1 0 14A7 7 0 0 1 9 2z" stroke="currentColor" strokeWidth="1.5"/><circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.2"/><line x1="9" y1="2" x2="9" y2="6.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><line x1="9" y1="11.5" x2="9" y2="16" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
        <span className="tab-label">Someday</span>
      </button>
    </nav>
  );
}
