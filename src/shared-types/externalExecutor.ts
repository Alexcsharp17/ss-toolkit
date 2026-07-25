/**
 * Compatibility barrel for the external executor contract.
 *
 * New platform-neutral integrations should import from externalExecutorCore;
 * platform-specific payloads and aliases live in their extension module.
 */
export * from './externalExecutorCore';
export * from './instagramExecutor';

import { INSTAGRAM_EXECUTOR_PLATFORM } from './instagramExecutor';

/** Registered first-party platform extensions. Core accepts any string platform. */
export const EXTERNAL_EXECUTOR_PLATFORMS = [INSTAGRAM_EXECUTOR_PLATFORM] as const;
export type RegisteredExternalExecutorPlatform = typeof EXTERNAL_EXECUTOR_PLATFORMS[number];
