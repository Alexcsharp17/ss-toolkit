/**
 * Opaque runtime handle — in-process Telegram uses AccountManager, etc.
 */
export type ProfileExecutionContext = {
  /** Telegram: ActionContext (accountManager, params). Other platforms: own runtime. */
  actionContext: unknown;
};

export type ProfilePatch = {
  /** Display name (first + last handled by adapter) */
  displayName?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarPath?: string | undefined;
};

export type ProfileResult = {
  ok: boolean;
  nameApplied?: boolean;
  avatarApplied?: boolean;
  bioApplied?: boolean;
  restrictionsDetected?: string[];
};

export type PlatformCode = 'telegram' | 'twitter' | 'instagram' | 'youtube' | 'tiktok';
