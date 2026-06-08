'use client';

import { useState, useEffect, useRef } from 'react';
import { Student, DayMark } from '@/lib/types';
import { getRemark, getRemarkColor, Remark } from '@/lib/remarks';
import { X, AlertTriangle } from 'lucide-react';
import StudentPill from './StudentPill';

interface MarkModalProps {
  date: Date;
  students: Student[];
  existingMarks: DayMark[];
  onClose: () => void;
  onSave: () => void;
}

function formatDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function MarkModal({ date, students, existingMarks, onClose, onSave }: MarkModalProps) {
  // Map of studentId -> { mark: number | null, id: number | null }
  const [localMarks, setLocalMarks] = useState<Record<number, { mark: number | null; id: number | null }>>(() => {
    const initial: Record<number, { mark: number | null; id: number | null }> = {};
    students.forEach(student => {
      const existing = existingMarks.find(m => m.studentId === student.id);
      initial[student.id] = {
        mark: existing ? existing.mark : null,
        id: existing ? existing.id : null,
      };
    });
    return initial;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Soft warning for future dates
  const isFutureDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const modalDate = new Date(date);
    modalDate.setHours(0, 0, 0, 0);
    return modalDate > today;
  };

  // Keyboard navigation & accessibility
  // MarkModal handles its own Escape — z-index 400 means it is always topmost
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation(); // Don't bubble to page-level Escape handler
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    // Focus first input on mount
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }

    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [onClose]);

  // Handle click outside overlay
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleMarkChange = (studentId: number, valString: string) => {
    setError(null);
    if (valString === '') {
      setLocalMarks(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], mark: null },
      }));
      return;
    }

    const val = parseInt(valString, 10);
    if (isNaN(val) || val < 1 || val > 10) return; // Keep input bounded between 1 and 10

    setLocalMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], mark: val },
    }));
  };

  const handleClear = (studentId: number) => {
    setError(null);
    setLocalMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], mark: null },
    }));
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const dateStr = formatDateString(date);

    try {
      const apiCalls: Promise<any>[] = [];

      for (const studentIdStr in localMarks) {
        const studentId = parseInt(studentIdStr, 10);
        const current = localMarks[studentId];
        const original = existingMarks.find(m => m.studentId === studentId);

        // 1. Cleared an existing mark -> DELETE
        if (current.mark === null && original !== undefined) {
          apiCalls.push(
            fetch(`/api/marks/${original.id}`, { method: 'DELETE' }).then(async res => {
              if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete mark');
              }
            })
          );
        }
        // 2. Set or updated a mark -> POST (Upsert)
        else if (current.mark !== null && (original === undefined || original.mark !== current.mark)) {
          apiCalls.push(
            fetch('/api/marks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                studentId,
                date: dateStr,
                mark: current.mark,
              }),
            }).then(async res => {
              if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save mark');
              }
            })
          );
        }
      }

      if (apiCalls.length > 0) {
        await Promise.all(apiCalls);
      }

      onSave(); // Refresh data in parent
      onClose(); // Dismiss modal
    } catch (err: any) {
      console.error('[Save Marks Error]', err);
      setError(err.message || 'An error occurred while saving marks.');
    } finally {
      setIsSaving(false);
    }
  };

  // Sort students alphabetically
  const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name));

  return (
    /* z-index: 400 — sits above sidebar drawer (300) and scorecard (400, same level but scorecard
       closes before modal can open since they use the same interaction path) */
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      style={{ zIndex: 400 }}
    >
      <div className="modal" ref={modalRef}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 14,
        }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Daily Performance Marks
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Future Date Soft Warning */}
        {isFutureDate() && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid var(--pill-satisfactory)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 20,
            color: 'var(--pill-satisfactory)',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <AlertTriangle size={16} />
            <span>You are entering marks for a future date.</span>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid var(--pill-terrible)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 20,
            color: 'var(--pill-terrible)',
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Student List */}
        <form onSubmit={handleSaveSubmit}>
          <div style={{
            maxHeight: '45vh',
            overflowY: 'auto',
            marginBottom: 24,
            paddingRight: 6,
          }} className="sidebar-scroll">
            {sortedStudents.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                No active students. Add students in the sidebar first.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {sortedStudents.map((student, idx) => {
                  const currentRecord = localMarks[student.id] || { mark: null, id: null };
                  const currentMarkVal = currentRecord.mark;
                  const remarkStr = currentMarkVal ? getRemark(currentMarkVal) : null;

                  return (
                    <div
                      key={student.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        gap: 12,
                      }}
                    >
                      {/* Left: Name and Live Preview */}
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                          fontWeight: 500,
                          fontSize: 13,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 150,
                        }} title={student.name}>
                          {student.name}
                        </span>
                        <div style={{ flexShrink: 0 }}>
                          <StudentPill name={student.name} remark={remarkStr} />
                        </div>
                      </div>

                      {/* Right: Input and Clear Button */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          step="1"
                          ref={idx === 0 ? firstInputRef : undefined}
                          value={currentMarkVal ?? ''}
                          onChange={(e) => handleMarkChange(student.id, e.target.value)}
                          placeholder="—"
                          aria-label={`Mark for ${student.name}`}
                          style={{
                            width: 54,
                            height: 34,
                            textAlign: 'center',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            color: 'var(--text-primary)',
                            fontSize: 13,
                            fontWeight: 600,
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleClear(student.id)}
                          aria-label={`Clear mark for ${student.name}`}
                          disabled={currentMarkVal === null}
                          style={{
                            width: 28,
                            height: 28,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: 6,
                            color: currentMarkVal === null ? 'transparent' : 'var(--text-muted)',
                            cursor: currentMarkVal === null ? 'default' : 'pointer',
                            transition: 'color 0.1s',
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            borderTop: '1px solid var(--border)',
            paddingTop: 18,
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || sortedStudents.length === 0}
              style={{
                background: 'var(--accent)',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                opacity: (isSaving || sortedStudents.length === 0) ? 0.6 : 1,
              }}
            >
              {isSaving ? 'Saving...' : 'Save Marks'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
