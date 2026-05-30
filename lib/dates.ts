/**
 * lib/dates.ts
 *
 * Shared date utility functions for internship holiday rules and eligibility checks.
 * Used by client components (CalendarCell, Calendar) and server API routes (scorecard).
 *
 * HOLIDAY RULES (Phase 6A):
 *   - Every Sunday
 *   - The second Saturday of each calendar month
 *   These days are non-working and must not allow mark entry.
 *
 * DATE HANDLING NOTE:
 *   Client components create dates as local-time midnight: new Date(y, m, d)
 *   Server code uses UTC midnight: new Date(Date.UTC(y, m, d))
 *   To avoid timezone-dependent day-of-week errors, the holiday check is
 *   parameterised on (dayOfWeek, dayOfMonth) so callers pass getDay()/getDate()
 *   or getUTCDay()/getUTCDate() as appropriate.
 */

import type { Student } from './types';

// ─── Core holiday logic ───────────────────────────────────────────────────────

/**
 * Returns true if the given day-of-week + day-of-month is a non-working holiday.
 * dayOfWeek: 0 = Sunday, 6 = Saturday (same as Date.getDay() and Date.getUTCDay())
 * dayOfMonth: 1–31
 */
export function isDayHoliday(dayOfWeek: number, dayOfMonth: number): boolean {
  if (dayOfWeek === 0) return true; // Sunday
  // 2nd Saturday: it must be a Saturday AND the day-of-month is 8–14
  if (dayOfWeek === 6 && dayOfMonth >= 8 && dayOfMonth <= 14) return true;
  return false;
}

/**
 * True if a LOCAL-time Date is a holiday.
 * Use this in client components where dates are created with new Date(y, m, d).
 */
export function isHoliday(date: Date): boolean {
  return isDayHoliday(date.getDay(), date.getDate());
}

/**
 * True if a UTC Date is a holiday.
 * Use this in server-side API routes where dates are UTC midnight objects.
 */
export function isHolidayUTC(date: Date): boolean {
  return isDayHoliday(date.getUTCDay(), date.getUTCDate());
}

// ─── Eligibility ──────────────────────────────────────────────────────────────

/**
 * Returns a "YYYY-MM-DD" key from a local-time Date.
 * Matches the key format used in Calendar.tsx.
 */
export function toLocalDateKey(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * True if a student's internship window covers the given dateKey ("YYYY-MM-DD").
 * Null start/end date means no restriction on that side.
 * Does NOT check isActive — callers should gate on that separately if needed.
 */
export function isStudentEligibleOnDate(student: Student, dateKey: string): boolean {
  if (student.startDate && student.startDate.substring(0, 10) > dateKey) return false;
  if (student.endDate   && student.endDate.substring(0, 10)   < dateKey) return false;
  return true;
}

// ─── Working-day counter (for scorecard) ─────────────────────────────────────

/**
 * Counts non-holiday (working) days between two UTC midnight dates, inclusive.
 * Uses isHolidayUTC — both arguments must be UTC midnight Date objects.
 */
export function countWorkingDays(start: Date, end: Date): number {
  let count = 0;
  // Clone start to avoid mutating the argument
  const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const endTime = end.getTime();
  while (cur.getTime() <= endTime) {
    if (!isHolidayUTC(cur)) count++;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return count;
}
