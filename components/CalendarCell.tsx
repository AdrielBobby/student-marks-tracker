'use client';

import { Student, DayMark } from '@/lib/types';
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

  // Sort students alphabetically to keep the pill list consistent
  const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(date);
    }
  };

  return (
    <div
      className={`calendar-cell${isToday ? ' calendar-cell--today' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(date)}
      onKeyDown={handleKeyDown}
      aria-label={`${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
    >
      <span className={`calendar-cell__day${isToday ? ' calendar-cell__day--today' : ''}`}>
        {date.getDate()}
      </span>
      <div className="calendar-cell__pills">
        {sortedStudents.map(student => {
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
    </div>
  );
}
