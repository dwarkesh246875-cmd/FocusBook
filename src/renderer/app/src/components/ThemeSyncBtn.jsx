import React, { useRef } from 'react';
import { useTheme } from '../features/theme/ThemeContext';
import { useStore } from '../services/store';

export function ThemeSyncBtn() {
  const { currentTheme, toggleSync, cycleTheme } = useTheme();
  const { syncStatus } = useStore();
  
  const holdTimer = useRef(null);
  const didLong = useRef(false);
  const ringRef = useRef(null);

  const startPress = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    didLong.current = false;
    if (ringRef.current) {
      ringRef.current.classList.remove('filling');
      void ringRef.current.offsetWidth;
      ringRef.current.classList.add('filling');
    }
    holdTimer.current = setTimeout(() => {
      didLong.current = true;
      if (ringRef.current) ringRef.current.classList.remove('filling');
      toggleSync();
    }, 600);
  };

  const endPress = () => {
    clearTimeout(holdTimer.current);
    if (ringRef.current) ringRef.current.classList.remove('filling');
    if (!didLong.current) {
      cycleTheme();
    }
    didLong.current = false;
  };

  const cancelPress = () => {
    clearTimeout(holdTimer.current);
    if (ringRef.current) ringRef.current.classList.remove('filling');
  };

  return (
    <button 
      className="theme-sync-btn" 
      id="theme-sync-btn" 
      aria-label="Theme / Sync" 
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={cancelPress}
      onContextMenu={e => e.preventDefault()}
    >
      <span className="theme-icon-wrap" id="theme-icon-wrap">
        {currentTheme === 'morning' && <svg className="t-icon" id="t-morning" width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.3"/><line x1="9" y1="1.5" x2="9" y2="3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="9" y1="15" x2="9" y2="16.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="1.5" y1="9" x2="3" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="15" y1="9" x2="16.5" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="3.4" y1="3.4" x2="4.5" y2="4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="13.5" y1="13.5" x2="14.6" y2="14.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="14.6" y1="3.4" x2="13.5" y2="4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="4.5" y1="13.5" x2="3.4" y2="14.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>}
        {currentTheme === 'midday' && <svg className="t-icon" id="t-midday" width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="4" fill="currentColor" opacity=".15"/><circle cx="9" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.5"/><line x1="9" y1="1" x2="9" y2="3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="9" y1="14.5" x2="9" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="1" y1="9" x2="3.5" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="14.5" y1="9" x2="17" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
        {currentTheme === 'golden' && <svg className="t-icon" id="t-golden" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 12 Q5 6 9 8 Q13 10 16 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="9" cy="13" r="3" stroke="currentColor" strokeWidth="1.3"/><line x1="9" y1="10" x2="9" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>}
        {currentTheme === 'night' && <svg className="t-icon" id="t-night" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M14.5 11A7 7 0 0 1 7 3.5a7 7 0 1 0 7.5 7.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><circle cx="13" cy="4" r="0.8" fill="currentColor"/><circle cx="15" cy="7" r="0.5" fill="currentColor"/></svg>}
        {currentTheme === 'midnight' && <svg className="t-icon" id="t-midnight" width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2" fill="currentColor"/><circle cx="4" cy="5" r="1" fill="currentColor"/><circle cx="14" cy="6" r="1.5" fill="currentColor"/><circle cx="12" cy="14" r="1" fill="currentColor"/><circle cx="5" cy="13" r="1" fill="currentColor"/><path d="M4 5l5 4 5-3M9 9l3 5M9 9l-4 4" stroke="currentColor" strokeWidth="1"/></svg>}
      </span>
      <span className={`sync-dot sync-${syncStatus}`} id="sync-dot"></span>
      <span className="tsb-hold-ring" id="tsb-hold-ring" ref={ringRef}></span>
    </button>
  );
}
