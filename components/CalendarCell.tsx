'use client';

import { Student, DayMark } from '@/lib/types';
import { isHoliday, isStudentEligibleOnDate, toLocalDateKey } from '@/lib/dates';
import StudentPill from './StudentPill';

interface CalendarCellProps {
  date: Date;
  students: Student[];
  marks: DayMark[];
  onOpen: (date: Date) => void;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export default function CalendarCell({ date, students, marks, onOpen }: CalendarCellProps) {
  const today = new Date();
  const isToday = isSameDay(date, today);
  const holiday = isHoliday(date);
  const dateKey = toLocalDateKey(date);

  // Only show pills for students whose internship window includes this date
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
  if (holiday) className += ' calendar-cell--holiday';
  else if (isToday) className += ' calendar-cell--today';

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

      {!holiday && (
        <div className="calendar-cell__pills">
          {eligibleStudents.map(student => {
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
      )}
    </div>
  );
}
