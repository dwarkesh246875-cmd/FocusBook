import React, { useState, useEffect } from 'react';
import { useStore, getSystemDate, todayStr as getTodayStr } from '../services/store';

export function DevTools() {
  const [isOpen, setIsOpenState] = useState(localStorage.getItem('devToolsOpen') === 'true');
  const setIsOpen = (val) => {
    const nextVal = typeof val === 'function' ? val(isOpen) : val;
    setIsOpenState(nextVal);
    localStorage.setItem('devToolsOpen', String(nextVal));
  };
  const { tasks, addTask, deleteTask } = useStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+D to toggle DevTools
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const advanceDay = () => {
    const d = getSystemDate();
    d.setDate(d.getDate() + 1);
    const mockStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    localStorage.setItem('mockDate', mockStr);
    window.location.reload();
  };

  const resetTime = () => {
    localStorage.removeItem('mockDate');
    window.location.reload();
  };

  const generateRottingTask = async () => {
    const d = getSystemDate();
    d.setDate(d.getDate() - 5);
    const origStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    
    await addTask({
      name: `Rotting Task (Created 5 days ago)`,
      priority: 'high',
      area: 'client',
      date: getTodayStr(), // Currently scheduled for today
      originalDate: origStr // But created 5 days ago
    });
  };

  const getYesterdayStr = () => {
    const d = getSystemDate();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const mockPerfectDay = async () => {
    const yStr = getYesterdayStr();
    await addTask({ name: "Perfect Task 1", priority: "high", area: "client", date: yStr, originalDate: yStr, done: true });
    await addTask({ name: "Perfect Task 2", priority: "medium", area: "admin", date: yStr, originalDate: yStr, done: true });
  };

  const mockPartialDay = async () => {
    const yStr = getYesterdayStr();
    await addTask({ name: "Completed Task", priority: "high", area: "client", date: yStr, originalDate: yStr, done: true });
    await addTask({ name: "Missed Task", priority: "medium", area: "admin", date: yStr, originalDate: yStr, done: false });
  };

  const mockMissedDay = async () => {
    const yStr = getYesterdayStr();
    await addTask({ name: "Missed Task 1", priority: "high", area: "client", date: yStr, originalDate: yStr, done: false });
    await addTask({ name: "Missed Task 2", priority: "medium", area: "admin", date: yStr, originalDate: yStr, done: false });
  };

  const clearAllTasks = async () => {
    if (window.confirm("Delete ALL tasks?")) {
      for (const t of tasks) {
        await deleteTask(t.id);
      }
    }
  };

  const currentMockStr = localStorage.getItem('mockDate') || "Real Time";

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: 20, zIndex: 9999,
      background: '#222', color: '#fff', padding: 20, borderRadius: 12,
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)', width: 300,
      fontFamily: 'sans-serif'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottom: '1px solid #444', paddingBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>⏱️ Time Machine</h3>
        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>

      <div style={{ marginBottom: 15 }}>
        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>System Date</div>
        <div style={{ fontWeight: 'bold', color: '#ff9800' }}>{currentMockStr}</div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button onClick={advanceDay} style={{ flex: 1, padding: 8, background: '#4CAF50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>+1 Day</button>
        <button onClick={resetTime} style={{ flex: 1, padding: 8, background: '#f44336', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>Reset Time</button>
      </div>

      <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>Generators</div>
      <button onClick={generateRottingTask} style={{ width: '100%', padding: 6, background: '#333', color: 'white', border: '1px solid #555', borderRadius: 4, cursor: 'pointer', marginBottom: 6, textAlign: 'left', fontSize: 12 }}>
        + Add Rotting Task (5 days old)
      </button>
      <button onClick={mockPerfectDay} style={{ width: '100%', padding: 6, background: '#333', color: '#4CAF50', border: '1px solid #555', borderRadius: 4, cursor: 'pointer', marginBottom: 6, textAlign: 'left', fontSize: 12 }}>
        + Mock Perfect Yesterday
      </button>
      <button onClick={mockPartialDay} style={{ width: '100%', padding: 6, background: '#333', color: '#ff9800', border: '1px solid #555', borderRadius: 4, cursor: 'pointer', marginBottom: 6, textAlign: 'left', fontSize: 12 }}>
        + Mock Partial Yesterday
      </button>
      <button onClick={mockMissedDay} style={{ width: '100%', padding: 6, background: '#333', color: '#f44336', border: '1px solid #555', borderRadius: 4, cursor: 'pointer', marginBottom: 6, textAlign: 'left', fontSize: 12 }}>
        + Mock Missed Yesterday
      </button>

      <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8, marginTop: 15 }}>Danger Zone</div>
      <button onClick={clearAllTasks} style={{ width: '100%', padding: 8, background: '#222', color: '#f44336', border: '1px solid #f44336', borderRadius: 4, cursor: 'pointer', textAlign: 'left' }}>
        🗑️ Delete All Tasks
      </button>
    </div>
  );
}
