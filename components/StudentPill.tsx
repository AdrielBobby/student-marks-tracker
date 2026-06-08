'use client';

import { Remark, getRemarkColor } from '@/lib/remarks';
import { getInitials } from '@/lib/utils';

interface StudentPillProps {
  name: string;
  remark: string | null;
  /** "pill" (default) — full desktop chip with name · remark
   *  "avatar"          — 24px initials circle for mobile calendar cells */
  variant?: 'pill' | 'avatar';
}

export default function StudentPill({ name, remark, variant = 'pill' }: StudentPillProps) {
  const isFilled = !!remark;
  const bgColor  = getRemarkColor(remark as Remark | null);

  // ── Avatar mode ────────────────────────────────────────────────────────────
  if (variant === 'avatar') {
    return (
      <span
        className="cell-avatar"
        style={{ background: isFilled ? bgColor : 'var(--border)' }}
        title={isFilled ? `${name} — ${remark}` : `${name} — No mark`}
        aria-label={isFilled ? `${name}: ${remark}` : `${name}: no mark`}
      >
        {getInitials(name)}
      </span>
    );
  }

  // ── Default pill mode ──────────────────────────────────────────────────────
  return (
    <span
      className={isFilled ? 'pill-filled' : 'pill-empty'}
      style={isFilled ? { backgroundColor: bgColor } : undefined}
      title={isFilled ? `${name} — ${remark}` : `${name} — No mark`}
    >
      {name}
      {isFilled && (
        <span className="pill-remark"> · {remark}</span>
      )}
    </span>
  );
}
