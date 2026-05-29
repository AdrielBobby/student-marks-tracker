/**
 * GET  /api/students  — Returns all active students sorted A→Z
 * POST /api/students  — Creates a new student
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      where: { isActive: true },
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

    const student = await prisma.student.create({ data: { name } });
    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error('[POST /api/students]', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 },
    );
  }
}
