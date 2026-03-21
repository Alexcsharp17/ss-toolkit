import { Fingerprint } from '../../../models/fingerprint/Fingerprint';

/**
 * Native fingerprint-generator output format (simplified)
 */
export interface ApifyFingerprintNative {
  fingerprint?: {
    screen?: Record<string, number>;
    navigator?: Record<string, unknown>;
    videoCard?: Record<string, unknown>;
    audioCodecs?: unknown;
  };
  headers?: Record<string, string>;
}

export function toFingerprint(native: ApifyFingerprintNative, options?: { device?: string; os?: string; browser?: string }): Fingerprint {
  const fp = native.fingerprint ?? {};
  const screen = fp.screen ?? {};
  const navigator = fp.navigator ?? {};

  return {
    device: options?.device ?? String(navigator.device ?? 'desktop'),
    os: options?.os ?? String(navigator.platform ?? 'windows'),
    browser: options?.browser ?? String(navigator.userAgent ?? 'chrome').slice(0, 50),
    screen,
    webgl: fp.videoCard as Record<string, unknown> | undefined,
    headers: native.headers,
    rawData: native as unknown,
  };
}
