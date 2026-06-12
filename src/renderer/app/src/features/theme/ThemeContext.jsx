import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAutoTheme, THEME_ORDER } from '../../utils/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('fb_theme_mode') || 'auto');
  const [manualTheme, setManualTheme] = useState(() => localStorage.getItem('fb_manual_theme') || 'morning');
  const [currentTheme, setCurrentTheme] = useState('morning');

  useEffect(() => {
    localStorage.setItem('fb_theme_mode', themeMode);
    localStorage.setItem('fb_manual_theme', manualTheme);

    const activeTheme = themeMode === 'auto' ? getAutoTheme() : manualTheme;
    document.documentElement.setAttribute('data-theme', activeTheme);
    setCurrentTheme(activeTheme);
  }, [themeMode, manualTheme]);

  useEffect(() => {
    if (themeMode !== 'auto') return;
    const interval = setInterval(() => {
      const active = getAutoTheme();
      document.documentElement.setAttribute('data-theme', active);
      setCurrentTheme(active);
    }, 60000);
    return () => clearInterval(interval);
  }, [themeMode]);

  const toggleSync = () => {
    if (themeMode === 'auto') {
      setThemeMode('manual');
      setManualTheme(getAutoTheme());
    } else {
      setThemeMode('auto');
    }
  };

  const cycleTheme = () => {
    if (themeMode === 'auto') {
      setThemeMode('manual');
      const idx = THEME_ORDER.indexOf(getAutoTheme());
      setManualTheme(THEME_ORDER[(idx + 1) % THEME_ORDER.length]);
    } else {
      const idx = THEME_ORDER.indexOf(manualTheme);
      setManualTheme(THEME_ORDER[(idx + 1) % THEME_ORDER.length]);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, themeMode, toggleSync, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
