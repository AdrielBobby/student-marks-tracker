// lib/remarks.ts
// Remark derivation and colour logic as specified in PRD Section 6.2 and 11.
// This module is shared between server-side API routes (where remark is computed
// before storing) and client-side components (for live preview in the modal).

export type Remark = "Terrible" | "Satisfactory" | "Good" | "Excellent";

/**
 * Derives the remark string from a numeric mark (1–10).
 * Throws for out-of-range values — validation should happen before calling this.
 */
export function getRemark(mark: number): Remark {
  if (mark >= 1 && mark <= 3)  return "Terrible";
  if (mark >= 4 && mark <= 6)  return "Satisfactory";
  if (mark >= 7 && mark <= 8)  return "Good";
  if (mark >= 9 && mark <= 10) return "Excellent";
  throw new Error(`Invalid mark: ${mark}. Must be an integer between 1 and 10.`);
}

/**
 * Returns the CSS hex colour for a filled pill background.
 * Uses hardcoded hex values (not CSS vars) so they work in inline styles
 * and are identical in both light and dark modes (per PRD).
 */
export function getRemarkColor(remark: Remark | null): string {
  switch (remark) {
    case "Terrible":     return "#ef4444";
    case "Satisfactory": return "#f59e0b";
    case "Good":         return "#10b981";
    case "Excellent":    return "#3b82f6";
    default:             return "transparent";
  }
}

/**
 * Returns the CSS class name for a pill based on its remark state.
 * Filled pills get "pill-filled"; empty / no mark gets "pill-empty".
 */
export function getPillClass(remark: Remark | null): string {
  return remark ? "pill-filled" : "pill-empty";
}

/**
 * Returns a short readable label for tooltips / aria-labels.
 */
export function getRemarkLabel(mark: number | null): string {
  if (mark === null || mark === undefined) return "No mark";
  try {
    return `${mark} — ${getRemark(mark)}`;
  } catch {
    return String(mark);
  }
}
