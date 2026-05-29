'use client';

import { useState, useCallback, useEffect } from 'react';
import { Student } from '@/lib/types';
import StudentSidebar from '@/components/StudentSidebar';
import Calendar from '@/components/Calendar';

export default function HomePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  // Incrementing this key forces the Calendar to re-fetch marks after changes
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students');
      if (!res.ok) throw new Error('Failed to fetch students');
      const data: Student[] = await res.json();
      setStudents(data);
    } catch (err) {
      console.error('[HomePage] Failed to load students:', err);
    }
  }, []);

  // Load students on mount
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleStudentAdded = useCallback(() => {
    fetchStudents();
    // Also refresh calendar so new student grey pills appear immediately
    setCalendarRefreshKey(k => k + 1);
  }, [fetchStudents]);

  const handleStudentRemoved = useCallback(() => {
    fetchStudents();
    // Refresh calendar so removed student pills disappear
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
      />

      <main className="main-content">
        <Calendar
          students={students}
          refreshKey={calendarRefreshKey}
          onMarksUpdated={() => setCalendarRefreshKey(k => k + 1)}
        />
      </main>
    </div>
  );
}
