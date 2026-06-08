'use client';

import { useState, useCallback, useEffect } from 'react';
import { Student } from '@/lib/types';
import StudentSidebar from '@/components/StudentSidebar';
import Calendar from '@/components/Calendar';
import ScorecardPanel from '@/components/ScorecardPanel';
import { ChevronDown } from 'lucide-react';

export default function HomePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const [scorecardStudentId, setScorecardStudentId] = useState<number | null>(null);
  
  // Mobile responsive state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  // Handle body scroll locking when any overlay is open
  useEffect(() => {
    const isOverlayOpen = isMobileSidebarOpen || selectedDate !== null || scorecardStudentId !== null;
    
    if (isOverlayOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileSidebarOpen, selectedDate, scorecardStudentId]);

  const handleStudentAdded = useCallback(() => {
    fetchStudents();
    setCalendarRefreshKey(k => k + 1);
  }, [fetchStudents]);

  const handleStudentRemoved = useCallback(() => {
    fetchStudents();
    setCalendarRefreshKey(k => k + 1);
  }, [fetchStudents]);

  // Render prop for the mobile top bar that lives above the calendar
  const mobileTopBar = (
    <div className="mobile-topbar">
      <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
        Marks Tracker
      </span>
      <button
        onClick={() => setIsMobileSidebarOpen(true)}
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          color: 'var(--text-primary)',
          fontSize: 13,
          fontWeight: 500,
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
        }}
      >
        Students ({students.length})
        <ChevronDown size={14} />
      </button>
    </div>
  );

  return (
    <div className="app-layout">
      <StudentSidebar
        students={students}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        onStudentAdded={handleStudentAdded}
        onStudentRemoved={handleStudentRemoved}
        onOpenScorecard={setScorecardStudentId}
        mobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      <main className="main-content">
        <Calendar
          students={students}
          refreshKey={calendarRefreshKey}
          onMarksUpdated={() => setCalendarRefreshKey(k => k + 1)}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          mobileTopBar={mobileTopBar}
        />
      </main>

      {/* Scorecard slide-over / bottom-sheet */}
      <ScorecardPanel
        studentId={scorecardStudentId}
        onClose={() => setScorecardStudentId(null)}
      />
    </div>
  );
}
