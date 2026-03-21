import { IFingerprintGenerator, FingerprintProviderConfig } from '../interfaces/IFingerprintGenerator';
import { Fingerprint } from '../../../models/fingerprint/Fingerprint';
import { FingerprintOptions } from '../../../models/fingerprint/FingerprintOptions';
import { toFingerprint, ApifyFingerprintNative } from '../mappers/ApifyFingerprintMapper';

/**
 * Apify fingerprint adapter using fingerprint-generator and fingerprint-injector
 * Requires: fingerprint-generator, fingerprint-injector, playwright
 */
export class ApifyFingerprintAdapter implements IFingerprintGenerator {
  private readonly config: FingerprintProviderConfig;

  constructor(config: FingerprintProviderConfig) {
    this.config = config;
  }

  getProviderName(): string {
    return 'apify';
  }

  isConfigured(): boolean {
    return true;
  }

  async generateFingerprint(options?: FingerprintOptions): Promise<Fingerprint> {
    const { FingerprintGenerator } = await import('fingerprint-generator');
    const generator = new FingerprintGenerator();

    const fingerprintOptions = this.mapOptions(options);
    const result = generator.getFingerprint({
      devices: fingerprintOptions.devices ?? ['desktop'],
      operatingSystems: fingerprintOptions.operatingSystems ?? ['windows'],
      browsers: fingerprintOptions.browsers,
      locales: fingerprintOptions.locales,
    }) as { fingerprint?: ApifyFingerprintNative; fingerprintBase64?: string };

    const fingerprint = result?.fingerprint ?? (result as unknown as ApifyFingerprintNative);
    return toFingerprint(fingerprint, {
      device: fingerprintOptions.devices?.[0],
      os: fingerprintOptions.operatingSystems?.[0],
      browser: fingerprintOptions.browsers?.[0],
    });
  }

  async injectIntoBrowser(browser: unknown, options?: FingerprintOptions): Promise<unknown> {
    const { newInjectedContext } = await import('fingerprint-injector');
    const fingerprintOptions = this.mapOptions(options);

    const context = await newInjectedContext(browser as import('playwright').Browser, {
      fingerprintOptions: {
        devices: fingerprintOptions.devices ?? ['desktop'],
        operatingSystems: fingerprintOptions.operatingSystems ?? ['windows'],
        browsers: fingerprintOptions.browsers,
        locales: fingerprintOptions.locales,
      },
    });

    return context;
  }

  private mapOptions(options?: FingerprintOptions): {
    devices?: string[];
    operatingSystems?: string[];
    browsers?: string[];
    locales?: string[];
  } {
    if (!options) {
      return { devices: ['desktop'], operatingSystems: ['windows'] };
    }
    return {
      devices: options.devices,
      operatingSystems: options.operatingSystems,
      browsers: options.browsers,
      locales: options.locales,
    };
  }
}
