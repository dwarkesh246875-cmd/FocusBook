import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export function AuthOverlay() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) { setError(e.message); }
  };

  const handleGuest = async () => {
    try { await signInAnonymously(auth); } catch (e) { setError(e.message); }
  };

  const handleEmail = async (isSignUp) => {
    setError('');
    if (!email || !password) { setError('Please enter email and password.'); return; }
    try {
      if (isSignUp) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) { setError(e.message.replace('Firebase: ', '')); }
  };

  return (
    <div className="auth-overlay" id="auth-overlay">
      <div className="auth-card">
        <div className="auth-lines"></div>
        <div className="auth-margin"></div>

        <div className="auth-inner">
          <div className="auth-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 3C14 3 20 8 20 13C20 16.3 17.3 19 14 19C10.7 19 8 16.3 8 13C8 10.5 9.5 8.2 11.2 6.5C11.2 9 12.5 9.8 14 9.8C14 7 14 3 14 3Z" fill="var(--accent)" opacity=".85"/>
            </svg>
            <span>FocusBook</span>
          </div>

          <h1 className="auth-headline">Your tasks.<br/>Your ritual.<br/>Your streak.</h1>
          <p className="auth-sub">Sign in to keep your focus, wherever you are.</p>

          <button className="auth-google-btn" onClick={handleGoogle}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="auth-divider"><span>or</span></div>

          <div className="auth-email-form">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '8px', marginBottom: '8px', width: '100%', borderRadius: '4px', border: '1px solid var(--border)'}} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEmail(false)} style={{ padding: '8px', marginBottom: '8px', width: '100%', borderRadius: '4px', border: '1px solid var(--border)'}} />
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button onClick={() => handleEmail(false)} style={{ flex: 1, padding: '8px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Sign In</button>
              <button onClick={() => handleEmail(true)} style={{ flex: 1, padding: '8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}>Sign Up</button>
            </div>

            <button className="auth-guest-btn" onClick={handleGuest}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              Continue as Guest
            </button>
            <div className="auth-guest-note">Guest data is local only — sign in to sync across devices</div>
            {error && <div style={{ color: 'red', fontSize: '12px', marginTop: '8px' }}>{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
