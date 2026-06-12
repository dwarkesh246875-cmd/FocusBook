import React, { useState } from 'react';
import { useStore } from '../services/store';

export function Calendar() {
  const { tasks, dayMap } = useStore();
  const [calDate, setCalDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
  const calYear = calDate.getFullYear();
  const calMonth = calDate.getMonth();

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const prefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
  const mDays = Object.keys(dayMap).filter(k => k.startsWith(prefix));
  const perfect = mDays.filter(k => dayMap[k].done > 0 && dayMap[k].done === dayMap[k].total).length;
  const totDone = mDays.reduce((s, k) => s + dayMap[k].done, 0);
  const active = mDays.filter(k => dayMap[k].done > 0).length;

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const calDateStr = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const handlePrev = () => setCalDate(new Date(calYear, calMonth - 1, 1));
  const handleNext = () => setCalDate(new Date(calYear, calMonth + 1, 1));

  const renderCells = () => {
    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="cal-day cal-day-empty"></div>);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = calDateStr(calYear, calMonth, d);
      const info = dayMap[ds];

      const isToday = ds === todayStr;
      const isFuture = ds > todayStr;

      const hasCarry = info && info.hasCarryOverFrom;

      const isPerfect = info && info.done > 0 && info.done === info.total && !hasCarry;
      const isPartial = info && ((info.done > 0 && info.done < info.total) || hasCarry);
      const isMissed = info && info.total > 0 && info.done === 0 && !isFuture && !hasCarry;
      const inStreak = info && info.runningStreak > 0;

      let classes = ['cal-day'];
      if (isFuture) classes.push('cal-day-future');
      if (isToday) classes.push('cal-day-today');
      if (isPerfect) classes.push('cal-day-perfect');
      if (isPartial) classes.push('cal-day-partial');
      if (isMissed) classes.push('cal-day-missed');
      if (ds === selectedDate) classes.push('cal-day-selected');

      if (inStreak && !isFuture) {
        const pd = calDateStr(calYear, calMonth, d - 1);
        const nd = calDateStr(calYear, calMonth, d + 1);
        const pInfo = dayMap[pd], nInfo = dayMap[nd];
        const pS = pInfo && pInfo.runningStreak > 0;
        const nS = nInfo && nInfo.runningStreak > 0;
        if (pS && nS) classes.push('cal-day-streak-mid');
        else if (!pS && nS) classes.push('cal-day-streak-start');
        else if (pS && !nS) classes.push('cal-day-streak-end');
      }

      const showDot = (isPartial || isMissed) && !isPerfect;
      const hasFutureTasks = isFuture && info && info.total > 0;

      cells.push(
        <div key={d} className={classes.join(' ')} onClick={() => setSelectedDate(ds)}>
          <span className="cal-day-num">{d}</span>
          {showDot && <span className="cal-day-dot"></span>}
          {hasFutureTasks && <span className="cal-day-dot" style={{ background: 'var(--accent)' }}></span>}
        </div>
      );
    }
    return cells;
  };

  const selInfo = selectedDate ? dayMap[selectedDate] : null;
  const isSelectedFuture = selectedDate && selectedDate > todayStr;

  return (
    <div className="cal-inline-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'transparent', padding: '20px' }}>
      <div className="cal-modal-header" style={{ marginTop: 0 }}>
        <button className="cal-nav-btn" onClick={handlePrev}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <span className="cal-month-title">{MONTHS[calMonth]} {calYear}</span>
        <button className="cal-nav-btn" onClick={handleNext}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      <div className="cal-stats">
        <div className="cal-stat-chip"><span className="cal-stat-chip-num">{perfect}</span><span className="cal-stat-chip-lbl">perfect days</span></div>
        <div className="cal-stat-chip"><span className="cal-stat-chip-num">{totDone}</span><span className="cal-stat-chip-lbl">tasks done</span></div>
        <div className="cal-stat-chip"><span className="cal-stat-chip-num">{active}</span><span className="cal-stat-chip-lbl">active days</span></div>
      </div>

      <div className="cal-dow-row">
        <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
      </div>

      <div className="cal-grid">{renderCells()}</div>

      <div className="cal-legend">
        <span className="cal-legend-item"><span className="cal-legend-dot cal-leg-perfect"></span>Perfect</span>
        <span className="cal-legend-item"><span className="cal-legend-dot cal-leg-partial"></span>Partial</span>
        <span className="cal-legend-item"><span className="cal-legend-dot cal-leg-missed"></span>Missed</span>
        <span className="cal-legend-item"><span className="cal-legend-dot cal-leg-today"></span>Today</span>
      </div>

      {selectedDate && (
        <div className="cal-detail" style={{ display: 'block', marginTop: '20px', flex: 1 }}>
          <div className="cal-detail-header">
            <span className="cal-detail-title">{isSelectedFuture ? `Upcoming: ${selectedDate}` : selectedDate}</span>
            <button className="cal-detail-close" onClick={() => setSelectedDate(null)}>×</button>
          </div>
          <div className="cal-detail-tasks">
            {selInfo && selInfo.tasks.length > 0 ? selInfo.tasks.map((t, idx) => (
              <div key={`${t.id}-${idx}`} className={`cal-detail-task ${t.isGhost ? 'ghost' : ''}`}>
                <div className={`cal-detail-check ${isSelectedFuture ? '' : t.isGhost ? 'ghost' : t.done ? 'done' : 'missed'}`} style={isSelectedFuture ? { borderColor: 'var(--accent)' } : {}}>
                  {isSelectedFuture ? (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }}></div>
                  ) : t.isGhost ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                  ) : t.done ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 6.5l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                  )}
                </div>
                <span className={`cal-detail-task-name ${isSelectedFuture ? '' : t.isGhost ? 'ghost' : t.done ? 'done' : ''}`}>{t.name}</span>
              </div>
            )) : <div style={{ fontFamily: "'Caveat', cursive", color: "var(--ink-faint)", padding: '10px 0' }}>No tasks planned for this day</div>}
          </div>
        </div>
      )}
    </div>
  );
}
