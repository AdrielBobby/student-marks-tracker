'use client';

import { useState, useEffect, useCallback } from 'react';
import { Student, DayMark } from '@/lib/types';
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

function getUTCDateKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

interface CalendarProps {
  students: Student[];
  refreshKey: number;
  onMarksUpdated?: () => void;
}

export default function Calendar({ students, refreshKey, onMarksUpdated }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [marksByDate, setMarksByDate] = useState<Record<string, DayMark[]>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        // Parse date string (substring handles "YYYY-MM-DD" portion from ISO format)
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

  return (
    <div>
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
            ←
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
            →
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
              onOpen={setSelectedDate}
            />
          );
        })}
      </div>

      {/* Colour Remark Legend */}
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

      {/* Performance Mark Entry Modal Overlay */}
      {selectedDate && (() => {
        // Filter students who are eligible on the selected date.
        // CalendarCell still receives the full `students` prop for pill display.
        const selKey = getUTCDateKey(selectedDate); // "YYYY-MM-DD"
        const eligibleStudents = students.filter(s => {
          if (!s.isActive) return false;
          if (s.startDate && s.startDate.substring(0, 10) > selKey) return false;
          if (s.endDate   && s.endDate.substring(0, 10)   < selKey) return false;
          return true;
        });
        return (
          <MarkModal
            date={selectedDate}
            students={eligibleStudents}
            existingMarks={marksByDate[getUTCDateKey(selectedDate)] || []}
            onClose={() => setSelectedDate(null)}
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
  padding: '6px 14px',
  fontSize: 13,
  fontFamily: 'Inter, sans-serif',
  transition: 'background 0.1s',
};
