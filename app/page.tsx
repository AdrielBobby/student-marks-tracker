'use client';

import { useState, useCallback, useEffect } from 'react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getCalendarDays(month: Date): (Date | null)[] {
  const y = month.getFullYear();
  const m = month.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(y, m, d));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

// ─── Theme Toggle ────────────────────────────────────────────────────────────

function ThemeToggle() {
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
      <span className="theme-toggle__icon">☀️</span>
      <span
        className={`theme-toggle__thumb ${isDark ? 'theme-toggle__thumb--dark' : 'theme-toggle__thumb--light'}`}
      />
      <span className="theme-toggle__icon">🌙</span>
    </button>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      style={{
        width: collapsed ? 52 : 260,
        minWidth: collapsed ? 52 : 260,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: '0 14px',
        height: 60,
        borderBottom: '1px solid var(--border)',
        gap: 8,
        flexShrink: 0,
      }}>
        {!collapsed && (
          <span style={{
            fontSize: 20,
            fontWeight: 600,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}>
            Marks Tracker
          </span>
        )}
        <button
          id="sidebar-toggle-btn"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            cursor: 'pointer',
            color: 'var(--text-muted)',
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Body — hidden when collapsed */}
      {!collapsed && (
        <>
          {/* Student count + Add button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>
              0 Students
            </span>
            <button
              id="add-student-btn"
              style={{
                background: 'var(--accent)',
                border: 'none',
                borderRadius: 6,
                color: '#fff',
                fontSize: 12,
                fontWeight: 500,
                padding: '4px 12px',
                cursor: 'pointer',
              }}
            >
              + Add
            </button>
          </div>

          {/* Empty student list placeholder */}
          <div
            className="sidebar-scroll"
            style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}
          >
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>
              No students yet.
            </p>
          </div>

          {/* Theme toggle at bottom */}
          <div style={{
            padding: '14px 16px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Theme</span>
            <ThemeToggle />
          </div>
        </>
      )}
    </aside>
  );
}

// ─── Calendar Skeleton ────────────────────────────────────────────────────────

function CalendarSkeleton({
  currentMonth,
  onPrev,
  onNext,
  onToday,
}: {
  currentMonth: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const today = new Date();
  const days = getCalendarDays(currentMonth);

  return (
    <div>
      {/* Calendar header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
      }}>
        <h2 style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0,
        }}>
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            id="prev-month-btn"
            onClick={onPrev}
            style={navBtnStyle}
            aria-label="Previous month"
          >←</button>
          <button
            id="today-btn"
            onClick={onToday}
            style={navBtnStyle}
            aria-label="Go to today"
          >Today</button>
          <button
            id="next-month-btn"
            onClick={onNext}
            style={navBtnStyle}
            aria-label="Next month"
          >→</button>
        </div>
      </div>

      {/* Day names header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 1,
        marginBottom: 1,
      }}>
        {DAY_NAMES.map(d => (
          <div key={d} className="calendar-day-header">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="calendar-grid">
        {days.map((date, i) => {
          if (!date) {
            return <div key={`empty-${i}`} className="calendar-cell--empty" />;
          }
          const isToday = isSameDay(date, today);
          return (
            <div
              key={date.toISOString()}
              className={`calendar-cell${isToday ? ' calendar-cell--today' : ''}`}
              role="button"
              tabIndex={0}
              aria-label={`${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
            >
              <span className={`calendar-cell__day${isToday ? ' calendar-cell__day--today' : ''}`}>
                {date.getDate()}
              </span>
              {/* Pills will appear here once API is wired up */}
              <div className="calendar-cell__pills" />
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: 20,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        {[
          { label: 'Terrible (1–3)',      color: '#ef4444' },
          { label: 'Satisfactory (4–6)',  color: '#f59e0b' },
          { label: 'Good (7–8)',          color: '#10b981' },
          { label: 'Excellent (9–10)',    color: '#3b82f6' },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              className="pill-filled"
              style={{ background: color, fontSize: 10, padding: '1px 8px' }}
            >
              {label.split(' ')[0]}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="pill-empty" style={{ fontSize: 10, padding: '1px 8px' }}>Name</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No mark</span>
        </div>
      </div>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  cursor: 'pointer',
  padding: '6px 14px',
  fontSize: 13,
  fontFamily: 'Inter, sans-serif',
  transition: 'background 0.1s',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [collapsed, setCollapsed] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const prevMonth = useCallback(() => {
    setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }, []);

  const goToday = useCallback(() => {
    setCurrentMonth(new Date());
  }, []);

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <main className="main-content">
        <CalendarSkeleton
          currentMonth={currentMonth}
          onPrev={prevMonth}
          onNext={nextMonth}
          onToday={goToday}
        />
      </main>
    </div>
  );
}
