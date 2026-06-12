import React, { useEffect, useRef } from 'react';
import { useStore } from '../services/store';
import { auth } from '../services/firebase';
import { FIRE_LOTTIE_DATA } from '../features/theme/lottieData';

function getFlameFilter(count) {
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
}

export function Header({ onOpenCal }) {
  const { user, streak } = useStore();
  const lottieContainerRef = useRef(null);
  const animRef = useRef(null);
  const [timeStr, setTimeStr] = React.useState('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      let h = d.getHours();
      const m = d.getMinutes();
      const ampm = h >= 12 ? 'pm' : 'am';
      h = h % 12;
      if (h === 0) h = 12;
      setTimeStr(`${h}:${m.toString().padStart(2, '0')} ${ampm}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!lottieContainerRef.current) return;
    if (!animRef.current && window.lottie) {
      animRef.current = window.lottie.loadAnimation({
        container: lottieContainerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: FIRE_LOTTIE_DATA
      });
    }
  }, []);

  const streakCount = streak?.count || 0;
  const countClamped = Math.min(streakCount, 20);
  const badgeScale = countClamped === 0 ? 0.3 : 0.40 + (countClamped / 20) * 0.60;
  const flameFilter = getFlameFilter(countClamped);

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="streak-badge" id="streak-badge" aria-label="Open calendar" onClick={onOpenCal}>
          <div 
            ref={lottieContainerRef} 
            style={{ width: 32, height: 36, transformOrigin: 'bottom center', transition: 'transform 0.4s ease', transform: `scale(${badgeScale})`, filter: flameFilter }}
          ></div>
          <span id="streak-count" className="streak-count-label">{streakCount}</span>
        </button>
        <div>
          <h1 className="app-title">FocusBook</h1>
          <p className="app-date">
            <span id="app-date-text">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric'})}</span> 
            <span className="app-time" id="app-time"> {timeStr}</span>
          </p>
        </div>
      </div>
      <div className="header-right">
        {user ? (
          <div className="user-chip" id="user-chip">
            {user.photoURL ? (
              <img className="user-avatar" id="user-avatar" src={user.photoURL} alt=""/>
            ) : (
              <span className="user-initial" style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                {(user.displayName || user.email || '?')[0].toUpperCase()}
              </span>
            )}
            <button className="user-signout-btn" id="user-signout-btn" title="Sign out" onClick={() => auth.signOut()}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 7h7M9 5l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 2H3a1 1 0 00-1 1v8a1 1 0 001 1h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
