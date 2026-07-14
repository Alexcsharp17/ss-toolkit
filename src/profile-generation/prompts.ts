import type {
  ProfileGenerationLockedNameBio,
  ProfileGenerationPromptHints,
  ProfileGenerationRegenerateField,
  ProfileGenerationTemplateSlice,
} from './types';
import { TELEGRAM_PROFILE_BIO_MAX_LENGTH } from './constants';

const JSON_FOUR = '{"firstName":"...","lastName":"...","bio":"...","username":"..."}';

/** System prompt with explicit bio cap (same number as in user message “Bio character limit”). */
export function buildProfileGenerationSystemPrompt(maxBioChars: number): string {
  return `You generate realistic Telegram profile fields for a single account.
Return ONLY a compact JSON object with keys: firstName, lastName, bio, username (all strings). No markdown, no code fences, no commentary.
Rules:
- firstName and lastName: human names appropriate to hints (gender, country, age). No @, no URLs, no emojis in names unless culturally typical as single character (prefer none).
- bio: HARD LIMIT ${maxBioChars} characters for the "bio" JSON string — count every character (letters, spaces, punctuation, emoji). Never output a bio longer than ${maxBioChars}. Before you write, plan length. The bio must read as **finished**: end on a full sentence or natural phrase (period or equivalent). If the idea does not fit, write a shorter complete bio — never stop mid-word, mid-sentence, or with an ellipsis trick. Natural first-person or neutral tone, light emoji OK if fitting. Never invent URLs.
- username: Telegram handle rules — 5 to 32 characters, lowercase Latin a-z, digits 0-9, underscore _ only. No @ in the value. Latin only (no Cyrillic). Simple real-word handles are almost always taken on Telegram — make the username LOOK hard to collide: MUST include at least two digit characters (0-9) total, mixed with letters (e.g. m4ria_k_09, river_alex_42, k_n0va_18). Prefer 8–16 characters when possible. Use underscores to break words; you may put digits in the middle, as a suffix, or split (e.g. ann_7_lee_03). Avoid only sequential zeros (user00000) or only birth-year clichés; still keep it human-plausible, not random gibberish.
- Match locale if given for names/bio; username stays Latin.
- Do not repeat boilerplate like "Telegram user" — tie vibe to profession/interests when provided.`;
}

/** @deprecated Use buildProfileGenerationSystemPrompt(TELEGRAM_PROFILE_BIO_MAX_LENGTH) — kept for default Telegram cap. */
export const PROFILE_GENERATION_SYSTEM_PROMPT = buildProfileGenerationSystemPrompt(TELEGRAM_PROFILE_BIO_MAX_LENGTH);

function formatHintsBlock(h: ProfileGenerationPromptHints): string {
  const lines: string[] = [];
  if (h.gender?.trim()) lines.push(`gender: ${h.gender.trim()}`);
  if (h.countryPreset?.trim()) lines.push(`country: ${h.countryPreset.trim()}`);
  if (h.ageMin != null || h.ageMax != null) lines.push(`age_range: ${h.ageMin ?? '?'}–${h.ageMax ?? '?'}`);
  if (h.profession?.trim()) lines.push(`profession: ${h.profession.trim()}`);
  if (h.interests?.trim()) lines.push(`interests: ${h.interests.trim()}`);
  if (h.locale?.trim()) lines.push(`locale/language: ${h.locale.trim()}`);
  return lines.length ? lines.join('\n') : '(no extra hints — pick a coherent persona)';
}

function bioLimitBlock(maxBioChars: number): string {
  return `Bio character limit (strict): at most ${maxBioChars} characters for the "bio" field — count spaces, punctuation, and emoji. The bio string in your JSON MUST be ≤ ${maxBioChars} characters. It MUST be syntactically and semantically complete (proper ending, no cut-off words). If a longer story does not fit, write a shorter self-contained bio.`;
}

export function buildProfileGenerationUserMessage(params: {
  hints: ProfileGenerationPromptHints;
  template?: ProfileGenerationTemplateSlice;
  /** When set with lockedProfile: regenerate only this key; others must match lockedProfile exactly in JSON. */
  regenerateOnly?: ProfileGenerationRegenerateField;
  lockedProfile?: ProfileGenerationLockedNameBio;
  /** Telegram About / panel cap; must match parseProfileGenerationJson + UI. Default: TELEGRAM cap. */
  maxBioChars?: number;
}): string {
  const { hints, template, regenerateOnly, lockedProfile, maxBioChars = TELEGRAM_PROFILE_BIO_MAX_LENGTH } = params;
  const hintBlock = formatHintsBlock(hints);
  const bioBlock = bioLimitBlock(maxBioChars);
  let ref = '';
  if (template && (template.firstName || template.bio || template.userTag)) {
    ref = `\nTone reference from template (do not copy verbatim; invent a fresh consistent persona):\nfirstName: ${template.firstName ?? ''}\nlastName: ${template.lastName ?? ''}\nbio_sample: ${(template.bio ?? '').slice(0, 200)}\nusername_hint (no @): ${(template.userTag ?? '').replace(/^@/, '')}`;
  }

  if (regenerateOnly && lockedProfile) {
    const lock = `Current profile (strings must match EXACTLY for keys you are NOT regenerating — character for character, including empty strings):\nfirstName: ${lockedProfile.firstName}\nlastName: ${lockedProfile.lastName}\nbio: ${lockedProfile.bio}\nusername: ${lockedProfile.username}`;
    let instr: string;
    if (regenerateOnly === 'firstName') {
      instr =
        'Regenerate ONLY firstName. Return JSON with all four keys; lastName, bio, and username MUST equal the current profile lines above exactly.';
    } else if (regenerateOnly === 'lastName') {
      instr =
        'Regenerate ONLY lastName. Return JSON with all four keys; firstName, bio, and username MUST equal the current profile lines above exactly.';
    } else if (regenerateOnly === 'bio') {
      instr =
        'Regenerate ONLY bio. Return JSON with all four keys; firstName, lastName, and username MUST equal the current profile lines above exactly.';
    } else {
      instr =
        'Regenerate ONLY username to a NEW Telegram-style handle that is unlikely to be taken: MUST include at least two digits (0-9), mix letters/underscores, 5–32 chars, same Telegram character rules as above. Return JSON with all four keys; firstName, lastName, and bio MUST equal the current profile lines above exactly.';
    }
    return `${instr}\n\n${bioBlock}\n\nHints:\n${hintBlock}${ref}\n\n${lock}\n\nOutput JSON only: ${JSON_FOUR}`;
  }

  return `Generate firstName, lastName, bio, and username for this persona.\n\n${bioBlock}\n\nHints:\n${hintBlock}${ref}\n\nOutput JSON only: ${JSON_FOUR}`;
}
