import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, getUserRefs } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { onSnapshot, setDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';

function xpFor(p) { return p === 'high' ? 100 : p === 'medium' ? 60 : 30; }

export function getSystemDate() {
  const mockStr = localStorage.getItem('mockDate');
  if (mockStr) {
    // Parse mockStr like "2026-06-12" assuming local time
    const [y, m, d] = mockStr.split('-');
    if (y && m && d) {
      return new Date(y, m - 1, d);
    }
  }
  return new Date();
}

export function todayStr() {
  const d = getSystemDate();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

const buildDayMap = (tasks) => {
  const map = {};
  tasks.forEach(t => {
    if (!t.date) return;
    if (!map[t.date]) map[t.date] = { total: 0, done: 0, tasks: [], hasCarryOverFrom: false };
    map[t.date].total++;
    if (t.done) map[t.date].done++;
    map[t.date].tasks.push(t);

    if (t.originalDate && t.originalDate < t.date) {
      let curr = new Date(t.originalDate);
      const end = new Date(t.date);
      while (curr < end) {
        const ds = `${curr.getFullYear()}-${String(curr.getMonth()+1).padStart(2,'0')}-${String(curr.getDate()).padStart(2,'0')}`;
        if (!map[ds]) map[ds] = { total: 0, done: 0, tasks: [], hasCarryOverFrom: false };
        map[ds].hasCarryOverFrom = true;
        map[ds].tasks.push({ ...t, isGhost: true });
        curr.setDate(curr.getDate() + 1);
      }
    }
  });
  return map;
};

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [streak, setStreak] = useState({ count: 0, lastDate: '', maxCount: 0, startDate: '' });
  const [totalXP, setTotalXP] = useState(0);
  const [areas, setAreas] = useState(['client', 'creative', 'learning', 'admin', 'health', 'personal', 'finance', 'social']);
  const [syncStatus, setSyncStatus] = useState('connecting');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setSyncStatus('synced');
        const { tasksRef, metaRef } = getUserRefs(currentUser.uid);
        
        // Listen to tasks
        const unsubTasks = onSnapshot(tasksRef, (snapshot) => {
          const loadedTasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setTasks(loadedTasks);
          
          // Send to Electron overlay
          if (window.electronAPI && window.electronAPI.sendTasks) {
            window.electronAPI.sendTasks(loadedTasks);
          }
        });

        // Listen to stats
        const unsubMeta = onSnapshot(metaRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setStreak(data.streak || { count: 0, lastDate: '', maxCount: 0, startDate: '' });
            setTotalXP(data.totalXP || 0);
            if (data.areas) setAreas(data.areas);
          }
        });

        return () => { unsubTasks(); unsubMeta(); };
      } else {
        setSyncStatus('offline');
        setTasks([]);
        setTotalXP(0);
        setStreak({ count: 0, lastDate: '', maxCount: 0, startDate: '' });
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const saveMeta = async (newTotalXP, newStreak) => {
    if (!user) return;
    const { metaRef } = getUserRefs(user.uid);
    try { await setDoc(metaRef, { totalXP: newTotalXP, streak: newStreak }, { merge: true }); } catch (e) { console.error(e) }
  };

  const saveAreas = async (newAreas) => {
    if (!user) return;
    setAreas(newAreas);
    const { metaRef } = getUserRefs(user.uid);
    try { await setDoc(metaRef, { areas: newAreas }, { merge: true }); } catch (e) { console.error(e) }
  };

  const saveTask = async (task) => {
    if (!user) return;
    setSyncStatus('saving');
    const { tasksRef } = getUserRefs(user.uid);
    try {
      await setDoc(doc(tasksRef, task.id), task);
      setSyncStatus('synced');
    } catch {
      setSyncStatus('offline');
    }
  };

  const addTask = async (taskData) => {
    const newTask = {
      id: crypto.randomUUID(),
      created: getSystemDate().getTime(),
      done: false,
      ...taskData
    };
    await saveTask(newTask);
  };

  const updateStreakAndXP = (isDone, priority) => {
    let newXP = totalXP;
    if (isDone) {
      newXP += xpFor(priority);
    } else {
      newXP = Math.max(0, newXP - xpFor(priority));
    }
    setTotalXP(newXP);
    saveMeta(newXP, streak);
  };

  const addXP = async (amount) => {
    const newXP = totalXP + amount;
    setTotalXP(newXP);
    await saveMeta(newXP, streak);
  };

  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.done = !task.done;
    if (task.subItems && task.subItems.length > 0) {
      task.subItems.forEach(s => s.done = task.done);
    }
    updateStreakAndXP(task.done, task.priority);
    await saveTask(task);
  };

  const toggleSubItem = async (taskId, subId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;
    
    let becameDone = false;
    const newSubItems = task.subItems.map(s => {
      if (s.id === subId) return { ...s, done: !s.done };
      return s;
    });

    const allDone = newSubItems.length > 0 && newSubItems.every(s => s.done);
    let newTaskDone = task.done;

    if (allDone && !task.done) {
      newTaskDone = true;
      becameDone = true;
      updateStreakAndXP(true, task.priority);
    } else if (!allDone && task.done) {
      newTaskDone = false;
      updateStreakAndXP(false, task.priority);
    }

    const updated = { ...task, done: newTaskDone, subItems: newSubItems };
    await saveTask(updated);
    return becameDone; // Return true if it triggered the main task completion
  };

  const deleteTask = async (id) => {
    if (!user) return;
    const { tasksRef } = getUserRefs(user.uid);
    await deleteDoc(doc(tasksRef, id));
  };

  const updateTask = async (id, updates) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updated = { ...task, ...updates };
    await saveTask(updated);
  };

  const dayMap = buildDayMap(tasks);

  const getCalculatedStreak = () => {
    const dates = Object.keys(dayMap).sort();
    if (dates.length === 0) return 0;
    
    let count = 0;
    const firstDate = new Date(dates[0]);
    const today = getSystemDate();
    
    let curr = new Date(firstDate);
    while (curr < today) {
      const ds = `${curr.getFullYear()}-${String(curr.getMonth()+1).padStart(2,'0')}-${String(curr.getDate()).padStart(2,'0')}`;
      const info = dayMap[ds];
      const isPerfect = info && info.done > 0 && info.done === info.total && !info.hasCarryOverFrom;
      const isMissed = info && info.total > 0 && info.done === 0 && !info.hasCarryOverFrom;
      
      let dayPenalty = 0;
      if (isMissed) dayPenalty += 1;

      if (info && info.tasks) {
        const hasOldTask = info.tasks.some(t => {
          if (!t.originalDate) return false;
          if (!t.isGhost && t.done) return false;
          const origDate = new Date(t.originalDate);
          const diffDays = Math.round((curr.getTime() - origDate.getTime()) / 86400000);
          return diffDays > 4;
        });
        if (hasOldTask) dayPenalty += 1;
      }
      
      if (isPerfect) {
        count++;
      } else {
        count = Math.max(0, count - dayPenalty);
      }
      
      if (!dayMap[ds]) dayMap[ds] = { total: 0, done: 0, tasks: [], hasCarryOverFrom: false };
      dayMap[ds].runningStreak = count;

      curr.setDate(curr.getDate() + 1);
    }
    
    // Evaluate today
    const tInfo = dayMap[todayStr()];
    const tPerfect = tInfo && tInfo.done > 0 && tInfo.done === tInfo.total && !tInfo.hasCarryOverFrom;
    
    let todayPenalty = 0;
    if (tInfo && tInfo.tasks) {
      const hasOldTask = tInfo.tasks.some(t => {
        if (!t.originalDate) return false;
        if (!t.isGhost && t.done) return false;
        const origDate = new Date(t.originalDate);
        const currDate = new Date(todayStr());
        const diffDays = Math.round((currDate.getTime() - origDate.getTime()) / 86400000);
        return diffDays > 4;
      });
      if (hasOldTask) todayPenalty += 1;
    }

    if (tPerfect) {
      count++;
    } else {
      count = Math.max(0, count - todayPenalty);
    }
    
    if (!dayMap[todayStr()]) dayMap[todayStr()] = { total: 0, done: 0, tasks: [], hasCarryOverFrom: false };
    dayMap[todayStr()].runningStreak = count;
    
    return count;
  };

  const calculatedCount = getCalculatedStreak();

  useEffect(() => {
    if (user && calculatedCount > (streak.maxCount || 0)) {
      saveMeta(totalXP, { ...streak, count: calculatedCount, maxCount: calculatedCount });
    }
  }, [calculatedCount, user]);

  const computedStreak = {
    ...streak,
    count: calculatedCount,
    max: streak.maxCount || calculatedCount
  };

  return (
    <StoreContext.Provider value={{
      user, tasks, streak: computedStreak, dayMap, totalXP, areas, syncStatus,
      addTask, toggleTask, toggleSubItem, deleteTask, updateTask, addXP, saveAreas
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
