'use client';

import { Remark, getRemarkColor } from '@/lib/remarks';

interface StudentPillProps {
  name: string;
  remark: string | null;
}

export default function StudentPill({ name, remark }: StudentPillProps) {
  const isFilled = !!remark;
  const bgColor = getRemarkColor(remark as Remark | null);

  return (
    <span
      className={isFilled ? 'pill-filled' : 'pill-empty'}
      style={isFilled ? { backgroundColor: bgColor } : undefined}
      title={isFilled ? `${name} — ${remark}` : `${name} — No mark`}
    >
      {isFilled ? `${name} · ${remark}` : name}
    </span>
  );
}
