'use client';

import { Student, DayMark } from '@/lib/types';
import { isHoliday, isStudentEligibleOnDate, toLocalDateKey } from '@/lib/dates';
import { getRemarkColor, Remark } from '@/lib/remarks';
import { getInitials } from '@/lib/utils';
import StudentPill from './StudentPill';

interface CalendarCellProps {
  date: Date;
  students: Student[];
  marks: DayMark[];
  onOpen: (date: Date) => void;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate();
}

export default function CalendarCell({ date, students, marks, onOpen }: CalendarCellProps) {
  const today   = new Date();
  const isToday = isSameDay(date, today);
  const holiday = isHoliday(date);
  const dateKey = toLocalDateKey(date);

  // Only show pills/avatars for students whose internship window includes this date
  const eligibleStudents = students
    .filter(s => isStudentEligibleOnDate(s, dateKey))
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleClick = () => {
    if (!holiday) onOpen(date);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (holiday) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(date);
    }
  };

  // Build CSS class list
  let className = 'calendar-cell';
  if (holiday)      className += ' calendar-cell--holiday';
  else if (isToday) className += ' calendar-cell--today';

  // Separate the marked students for avatar rendering
  const markedStudents = holiday ? [] : eligibleStudents.filter(s => marks.find(m => m.studentId === s.id));
  const allVisibleStudents = holiday ? [] : eligibleStudents;
  const total = allVisibleStudents.length;

  // Mobile avatar row — always max 2 circles:
  //   0 students  → nothing
  //   1 student   → 1 initials circle
  //   2 students  → 2 initials circles
  //   3+ students → 1 initials circle (first) + overflow circle showing (total-1)+
  let avatarStudents: typeof allVisibleStudents;
  let overflowLabel: string | null = null;

  if (total <= 2) {
    avatarStudents = allVisibleStudents;          // 0, 1, or 2 — show all
  } else {
    avatarStudents = allVisibleStudents.slice(0, 1); // 3+ — only the first student
    overflowLabel  = `${total - 1}+`;            // e.g. 3→"2+", 5→"4+", 9→"8+"
  }

  return (
    <div
      className={className}
      role={holiday ? 'presentation' : 'button'}
      tabIndex={holiday ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={
        holiday
          ? `${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} — Holiday`
          : date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      }
    >
      {/* Date number + holiday badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <span className={`calendar-cell__day${isToday && !holiday ? ' calendar-cell__day--today' : ''}`}>
          {date.getDate()}
        </span>
        {holiday && (
          <span className="calendar-cell__holiday-badge">
            {date.getDay() === 0 ? 'Sun' : '2nd Sat'}
          </span>
        )}
      </div>

      {/* ── Desktop: full Name · Remark pills (hidden on mobile via CSS) ── */}
      <div className="cell-pills-desktop calendar-cell__pills">
        {!holiday && eligibleStudents.map(student => {
          const studentMark = marks.find(m => m.studentId === student.id);
          return (
            <StudentPill
              key={student.id}
              name={student.name}
              remark={studentMark ? studentMark.remark : null}
            />
          );
        })}
      </div>

      {/* ── Mobile: initials avatar row (hidden on desktop via CSS) ── */}
      <div className="cell-pills-mobile">
        {avatarStudents.map(student => {
          const studentMark = marks.find(m => m.studentId === student.id);
          return (
            <StudentPill
              key={student.id}
              name={student.name}
              remark={studentMark ? studentMark.remark : null}
              variant="avatar"
            />
          );
        })}
        {overflowLabel !== null && (
          <span
            className="cell-avatar cell-avatar-overflow"
            title={`${total - 1} more student${total - 1 > 1 ? 's' : ''}`}
            aria-label={`${total - 1} more`}
          >
            {overflowLabel}
          </span>
        )}
      </div>
    </div>
  );
}
