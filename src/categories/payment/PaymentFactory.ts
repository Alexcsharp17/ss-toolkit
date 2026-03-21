import { IPaymentProvider, PaymentProviderConfig } from './interfaces/IPaymentProvider';
import { CryptomusAdapter } from './adapters/CryptomusAdapter';
import { BitCartAdapter } from './adapters/BitCartAdapter';

export type PaymentProviderType = 'cryptomus' | 'bitcart';

/**
 * Factory for creating payment provider adapters
 */
export class PaymentFactory {
  static create(config: PaymentProviderConfig): IPaymentProvider {
    const provider = (config.provider ?? '').toLowerCase();
    switch (provider) {
      case 'cryptomus':
        return new CryptomusAdapter(config);
      case 'bitcart':
        return new BitCartAdapter(config);
      default:
        throw new Error(`Unknown payment provider: ${config.provider}`);
    }
  }

  static getSupportedProviders(): PaymentProviderType[] {
    return ['cryptomus', 'bitcart'];
  }
}
