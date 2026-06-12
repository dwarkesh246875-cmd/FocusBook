import React from 'react';

export function Fab({ onClick }) {
  return (
    <button className="fab" id="fab-add" aria-label="Add new task" onClick={onClick}>
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><line x1="11" y1="4" x2="11" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="4" y1="11" x2="18" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      <span>Add task</span>
    </button>
  );
}
