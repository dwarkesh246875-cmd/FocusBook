import React, { useEffect, useRef } from 'react';
import { useStore, getSystemDate, todayStr as getTodayStr } from '../services/store';
import { FIRE_LOTTIE_DATA } from '../features/theme/lottieData';

export function ProgressOverlay({ isOpen, onClose }) {
  const { tasks, streak, dayMap, totalXP } = useStore();
  const heroLottieRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (isOpen && heroLottieRef.current && !animRef.current && window.lottie) {
      try {
        const base64Data = FIRE_LOTTIE_DATA.split(',')[1];
        const animData = JSON.parse(atob(base64Data));
        animRef.current = window.lottie.loadAnimation({
          container: heroLottieRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: animData
        });
      } catch (e) {
        console.error("Failed to load fire animation:", e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const todayStr = getTodayStr();
  const currDate = getSystemDate();
  currDate.setHours(0, 0, 0, 0);

  const streakCount = streak?.count || 0;
  const countClamped = Math.min(streakCount, 20);

  const getFlameFilter = (count) => {
    if (count === 0) return 'grayscale(1) opacity(0.4)';
    let hue, sat, bright;
    if (count <= 5) {
      const t = (count - 1) / 4; hue = -25 + t * 25; sat = 1.5 - t * 0.2; bright = 1.3 - t * 0.1;
    } else if (count <= 10) {
      const t = (count - 5) / 5; hue = 0 - t * 30; sat = 1.3 + t * 0.2; bright = 1.1 - t * 0.1;
    } else if (count <= 15) {
      const t = (count - 10) / 5; hue = -30; sat = 1.5 + t * 0.2; bright = 1.0 - t * 0.05;
    } else {
      const t = (count - 15) / 5; hue = -30 - t * 90; sat = 1.7 + t * 0.5; bright = 0.95;
    }
    return `hue-rotate(${hue.toFixed(1)}deg) saturate(${sat.toFixed(2)}) brightness(${bright.toFixed(2)})`;
  };

  const flameFilter = getFlameFilter(countClamped);
  const heroScale = countClamped === 0 ? 0.8 : 0.8 + (countClamped / 20) * 0.8;

  const totalPartialDays = Object.values(dayMap).filter(info => {
    const hasCarry = info && info.hasCarryOverFrom;
    return info && ((info.done > 0 && info.done < info.total) || hasCarry);
  }).length;

  const rottingTasks = tasks.filter(t => {
    if (t.done || !t.originalDate || t.date !== todayStr) return false;
    const origDate = new Date(t.originalDate);
    const diffDays = Math.round((currDate.getTime() - origDate.getTime()) / 86400000);
    return diffDays >= 2;
  }).sort((a, b) => {
    const dA = Math.round((currDate.getTime() - new Date(a.originalDate).getTime()) / 86400000);
    const dB = Math.round((currDate.getTime() - new Date(b.originalDate).getTime()) / 86400000);
    return dB - dA;
  });

  const getLevelInfo = (xp) => {
    if (!xp) return { title: 'Level 1: Spark', color: 'var(--ink-faint)' };
    if (xp < 500) return { title: 'Level 1: Spark', color: 'var(--ink-faint)' };
    if (xp < 1500) return { title: 'Level 2: Ember', color: '#ff9800' };
    if (xp < 3000) return { title: 'Level 3: Flame', color: '#ff5722' };
    if (xp < 5000) return { title: 'Level 4: Blaze', color: '#e91e63' };
    if (xp < 10000) return { title: 'Level 5: Inferno', color: '#9c27b0' };
    if (xp < 25000) return { title: 'Level 6: Void Fire', color: '#673ab7' };
    return { title: 'Level 7: Sun Core', color: '#ffd700' };
  };

  const levelInfo = getLevelInfo(totalXP);

  return (
    <div className="cal-overlay cal-overlay-enter">
      <div className="cal-container" id="progress-modal" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <button className="cal-close-btn" onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, zIndex: 100 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><line x1="14" y1="2" x2="2" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>

        {/* Massive Fire Top Section */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position: 'relative', overflow: 'hidden', paddingBottom: '30px' }}>
          
          <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', background: 'var(--paper)', padding: '6px 16px', borderRadius: '20px', border: `1px solid ${levelInfo.color}`, color: levelInfo.color, fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0L10.4 5.2L16 6.1L12 10.3L13 16L8 13.5L3 16L4 10.3L0 6.1L5.6 5.2L8 0Z"/></svg>
            {levelInfo.title}
          </div>

          <div className="hero-fire-container" style={{ width: '280px', height: '280px', position: 'relative', marginBottom: 0 }}>
            <div className="embers-container"></div>
            <div
              id="lottie-hero-fire-prog"
              ref={heroLottieRef}
              style={{ position: 'absolute', bottom: 0, left: '50%', width: 220, height: 260, transformOrigin: 'bottom center', transition: 'all 0.4s ease', transform: `translateX(-50%) scale(${heroScale})`, filter: flameFilter }}
            ></div>
          </div>
        </div>

        {/* Bottom UI Elements */}
        <div style={{ padding: '0 30px 30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div style={{ textAlign: 'center' }}>
            <div className="hero-streak-number" style={{ fontSize: '48px', lineHeight: 1 }}>{streakCount}</div>
            <div className="hero-streak-label" style={{ fontSize: '12px', letterSpacing: '2px', color: 'var(--ink)', opacity: 0.8, marginTop: '8px' }}>DAY STREAK</div>
          </div>

          <div className="hero-stats-row" style={{ borderTop: '1px solid var(--grid-line)', borderBottom: '1px solid var(--grid-line)', padding: '15px 0' }}>
            <div className="hero-stat-col">
              <span className="hero-stat-val">{totalXP || 0}</span>
              <span className="hero-stat-lbl">Total XP</span>
            </div>
            <div className="hero-stat-col hero-stat-mid">
              <span className="hero-stat-val">{totalPartialDays}</span>
              <span className="hero-stat-lbl">Partial days</span>
            </div>
            <div className="hero-stat-col">
              <span className="hero-stat-val">{streak?.max || 0}</span>
              <span className="hero-stat-lbl">Max streak</span>
            </div>
          </div>

          <div className="progress-timeline-sec">
            <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--ink)', opacity: 0.6, marginBottom: 15 }}>Evolution Progress</h3>
            <div className="timeline-track" style={{ position: 'relative', height: 6, background: 'var(--progress-track)', borderRadius: 3 }}>
              <div className="timeline-fill" style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'var(--accent)', borderRadius: 3, width: `${(Math.min(streakCount, 20) / 20) * 100}%`, transition: 'width 0.4s ease' }}></div>
              {[0, 5, 10, 15, 20].map(bp => (
                <div key={bp} className="timeline-marker" style={{ position: 'absolute', top: -3, left: `${(bp / 20) * 100}%`, width: 12, height: 12, borderRadius: '50%', background: streakCount >= bp ? 'var(--accent)' : 'var(--paper)', border: '2px solid var(--page-bg)', transform: 'translateX(-50%)' }}>
                  <span style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 600, color: 'var(--ink)', opacity: streakCount >= bp ? 1 : 0.5 }}>{bp}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rotting-tasks-sec" style={{ maxHeight: '160px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--ink)', opacity: 0.6, marginBottom: 10 }}>Urgent Tasks</h3>
            {rottingTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '15px 0', color: 'var(--ink-faint)', fontSize: 14 }}>
                No tasks are currently rotting. Great job!
              </div>
            ) : (
              rottingTasks.map(t => {
                const origDate = new Date(t.originalDate);
                const diffDays = Math.round((currDate.getTime() - origDate.getTime()) / 86400000);
                const daysLeft = 5 - diffDays;
                const isPenalty = diffDays >= 5;

                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', padding: '12px', background: 'var(--page-bg)', borderRadius: 8, marginBottom: 8, borderLeft: isPenalty ? '3px solid var(--high-color)' : '3px solid var(--med-color)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500, textDecoration: t.done ? 'line-through' : 'none' }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>Carried over for {diffDays} days</div>
                    </div>
                    <div style={{ padding: '4px 8px', borderRadius: 4, background: isPenalty ? 'var(--high-bg)' : 'var(--med-bg)', color: isPenalty ? 'var(--high-color)' : 'var(--med-color)', fontSize: 11, fontWeight: 600 }}>
                      {isPenalty ? '-1 Streak/Day' : `Penalty in ${daysLeft}d`}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
