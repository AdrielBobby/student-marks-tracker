'use client';

import { useState, useCallback, useEffect } from 'react';
import { Student } from '@/lib/types';
import StudentSidebar from '@/components/StudentSidebar';
import Calendar from '@/components/Calendar';
import ScorecardPanel from '@/components/ScorecardPanel';

export default function HomePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const [scorecardStudentId, setScorecardStudentId] = useState<number | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      // Default scope = activeToday (students with active internship window)
      const res = await fetch('/api/students');
      if (!res.ok) throw new Error('Failed to fetch students');
      const data: Student[] = await res.json();
      setStudents(data);
    } catch (err) {
      console.error('[HomePage] Failed to load students:', err);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleStudentAdded = useCallback(() => {
    fetchStudents();
    setCalendarRefreshKey(k => k + 1);
  }, [fetchStudents]);

  const handleStudentRemoved = useCallback(() => {
    fetchStudents();
    setCalendarRefreshKey(k => k + 1);
  }, [fetchStudents]);

  return (
    <div className="app-layout">
      <StudentSidebar
        students={students}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        onStudentAdded={handleStudentAdded}
        onStudentRemoved={handleStudentRemoved}
        onOpenScorecard={setScorecardStudentId}
      />

      <main className="main-content">
        <Calendar
          students={students}
          refreshKey={calendarRefreshKey}
          onMarksUpdated={() => setCalendarRefreshKey(k => k + 1)}
        />
      </main>

      {/* Scorecard slide-over — rendered at root so it overlays everything */}
      <ScorecardPanel
        studentId={scorecardStudentId}
        onClose={() => setScorecardStudentId(null)}
      />
    </div>
  );
}
