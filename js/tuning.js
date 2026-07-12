import { DEFAULT_TUNING } from './constants.js';

/** @returns {string[] | null} */
export function parseTuning(str, stringCount = DEFAULT_TUNING.length) {
  const parts = str
    .split(/[,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (parts.length !== stringCount) return null;
  return parts.map((s) => (s.length > 4 ? s.slice(0, 4) : s));
}

export function normalizedTuningOrDefault(raw, defaultTuning = DEFAULT_TUNING) {
  const p = parseTuning(raw, defaultTuning.length);
  return p ? p.slice() : [...defaultTuning];
}
