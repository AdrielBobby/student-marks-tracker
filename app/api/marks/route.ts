/**
 * GET  /api/marks?month=YYYY-MM   — All marks for a given month
 * GET  /api/marks?date=YYYY-MM-DD — All marks for a specific day
 * POST /api/marks                 — Create or update a mark (upsert)
 *
 * DATE HANDLING:
 *   All dates are normalised to UTC midnight before storage and querying.
 *   This ensures the @@unique([studentId, date]) constraint works consistently
 *   regardless of the server or client timezone.
 *   Frontend always sends dates as "YYYY-MM-DD" strings.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRemark } from '@/lib/remarks';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse "YYYY-MM-DD" → UTC midnight Date. Returns null if invalid. */
function parseUTCDay(dateStr: string): Date | null {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  return isNaN(d.getTime()) ? null : d;
}

/** Parse "YYYY-MM" → { start, end } UTC Date range covering the entire month. */
function parseUTCMonthRange(monthStr: string): { start: Date; end: Date } | null {
  const [yearStr, monthStr2] = monthStr.split('-');
  const year  = parseInt(yearStr,  10);
  const month = parseInt(monthStr2, 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return null;
  const start = new Date(Date.UTC(year, month - 1, 1));
  // Day 0 of the next month = last day of the current month
  const end   = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const date  = searchParams.get('date');

  try {
    // ── Filter by month (primary use-case: calendar view) ──
    if (month) {
      const range = parseUTCMonthRange(month);
      if (!range) {
        return NextResponse.json(
          { error: 'Invalid month format. Expected YYYY-MM.' },
          { status: 400 },
        );
      }
      const marks = await prisma.mark.findMany({
        where: { date: { gte: range.start, lte: range.end } },
        include: { student: true },
        orderBy: { date: 'asc' },
      });
      return NextResponse.json(marks);
    }

    // ── Filter by specific day (used by the mark entry modal) ──
    if (date) {
      const day = parseUTCDay(date);
      if (!day) {
        return NextResponse.json(
          { error: 'Invalid date format. Expected YYYY-MM-DD.' },
          { status: 400 },
        );
      }
      const dayEnd = new Date(Date.UTC(
        day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 23, 59, 59, 999,
      ));
      const marks = await prisma.mark.findMany({
        where: { date: { gte: day, lte: dayEnd } },
        include: { student: true },
        orderBy: { studentId: 'asc' },
      });
      return NextResponse.json(marks);
    }

    // ── No filter — return all (internal / debug use only) ──
    const marks = await prisma.mark.findMany({
      include: { student: true },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(marks);
  } catch (error) {
    console.error('[GET /api/marks]', error);
    return NextResponse.json({ error: 'Failed to fetch marks' }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { studentId, date, mark } = body ?? {};

  // ── Validate presence ──
  if (studentId === undefined || studentId === null) {
    return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
  }
  if (!date || typeof date !== 'string') {
    return NextResponse.json({ error: 'date is required (YYYY-MM-DD)' }, { status: 400 });
  }
  if (mark === undefined || mark === null) {
    return NextResponse.json({ error: 'mark is required' }, { status: 400 });
  }

  // ── Validate types & ranges ──
  const studentIdInt = parseInt(String(studentId), 10);
  if (isNaN(studentIdInt)) {
    return NextResponse.json({ error: 'studentId must be a valid integer' }, { status: 400 });
  }

  const markNum = Number(mark);
  if (!Number.isInteger(markNum) || markNum < 1 || markNum > 10) {
    return NextResponse.json(
      { error: 'mark must be a whole number between 1 and 10' },
      { status: 400 },
    );
  }

  const dayDate = parseUTCDay(date);
  if (!dayDate) {
    return NextResponse.json(
      { error: 'Invalid date format. Expected YYYY-MM-DD.' },
      { status: 400 },
    );
  }

  try {
    const remark = getRemark(markNum);

    // Upsert — the @@unique([studentId, date]) constraint maps to "studentId_date"
    // in Prisma's generated where clause. If a mark exists for this student on this
    // day, it is updated; otherwise a new record is created.
    const result = await prisma.mark.upsert({
      where: {
        studentId_date: {
          studentId: studentIdInt,
          date: dayDate,
        },
      },
      update: {
        mark: markNum,
        remark,
      },
      create: {
        studentId: studentIdInt,
        date: dayDate,
        mark: markNum,
        remark,
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2003') {
      // Foreign key constraint — studentId doesn't exist
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    console.error('[POST /api/marks]', error);
    return NextResponse.json({ error: 'Failed to save mark' }, { status: 500 });
  }
}
