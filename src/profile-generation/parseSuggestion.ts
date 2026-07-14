import { PROFILE_GENERATION_MAX_BIO_LENGTH, TELEGRAM_PROFILE_BIO_MAX_LENGTH } from './constants';
import { sanitizeTelegramUsernameCandidate } from './usernameSanitize';

export interface ParsedProfileSuggestion {
  firstName: string;
  lastName: string;
  bio: string;
  /** Telegram username without @; sanitized to allowed characters/length. */
  username: string;
}

/** Strip optional ```json ... ``` wrapper. */
function extractJsonObject(raw: string): string | null {
  const t = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
  const inner = fence ? fence[1].trim() : t;
  const start = inner.indexOf('{');
  const end = inner.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  return inner.slice(start, end + 1);
}

export function parseProfileGenerationJson(
  raw: string,
  options?: { maxBioLength?: number },
): ParsedProfileSuggestion | null {
  if (!raw || typeof raw !== 'string') return null;
  const jsonStr = extractJsonObject(raw);
  if (!jsonStr) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(jsonStr);
  } catch {
    return null;
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  const rec = obj as Record<string, unknown>;
  const firstName = typeof rec.firstName === 'string' ? rec.firstName.trim() : '';
  const lastName = typeof rec.lastName === 'string' ? rec.lastName.trim() : '';
  const bio = typeof rec.bio === 'string' ? rec.bio.trim() : '';
  if (!firstName || !bio) return null;
  const maxBio =
    options?.maxBioLength ??
    TELEGRAM_PROFILE_BIO_MAX_LENGTH;
  const clampCap = Math.min(PROFILE_GENERATION_MAX_BIO_LENGTH, Math.max(1, maxBio));
  const bioClamped = bio.length > clampCap ? bio.slice(0, clampCap) : bio;
  const rawUsername = typeof rec.username === 'string' ? rec.username.trim() : '';
  const username = rawUsername ? sanitizeTelegramUsernameCandidate(rawUsername) : '';
  return { firstName, lastName: lastName || '', bio: bioClamped, username };
}
