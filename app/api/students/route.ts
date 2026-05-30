/**
 * GET  /api/students                     — Active-today students (default)
 * GET  /api/students?scope=activeToday   — Same as default
 * GET  /api/students?scope=all           — All non-soft-deleted students
 * GET  /api/students?date=YYYY-MM-DD     — Students active on a specific date (for modal filtering)
 * POST /api/students                     — Creates a new student (with optional start/end dates)
 *
 * ACTIVE-TODAY / DATE FILTERING LOGIC:
 *   A student is eligible on a given date D if ALL of the following hold:
 *     1. isActive = true
 *     2. startDate is null  OR  startDate <= D
 *     3. endDate   is null  OR  endDate   >= D
 *
 * DATE HANDLING:
 *   startDate and endDate are stored as UTC midnight ("YYYY-MM-DDT00:00:00.000Z").
 *   The ?date param and POST body dates are parsed the same way.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse "YYYY-MM-DD" → UTC midnight Date. Returns null if invalid. */
function parseUTCDay(dateStr: string): Date | null {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  return isNaN(d.getTime()) ? null : d;
}

/** UTC midnight for today */
function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/** Prisma WHERE clause for date-window filtering on a given UTC date */
function dateWindowWhere(date: Date) {
  return {
    isActive: true,
    AND: [
      {
        OR: [
          { startDate: null },
          { startDate: { lte: date } },
        ],
      },
      {
        OR: [
          { endDate: null },
          { endDate: { gte: date } },
        ],
      },
    ],
  };
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope');      // "activeToday" | "all" | null
  const dateParam = searchParams.get('date');    // "YYYY-MM-DD" | null

  try {
    // ?date=YYYY-MM-DD — students active on a specific date (used by modal)
    if (dateParam) {
      const day = parseUTCDay(dateParam);
      if (!day) {
        return NextResponse.json(
          { error: 'Invalid date format. Expected YYYY-MM-DD.' },
          { status: 400 },
        );
      }
      const students = await prisma.student.findMany({
        where: dateWindowWhere(day),
        orderBy: { name: 'asc' },
      });
      return NextResponse.json(students);
    }

    // ?scope=all — all non-soft-deleted students regardless of date window
    if (scope === 'all') {
      const students = await prisma.student.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json(students);
    }

    // Default / ?scope=activeToday — students active today
    const students = await prisma.student.findMany({
      where: dateWindowWhere(todayUTC()),
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(students);
  } catch (error) {
    console.error('[GET /api/students]', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 },
    );
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const name = (body?.name ?? '').trim();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Name must be 100 characters or fewer' },
        { status: 400 },
      );
    }

    // Optional internship dates
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (body?.startDate) {
      startDate = parseUTCDay(String(body.startDate));
      if (!startDate) {
        return NextResponse.json(
          { error: 'Invalid startDate format. Expected YYYY-MM-DD.' },
          { status: 400 },
        );
      }
    }

    if (body?.endDate) {
      endDate = parseUTCDay(String(body.endDate));
      if (!endDate) {
        return NextResponse.json(
          { error: 'Invalid endDate format. Expected YYYY-MM-DD.' },
          { status: 400 },
        );
      }
    }

    // Validate range consistency
    if (startDate && endDate && endDate < startDate) {
      return NextResponse.json(
        { error: 'endDate must be on or after startDate.' },
        { status: 400 },
      );
    }

    const student = await prisma.student.create({
      data: {
        name,
        startDate: startDate ?? undefined,
        endDate:   endDate   ?? undefined,
      },
    });
    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error('[POST /api/students]', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 },
    );
  }
}
