import { Fingerprint } from '../../models/fingerprint/Fingerprint';
import { FingerprintOptions } from '../../models/fingerprint/FingerprintOptions';
import { IFingerprintGenerator, FingerprintProviderConfig } from './interfaces/IFingerprintGenerator';
import { FingerprintFactory } from './FingerprintFactory';
import type { IProviderSelector } from '../../core/loadbalancer/IProviderSelector';

export interface FingerprintServiceOptions {
  providers: FingerprintProviderConfig[];
  selector?: IProviderSelector<FingerprintProviderConfig>;
}

/**
 * Service layer for fingerprint generation with provider selection
 */
export class FingerprintService {
  private readonly options: FingerprintServiceOptions;

  constructor(options: FingerprintServiceOptions) {
    this.options = options;
  }

  async generateFingerprint(
    options?: FingerprintOptions,
    providerName?: string
  ): Promise<Fingerprint> {
    const provider = providerName
      ? this.options.providers.find(
          (p) => p.provider.toLowerCase() === providerName.toLowerCase()
        )
      : this.selectProvider();

    if (!provider) {
      throw new Error(`Fingerprint provider not found: ${providerName ?? 'default'}`);
    }

    const generator = FingerprintFactory.create(provider);
    return generator.generateFingerprint(options);
  }

  async injectIntoBrowser(
    browser: unknown,
    options?: FingerprintOptions,
    providerName?: string
  ): Promise<unknown> {
    const provider = providerName
      ? this.options.providers.find(
          (p) => p.provider.toLowerCase() === providerName.toLowerCase()
        )
      : this.selectProvider();

    if (!provider) {
      throw new Error(`Fingerprint provider not found: ${providerName ?? 'default'}`);
    }

    const generator = FingerprintFactory.create(provider);
    if (!generator.injectIntoBrowser) {
      throw new Error(`Provider ${provider.provider} does not support browser injection`);
    }
    return generator.injectIntoBrowser(browser, options);
  }

  private selectProvider(): FingerprintProviderConfig | undefined {
    if (this.options.selector) {
      return this.options.selector.select(this.options.providers);
    }
    return this.options.providers.find((p) => {
      const generator = FingerprintFactory.create(p);
      return generator.isConfigured();
    });
  }
}
