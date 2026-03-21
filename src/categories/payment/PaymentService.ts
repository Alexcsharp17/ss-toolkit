import { PaymentResult } from '../../models/payment/PaymentResult';
import { IPaymentProvider, PaymentProviderConfig } from './interfaces/IPaymentProvider';
import { PaymentFactory } from './PaymentFactory';
import type { IProviderSelector } from '../../core/loadbalancer/IProviderSelector';

export interface PaymentServiceOptions {
  providers: PaymentProviderConfig[];
  selector?: IProviderSelector<PaymentProviderConfig>;
}

/**
 * Service layer for payments with provider selection
 */
export class PaymentService {
  private readonly options: PaymentServiceOptions;

  constructor(options: PaymentServiceOptions) {
    this.options = options;
  }

  async pay(
    amount: number,
    currency: string,
    metadata?: Record<string, unknown>,
    providerName?: string
  ): Promise<PaymentResult> {
    const provider = providerName
      ? this.options.providers.find(
          (p) => p.provider.toLowerCase() === providerName.toLowerCase()
        )
      : this.selectProvider();

    if (!provider) {
      throw new Error(`Payment provider not found: ${providerName ?? 'default'}`);
    }

    const payment = PaymentFactory.create(provider);
    return payment.pay(amount, currency, metadata);
  }

  async getStatus(invoiceId: string, providerName?: string): Promise<PaymentResult> {
    const provider = providerName
      ? this.options.providers.find(
          (p) => p.provider.toLowerCase() === providerName.toLowerCase()
        )
      : this.selectProvider();

    if (!provider) {
      throw new Error(`Payment provider not found: ${providerName ?? 'default'}`);
    }

    const payment = PaymentFactory.create(provider);
    return payment.getStatus(invoiceId);
  }

  private selectProvider(): PaymentProviderConfig | undefined {
    if (this.options.selector) {
      return this.options.selector.select(this.options.providers);
    }
    return this.options.providers.find((p) => {
      const payment = PaymentFactory.create(p);
      return payment.isConfigured();
    });
  }
}
