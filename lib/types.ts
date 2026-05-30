// lib/types.ts
// Shared TypeScript interfaces used across components and API routes.
// These mirror the Prisma models but are plain serializable objects
// (dates are strings after JSON serialisation from the API).

export interface Student {
  id: number;
  name: string;
  isActive: boolean;
  /** ISO date string (YYYY-MM-DD) or null if no internship start defined */
  startDate: string | null;
  /** ISO date string (YYYY-MM-DD) or null if no internship end defined */
  endDate: string | null;
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

/** A single mark entry in the scorecard recent-marks list */
export interface RecentMark {
  date: string;
  mark: number;
  remark: string;
}

/** Aggregate scorecard data returned by GET /api/students/[id]/scorecard */
export interface ScorecardData {
  student: Student;
  /** Arithmetic mean of all saved marks, null if no marks exist */
  averageMark: number | null;
  /** Remark band derived from averageMark, null if no marks */
  averageRemark: string | null;
  /** Total number of mark records for this student */
  markedDaysCount: number;
  /**
   * Number of calendar days in the internship window up to today.
   * null if neither startDate nor endDate is defined.
   */
  eligibleDaysCount: number | null;
  /** markedDaysCount / eligibleDaysCount, null if eligibleDaysCount is null or zero */
  coverage: number | null;
  /** Per-remark-band day counts */
  remarkCounts: {
    Terrible: number;
    Satisfactory: number;
    Good: number;
    Excellent: number;
  };
  /** Last 10 marks ordered by date descending */
  recentMarks: RecentMark[];
}
