import { IPaymentProvider, PaymentProviderConfig } from '../interfaces/IPaymentProvider';
import { PaymentResult } from '../../../models/payment/PaymentResult';
import { toPaymentResult, BitCartPaymentResponse } from '../mappers/BitCartMapper';

const DEFAULT_TIMEOUT = 15000;

/**
 * BitCart adapter - placeholder implementation
 * Requires BitCart API integration
 */
export class BitCartAdapter implements IPaymentProvider {
  private readonly config: PaymentProviderConfig;
  private readonly timeout: number;

  constructor(config: PaymentProviderConfig) {
    this.config = config;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
  }

  getProviderName(): string {
    return 'bitcart';
  }

  isConfigured(): boolean {
    return Boolean(this.config.apiKey && this.config.apiUrl);
  }

  async pay(
    amount: number,
    currency: string,
    metadata?: Record<string, unknown>
  ): Promise<PaymentResult> {
    if (!this.isConfigured()) {
      throw new Error('BitCart is not configured');
    }

    const response = await fetch(`${this.config.apiUrl}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        price: amount,
        currency,
        order_id: metadata?.order_id ?? metadata?.orderId,
      }),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`BitCart API error: ${response.status} ${err}`);
    }

    const data = (await response.json()) as BitCartPaymentResponse;
    return toPaymentResult(data);
  }

  async getStatus(invoiceId: string): Promise<PaymentResult> {
    if (!this.isConfigured()) {
      throw new Error('BitCart is not configured');
    }

    const response = await fetch(`${this.config.apiUrl}/invoices/${invoiceId}`, {
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`BitCart API error: ${response.status} ${err}`);
    }

    const data = (await response.json()) as BitCartPaymentResponse;
    return toPaymentResult(data);
  }
}
