/**
 * lib/utils.ts
 * Pure string/data utility helpers shared across the app.
 * No imports from other project modules — keeps this side-effect free.
 */

/**
 * Derives initials from a student name string.
 *
 * Rules (matching PRD Section 6C):
 *   - Two-word name  → first letter of word 1 + first letter of word 2  (e.g. "Aaromal Varghese" → "AV")
 *   - Single word    → first two letters of the name                      (e.g. "Adriel" → "AD", "Jo" → "JO")
 *   - Always uppercased.
 *
 * @param name  Student's full name string (may have leading/trailing whitespace)
 * @returns     1–2 uppercase initials
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  // Single word — take first two characters (handles single-char names gracefully)
  return name.slice(0, 2).toUpperCase();
}
