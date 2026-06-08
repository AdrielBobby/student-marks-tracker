'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored ?? (prefersDark ? 'dark' : 'light');
    setIsDark(theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  const toggle = () => {
    const next = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  return (
    <button
      id="theme-toggle"
      onClick={toggle}
      className="theme-toggle"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Sun icon — left side, dimmed when dark */}
      <span className="theme-toggle__icon" aria-hidden="true">
        <Sun size={14} strokeWidth={2} />
      </span>

      {/* Sliding thumb — contains the ACTIVE icon so it renders centred in the circle */}
      <span
        className={`theme-toggle__thumb ${isDark ? 'theme-toggle__thumb--dark' : 'theme-toggle__thumb--light'}`}
        aria-hidden="true"
      >
        {isDark
          ? <Moon size={14} strokeWidth={2} />
          : <Sun  size={14} strokeWidth={2} />
        }
      </span>

      {/* Moon icon — right side, dimmed when light */}
      <span className="theme-toggle__icon" aria-hidden="true">
        <Moon size={14} strokeWidth={2} />
      </span>
    </button>
  );
}
