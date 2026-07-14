/** Telegram @username: 5–32 chars, Latin letters, digits, underscore (no leading @). */
const MIN_LEN = 5;
const MAX_LEN = 32;

/**
 * Normalizes a model output or user paste into a valid Telegram username fragment (no `@`).
 * Strips invalid characters, lowercases, pads with digits if shorter than 5 (Telegram minimum).
 */
export function sanitizeTelegramUsernameCandidate(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let s = raw.replace(/^@/, '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!s) return '';
  if (s.length > MAX_LEN) s = s.slice(0, MAX_LEN);
  while (s.length < MIN_LEN) {
    s += String(Math.floor(Math.random() * 10));
    if (s.length > MAX_LEN) s = s.slice(0, MAX_LEN);
  }
  return s.slice(0, MAX_LEN);
}
