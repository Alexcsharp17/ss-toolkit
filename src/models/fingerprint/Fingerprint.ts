/**
 * Unified browser fingerprint model
 */
export interface Fingerprint {
  device: string;
  os: string;
  browser: string;
  screen: Record<string, number>;
  webgl?: Record<string, unknown>;
  headers?: Record<string, string>;
  rawData?: unknown;
}
