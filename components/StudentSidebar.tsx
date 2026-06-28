'use client';

import { useState, useEffect } from 'react';
import { Student } from '@/lib/types';
import { ChevronLeft, ChevronRight, BarChart2, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface StudentSidebarProps {
  students: Student[];
  collapsed: boolean;
  onToggle: () => void;
  onStudentAdded: () => void;
  onStudentRemoved: () => void;
  onOpenScorecard: (studentId: number) => void;
  // Mobile props
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function StudentSidebar({
  students,
  collapsed,
  onToggle,
  onStudentAdded,
  onStudentRemoved,
  onOpenScorecard,
  mobileOpen,
  onMobileClose,
}: StudentSidebarProps) {
  const [newStudentName, setNewStudentName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── KEY FIX: on mobile the sheet must always show full content
  // regardless of the desktop collapsed state.
  const showFullContent = !collapsed || mobileOpen;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newStudentName.trim();
    if (!name) return;

    if (name.length > 100) {
      setError('Name must be 100 characters or less');
      return;
    }

    // Client-side date validation — both dates are mandatory
    if (!startDate) {
      setError('Start date is required');
      return;
    }
    if (!endDate) {
      setError('End date is required');
      return;
    }
    if (endDate < startDate) {
      setError('End date must be after start date');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const body: Record<string, string> = { name, startDate, endDate };

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add student');
      }

      setNewStudentName('');
      setStartDate('');
      setEndDate('');
      onStudentAdded();
    } catch (err: any) {
      console.error('[Add Student Error]', err);
      setError(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: number, name: string) => {
    const confirmed = window.confirm(
      `Remove ${name} from active views?\n\nExisting marks will be preserved in history, but the student will no longer appear in the active list.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove student');
      }
      onStudentRemoved();
    } catch (err: any) {
      console.error('[Remove Student Error]', err);
      alert(err.message || 'An error occurred while removing the student.');
    }
  };

  const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name));

  // Shared input style
  const inputStyle: React.CSSProperties = {
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '7px 10px',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    width: '100%',
    colorScheme: 'dark',
  };

  // Escape key closes the mobile bottom sheet
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mobileOpen, onMobileClose]);

  return (
    <>
      {/* Mobile Backdrop (z-index 299) — covers full viewport behind the sheet */}
      <div
        className="mobile-backdrop"
        onClick={onMobileClose}
        style={{
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? 'auto' : 'none',
          transition: 'opacity 0.22s ease',
        }}
      />

      {/* Sidebar / Bottom Sheet
          Desktop: position relative, width driven by collapsed state.
          Mobile:  position fixed bottom sheet — width/minWidth NOT set inline
                   so the CSS `width: 100%` can take over cleanly.
      */}
      <aside
        className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}
        style={
          mobileOpen
            ? undefined   // let CSS bottom-sheet styles take full control
            : {
                width:    collapsed ? 52 : 260,
                minWidth: collapsed ? 52 : 260,
                transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }
        }
      >
        {/* Drag handle — visible only on mobile, hidden on desktop via CSS */}
        <div className="mobile-drag-handle" aria-hidden="true" />

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: showFullContent ? 'space-between' : 'center',
          padding: '0 14px',
          height: 60,
          borderBottom: '1px solid var(--border)',
          gap: 8,
          flexShrink: 0,
        }}>
          {showFullContent && (
            <span style={{
              fontSize: 20,
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              Marks Tracker
            </span>
          )}

          <div style={{ display: 'flex', gap: 6 }}>
            {/* Desktop collapse toggle — hidden on mobile via CSS */}
            <button
              id="sidebar-toggle-btn"
              className="desktop-sidebar-toggle sidebar-icon-btn"
              onClick={onToggle}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {/* Mobile close button — hidden on desktop via CSS */}
            <button
              className="mobile-sidebar-close sidebar-icon-btn"
              onClick={onMobileClose}
              aria-label="Close panel"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body — only rendered when sidebar is expanded OR on mobile */}
        {showFullContent && (
          <>
            {/* Student count */}
            <div style={{ padding: '12px 14px 8px' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Active Today ({students.length})
              </span>
            </div>

            {/* Add Student Form */}
            <div style={{ padding: '0 14px 14px', borderBottom: '1px solid var(--border)' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={e => { setNewStudentName(e.target.value); setError(null); }}
                  placeholder="Student name..."
                  required
                  maxLength={100}
                  style={inputStyle}
                />

                {/* Internship dates — always visible, required */}
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                  Internship dates
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Start date</label>
                    <input
                      type="date"
                      value={startDate}
                      required
                      onChange={e => { setStartDate(e.target.value); setError(null); }}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>End date</label>
                    <input
                      type="date"
                      value={endDate}
                      required
                      min={startDate || undefined}
                      onChange={e => { setEndDate(e.target.value); setError(null); }}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !newStudentName.trim()}
                  style={{
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    width: '100%',
                    opacity: (isSubmitting || !newStudentName.trim()) ? 0.6 : 1,
                    transition: 'background 0.1s',
                  }}
                >
                  {isSubmitting ? 'Adding…' : 'Add Student'}
                </button>

                {error && (
                  <span style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>
                    {error}
                  </span>
                )}
              </form>
            </div>

            {/* Student list */}
            <div className="sidebar-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
              {sortedStudents.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>
                  No active students today.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {sortedStudents.map(student => (
                    <div
                      key={student.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        gap: 6,
                        minWidth: 0,
                      }}
                    >
                      {/* Name — clickable to open scorecard */}
                      <button
                        onClick={() => {
                          if (mobileOpen) onMobileClose();
                          onOpenScorecard(student.id);
                        }}
                        aria-label={`View scorecard for ${student.name}`}
                        title="View scorecard"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          flex: 1,
                          minWidth: 0,
                          textAlign: 'left',
                          cursor: 'pointer',
                          color: 'var(--text-primary)',
                          fontSize: 13,
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {student.name}
                      </button>

                      {/* Scorecard icon */}
                      <button
                        onClick={() => {
                          if (mobileOpen) onMobileClose();
                          onOpenScorecard(student.id);
                        }}
                        aria-label={`Scorecard for ${student.name}`}
                        title="View scorecard"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 24,
                          height: 24,
                          borderRadius: 4,
                          padding: 0,
                          flexShrink: 0,
                          transition: 'background 0.1s, color 0.1s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(13, 148, 136, 0.15)';
                          e.currentTarget.style.color = 'var(--accent)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-muted)';
                        }}
                      >
                        <BarChart2 size={15} />
                      </button>

                      {/* Remove button */}
                      <button
                        onClick={() => handleRemove(student.id, student.name)}
                        aria-label={`Remove ${student.name}`}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 24,
                          height: 24,
                          borderRadius: 4,
                          padding: 0,
                          flexShrink: 0,
                          transition: 'background 0.1s, color 0.1s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                          e.currentTarget.style.color = '#ef4444';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-muted)';
                        }}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <div style={{
              padding: '14px 16px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Theme</span>
              <ThemeToggle />
            </div>
          </>
        )}
      </aside>
    </>
  );
}
