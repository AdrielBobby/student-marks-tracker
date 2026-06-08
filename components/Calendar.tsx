'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Student, DayMark } from '@/lib/types';
import { isHoliday, isStudentEligibleOnDate, toLocalDateKey } from '@/lib/dates';
import CalendarCell from './CalendarCell';
import MarkModal from './MarkModal';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getCalendarDays(monthDate: Date): (Date | null)[] {
  const y = monthDate.getFullYear();
  const m = monthDate.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  
  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(y, m, d));
  }
  while (days.length % 7 !== 0) {
    days.push(null);
  }
  return days;
}

// toLocalDateKey is imported from lib/dates; keep a local alias for marks lookup
function getUTCDateKey(d: Date): string {
  return toLocalDateKey(d);
}

/** Guard: never open modal on a holiday */
function handleOpenCell(date: Date, setter: (d: Date) => void) {
  if (!isHoliday(date)) setter(date);
}

interface CalendarProps {
  students: Student[];
  refreshKey: number;
  onMarksUpdated?: () => void;
  // Lifted selectedDate state — controlled by page.tsx for scroll-lock coordination
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
  // Mobile top-bar trigger — passed down as a render prop from page
  mobileTopBar?: React.ReactNode;
}

export default function Calendar({
  students,
  refreshKey,
  onMarksUpdated,
  selectedDate,
  onSelectDate,
  mobileTopBar,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [marksByDate, setMarksByDate] = useState<Record<string, DayMark[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Legend collapsed state — mobile only (CSS ensures toggle button only shows on mobile)
  const [legendOpen, setLegendOpen] = useState(false);

  const fetchMarks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const yyyy = currentMonth.getFullYear();
    const mm = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const monthStr = `${yyyy}-${mm}`;

    try {
      const res = await fetch(`/api/marks?month=${monthStr}`);
      if (!res.ok) {
        throw new Error('Failed to fetch marks');
      }
      const data = await res.json();
      
      const mapped: Record<string, DayMark[]> = {};
      data.forEach((m: any) => {
        const dateKey = m.date.substring(0, 10);
        if (!mapped[dateKey]) {
          mapped[dateKey] = [];
        }
        mapped[dateKey].push({
          id: m.id,
          studentId: m.studentId,
          mark: m.mark,
          remark: m.remark,
        });
      });
      setMarksByDate(mapped);
    } catch (err: any) {
      console.error('[Fetch Marks Error]', err);
      setError('Could not load marks. Please check connection.');
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth]);

  // Refetch when current month or refresh key changes
  useEffect(() => {
    fetchMarks();
  }, [fetchMarks, refreshKey]);

  const prevMonth = () => {
    setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const goToday = () => {
    setCurrentMonth(new Date());
  };

  const days = getCalendarDays(currentMonth);

  const handleSaveMarks = () => {
    fetchMarks();
    if (onMarksUpdated) {
      onMarksUpdated();
    }
  };

  const LEGEND_ITEMS = [
    { label: 'Terrible (1–3)',      color: '#ef4444' },
    { label: 'Satisfactory (4–6)',  color: '#f59e0b' },
    { label: 'Good (7–8)',          color: '#10b981' },
    { label: 'Excellent (9–10)',    color: '#3b82f6' },
  ];

  return (
    <div>
      {/* Mobile top bar — only visible on mobile via CSS, passed from page.tsx */}
      {mobileTopBar}

      {/* Calendar Header Nav */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
          }}>
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          {isLoading && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading...</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            id="prev-month-btn"
            onClick={prevMonth}
            style={navBtnStyle}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            id="today-btn"
            onClick={goToday}
            style={navBtnStyle}
            aria-label="Go to today"
          >
            Today
          </button>
          <button
            id="next-month-btn"
            onClick={nextMonth}
            style={navBtnStyle}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid var(--pill-terrible)',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 16,
          color: 'var(--pill-terrible)',
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Day Names Header */}
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

      {/* Grid of Day Cells */}
      <div className="calendar-grid">
        {days.map((date, i) => {
          if (!date) {
            return <div key={`empty-${i}`} className="calendar-cell--empty" />;
          }
          const dateKey = getUTCDateKey(date);
          const cellMarks = marksByDate[dateKey] || [];
          return (
            <CalendarCell
              key={date.toISOString()}
              date={date}
              students={students}
              marks={cellMarks}
              onOpen={d => handleOpenCell(d, onSelectDate)}
            />
          );
        })}
      </div>

      {/* Colour Remark Legend */}
      <div className="legend-container" style={{ marginTop: 20 }}>
        {/* Mobile collapse trigger — hidden on desktop via CSS */}
        <button
          className="legend-toggle"
          onClick={() => setLegendOpen(o => !o)}
          aria-expanded={legendOpen}
          aria-label="Toggle legend"
        >
          {/* Coloured dots preview */}
          <span className="legend-dots">
            {LEGEND_ITEMS.map(({ color }) => (
              <span
                key={color}
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: color,
                }}
              />
            ))}
          </span>
          <span className="legend-toggle__label">
            Legend
            <ChevronRight
              size={14}
              style={{
                display: 'inline-block',
                marginLeft: 4,
                transform: legendOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                verticalAlign: 'middle',
              }}
            />
          </span>
        </button>

        {/* Legend items — always visible on desktop; shown/hidden on mobile */}
        <div className={`legend-items${legendOpen ? ' legend-items--open' : ''}`}>
          {LEGEND_ITEMS.map(({ label, color }) => (
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

      {/* Performance Mark Entry Modal Overlay */}
      {selectedDate && (() => {
        // Use shared isStudentEligibleOnDate helper — same rule as CalendarCell pills.
        const selKey = getUTCDateKey(selectedDate);
        const eligibleStudents = students.filter(s =>
          s.isActive && isStudentEligibleOnDate(s, selKey)
        );
        return (
          <MarkModal
            date={selectedDate}
            students={eligibleStudents}
            existingMarks={marksByDate[getUTCDateKey(selectedDate)] || []}
            onClose={() => onSelectDate(null)}
            onSave={handleSaveMarks}
          />
        );
      })()}
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  cursor: 'pointer',
  padding: '6px 10px',
  fontSize: 13,
  fontFamily: 'Inter, sans-serif',
  transition: 'background 0.1s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
