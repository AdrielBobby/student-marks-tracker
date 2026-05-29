/**
 * DELETE /api/students/[id]  — Soft-deletes a student (sets isActive = false)
 *
 * Marks history is intentionally preserved in the DB (per PRD Section 6.1).
 * A soft delete simply hides the student from all active queries.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
  }

  try {
    await prisma.student.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Prisma P2025 = record not found
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    console.error('[DELETE /api/students/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to remove student' },
      { status: 500 },
    );
  }
}
