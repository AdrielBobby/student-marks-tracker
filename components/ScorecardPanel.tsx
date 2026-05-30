'use client';

import { useState, useEffect, useRef } from 'react';
import { ScorecardData } from '@/lib/types';
import { getRemarkColor, Remark } from '@/lib/remarks';

interface ScorecardPanelProps {
  studentId: number | null;
  onClose: () => void;
}

const REMARK_BANDS: Array<{ key: keyof ScorecardData['remarkCounts']; color: string }> = [
  { key: 'Terrible',     color: '#ef4444' },
  { key: 'Satisfactory', color: '#f59e0b' },
  { key: 'Good',         color: '#10b981' },
  { key: 'Excellent',    color: '#3b82f6' },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

export default function ScorecardPanel({ studentId, onClose }: ScorecardPanelProps) {
  const [data, setData] = useState<ScorecardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isOpen = studentId !== null;

  useEffect(() => {
    if (!isOpen) {
      // Delay clear so slide-out animation finishes
      const t = setTimeout(() => { setData(null); setError(null); }, 300);
      return () => clearTimeout(t);
    }

    setIsLoading(true);
    setError(null);

    fetch(`/api/students/${studentId}/scorecard`)
      .then(async res => {
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Failed to load scorecard');
        }
        return res.json();
      })
      .then(setData)
      .catch(err => {
        console.error('[Scorecard]', err);
        setError(err.message || 'Failed to load scorecard');
      })
      .finally(() => setIsLoading(false));
  }, [studentId, isOpen]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const coveragePct = data?.coverage !== null && data?.coverage !== undefined
    ? `${Math.round(data.coverage * 100)}%`
    : null;

  const totalRemarkDays = data
    ? Object.values(data.remarkCounts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 200,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Slide-over drawer */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Student scorecard"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 380,
          maxWidth: '94vw',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '-16px 0 48px rgba(0,0,0,0.25)',
          overflowY: 'auto',
        }}
        className="sidebar-scroll"
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '24px 24px 16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          gap: 12,
        }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 6px' }}>
              Performance Scorecard
            </p>
            <h2 style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {data?.student.name ?? (isLoading ? 'Loading…' : '—')}
            </h2>
            {data?.student && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                {formatDate(data.student.startDate)} — {formatDate(data.student.endDate)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close scorecard"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '20px 24px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Loading / error states */}
          {isLoading && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>
              Loading scorecard…
            </p>
          )}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid #ef4444',
              borderRadius: 10,
              padding: '12px 16px',
              color: '#ef4444',
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {data && !isLoading && (
            <>
              {/* Key metrics row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Average mark */}
                <div style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '16px',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Avg Mark
                  </p>
                  <p style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: data.averageMark !== null
                      ? getRemarkColor(data.averageRemark as Remark)
                      : 'var(--text-muted)',
                    margin: 0,
                    lineHeight: 1,
                  }}>
                    {data.averageMark !== null ? data.averageMark.toFixed(1) : '—'}
                  </p>
                  {data.averageRemark && (
                    <span style={{
                      display: 'inline-block',
                      marginTop: 8,
                      background: getRemarkColor(data.averageRemark as Remark),
                      color: '#fff',
                      borderRadius: 9999,
                      padding: '2px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      {data.averageRemark}
                    </span>
                  )}
                </div>

                {/* Coverage */}
                <div style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '16px',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Coverage
                  </p>
                  <p style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: 'var(--accent)',
                    margin: 0,
                    lineHeight: 1,
                  }}>
                    {coveragePct ?? '—'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '8px 0 0' }}>
                    {data.markedDaysCount} / {data.eligibleDaysCount ?? '?'} days
                  </p>
                </div>
              </div>

              {/* Remark breakdown */}
              <div style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '16px',
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 14px' }}>
                  Performance Breakdown
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {REMARK_BANDS.map(({ key, color }) => {
                    const count = data.remarkCounts[key];
                    const barWidth = totalRemarkDays > 0
                      ? `${Math.round((count / totalRemarkDays) * 100)}%`
                      : '0%';
                    return (
                      <div key={key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{key}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {count} {count === 1 ? 'day' : 'days'}
                          </span>
                        </div>
                        <div style={{
                          height: 6,
                          background: 'var(--border)',
                          borderRadius: 9999,
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: barWidth,
                            background: color,
                            borderRadius: 9999,
                            transition: 'width 0.4s ease',
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent marks */}
              {data.recentMarks.length > 0 && (
                <div style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '16px',
                }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 12px' }}>
                    Recent Marks
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.recentMarks.map((m, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: 'var(--surface)',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                      }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {formatDateShort(m.date)}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {m.mark}
                          </span>
                          <span style={{
                            background: getRemarkColor(m.remark as Remark),
                            color: '#fff',
                            borderRadius: 9999,
                            padding: '1px 8px',
                            fontSize: 10,
                            fontWeight: 600,
                          }}>
                            {m.remark}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state for no marks */}
              {data.recentMarks.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>
                  No marks recorded yet.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
