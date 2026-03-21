import { PaymentResult } from '../../../models/payment/PaymentResult';

/**
 * Interface for payment providers
 */
export interface IPaymentProvider {
  pay(
    amount: number,
    currency: string,
    metadata?: Record<string, unknown>
  ): Promise<PaymentResult>;
  getStatus(invoiceId: string): Promise<PaymentResult>;
  getProviderName(): string;
  isConfigured(): boolean;
}

export interface PaymentProviderConfig {
  provider: string;
  apiKey?: string;
  apiUrl?: string;
  merchantId?: string;
  timeout?: number;
}
