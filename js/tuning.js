import { DEFAULT_TUNING } from './constants.js';

/** @returns {string[] | null} */
export function parseTuning(str) {
  const parts = str
    .split(/[,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (parts.length !== 6) return null;
  return parts.map((s) => (s.length > 4 ? s.slice(0, 4) : s));
}

export function normalizedTuningOrDefault(raw) {
  const p = parseTuning(raw);
  return p ? p.slice() : [...DEFAULT_TUNING];
}
