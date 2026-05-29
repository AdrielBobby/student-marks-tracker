// lib/types.ts
// Shared TypeScript interfaces used across components and API routes.
// These mirror the Prisma models but are plain serializable objects
// (dates are strings after JSON serialisation from the API).

export interface Student {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface Mark {
  id: number;
  studentId: number;
  /** ISO date string — time component is always midnight UTC */
  date: string;
  mark: number;
  remark: string;
  createdAt: string;
  updatedAt: string;
  student?: Student;
}

/** The subset of a Mark that the calendar needs per student per day */
export interface DayMark {
  id: number;
  studentId: number;
  mark: number;
  remark: string;
}
