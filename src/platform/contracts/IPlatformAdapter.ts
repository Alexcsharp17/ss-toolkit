import type { PlatformCode, ProfileExecutionContext, ProfilePatch, ProfileResult } from './types';

export interface IPlatformAdapter {
  readonly platform: PlatformCode;

  updateProfile(ctx: ProfileExecutionContext, patch: ProfilePatch): Promise<ProfileResult>;
}
