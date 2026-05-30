/**
 * GET /api/students/[id]/scorecard
 *
 * Returns aggregate performance metrics for a single student:
 *   - averageMark        arithmetic mean of all stored marks
 *   - averageRemark      remark band derived from averageMark
 *   - markedDaysCount    number of mark records
 *   - eligibleDaysCount  working days (excl. Sundays & 2nd Saturdays) in internship window up to today
 *   - coverage           markedDaysCount / eligibleDaysCount (null if eligibleDaysCount unavailable)
 *   - remarkCounts       per-band day counts { Terrible, Satisfactory, Good, Excellent }
 *   - recentMarks        last 10 marks ordered by date DESC
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRemark } from '@/lib/remarks';
import { countWorkingDays } from '@/lib/dates';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** UTC midnight for today */
function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
  }

  try {
    // Fetch student + all their marks in one query
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        marks: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const marks = student.marks;

    // ── Average mark ──────────────────────────────────────────────────────────
    let averageMark: number | null = null;
    let averageRemark: string | null = null;

    if (marks.length > 0) {
      const sum = marks.reduce((acc, m) => acc + m.mark, 0);
      averageMark = Math.round((sum / marks.length) * 10) / 10; // 1 decimal place
      // Clamp to 1–10 for getRemark safety then derive band
      const clampedAvg = Math.max(1, Math.min(10, Math.round(averageMark)));
      averageRemark = getRemark(clampedAvg);
    }

    // ── Remark counts ─────────────────────────────────────────────────────────
    const remarkCounts = {
      Terrible: 0,
      Satisfactory: 0,
      Good: 0,
      Excellent: 0,
    };
    marks.forEach(m => {
      const r = m.remark as keyof typeof remarkCounts;
      if (r in remarkCounts) remarkCounts[r]++;
    });

    // ── Eligible days count ───────────────────────────────────────────────────
    let eligibleDaysCount: number | null = null;
    const today = todayUTC();

    if (student.startDate) {
      const windowEnd = student.endDate && student.endDate < today
        ? student.endDate
        : today;
      // Only count if window has started
      if (student.startDate <= today) {
        // countWorkingDays excludes Sundays and 2nd Saturdays (Phase 6A)
        eligibleDaysCount = countWorkingDays(student.startDate, windowEnd);
      } else {
        // Internship hasn't started yet
        eligibleDaysCount = 0;
      }
    }

    // ── Coverage ─────────────────────────────────────────────────────────────
    let coverage: number | null = null;
    if (eligibleDaysCount !== null && eligibleDaysCount > 0) {
      coverage = Math.round((marks.length / eligibleDaysCount) * 1000) / 1000;
    }

    // ── Recent marks (last 10) ────────────────────────────────────────────────
    const recentMarks = marks.slice(0, 10).map(m => ({
      date: m.date.toISOString().substring(0, 10),
      mark: m.mark,
      remark: m.remark,
    }));

    // ── Build response ────────────────────────────────────────────────────────
    const responseStudent = {
      id: student.id,
      name: student.name,
      isActive: student.isActive,
      startDate: student.startDate ? student.startDate.toISOString().substring(0, 10) : null,
      endDate:   student.endDate   ? student.endDate.toISOString().substring(0, 10)   : null,
      createdAt: student.createdAt.toISOString(),
    };

    return NextResponse.json({
      student: responseStudent,
      averageMark,
      averageRemark,
      markedDaysCount: marks.length,
      eligibleDaysCount,
      coverage,
      remarkCounts,
      recentMarks,
    });
  } catch (error) {
    console.error('[GET /api/students/[id]/scorecard]', error);
    return NextResponse.json(
      { error: 'Failed to fetch scorecard' },
      { status: 500 },
    );
  }
}
