/**
 * DELETE /api/marks/[id]  — Permanently removes a single mark entry
 *
 * This is a hard delete (unlike student removal which is a soft delete).
 * Clearing a mark via the modal calls this route, returning the pill to the
 * grey hollow "no mark" state.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid mark ID' }, { status: 400 });
  }

  try {
    await prisma.mark.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Mark not found' }, { status: 404 });
    }
    console.error('[DELETE /api/marks/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to delete mark' },
      { status: 500 },
    );
  }
}
