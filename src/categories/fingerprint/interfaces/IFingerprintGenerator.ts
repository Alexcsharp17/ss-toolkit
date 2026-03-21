import { Fingerprint } from '../../../models/fingerprint/Fingerprint';
import { FingerprintOptions } from '../../../models/fingerprint/FingerprintOptions';

/**
 * Interface for fingerprint generation providers
 */
export interface IFingerprintGenerator {
  generateFingerprint(options?: FingerprintOptions): Promise<Fingerprint>;
  injectIntoBrowser?(
    browser: unknown,
    options?: FingerprintOptions
  ): Promise<unknown>;
  getProviderName(): string;
  isConfigured(): boolean;
}

export interface FingerprintProviderConfig {
  provider: string;
  apiKey?: string;
  timeout?: number;
}
