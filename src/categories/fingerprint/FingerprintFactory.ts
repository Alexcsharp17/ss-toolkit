import { IFingerprintGenerator, FingerprintProviderConfig } from './interfaces/IFingerprintGenerator';
import { ApifyFingerprintAdapter } from './adapters/ApifyFingerprintAdapter';

export type FingerprintProviderType = 'apify';

/**
 * Factory for creating fingerprint generator adapters
 */
export class FingerprintFactory {
  static create(config: FingerprintProviderConfig): IFingerprintGenerator {
    const provider = (config.provider ?? '').toLowerCase();
    switch (provider) {
      case 'apify':
        return new ApifyFingerprintAdapter(config);
      default:
        throw new Error(`Unknown fingerprint provider: ${config.provider}`);
    }
  }

  static getSupportedProviders(): FingerprintProviderType[] {
    return ['apify'];
  }
}
