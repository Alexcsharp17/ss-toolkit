/** Hints passed into profile-generation prompts (UI / API). */
export interface ProfileGenerationPromptHints {
  gender?: string;
  locale?: string;
  /** ISO 3166-1 alpha-2 (e.g. US) or empty for worldwide. */
  countryPreset?: string;
  ageMin?: number;
  ageMax?: number;
  profession?: string;
  /** Free text or comma-separated interests. */
  interests?: string;
}

export interface ProfileGenerationTemplateSlice {
  firstName?: string;
  lastName?: string;
  bio?: string;
  /** Template @handle without @ — hint for username style. */
  userTag?: string;
}

export type ProfileGenerationRegenerateField = 'firstName' | 'lastName' | 'bio' | 'username';

/** Current satisfied profile slice — keys not in regenerateOnly must match exactly in JSON. */
export interface ProfileGenerationLockedNameBio {
  firstName: string;
  lastName: string;
  bio: string;
  /** Telegram username without @ */
  username: string;
}
