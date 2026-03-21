import { IPaymentProvider, PaymentProviderConfig } from '../interfaces/IPaymentProvider';
import { PaymentResult } from '../../../models/payment/PaymentResult';
import { toPaymentResult, CryptomusPaymentResponse } from '../mappers/CryptomusMapper';
import crypto from 'crypto';

const DEFAULT_API_URL = 'https://api.cryptomus.com/v1';
const DEFAULT_TIMEOUT = 15000;

export class CryptomusAdapter implements IPaymentProvider {
  private readonly config: PaymentProviderConfig;
  private readonly apiUrl: string;
  private readonly timeout: number;
  private readonly merchantId: string;

  constructor(config: PaymentProviderConfig) {
    this.config = config;
    this.apiUrl = config.apiUrl ?? DEFAULT_API_URL;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.merchantId = config.merchantId ?? '';
  }

  getProviderName(): string {
    return 'cryptomus';
  }

  isConfigured(): boolean {
    return Boolean(this.config.apiKey && this.merchantId);
  }

  async pay(
    amount: number,
    currency: string,
    metadata?: Record<string, unknown>
  ): Promise<PaymentResult> {
    if (!this.config.apiKey) {
      throw new Error('Cryptomus API key is not configured');
    }
    if (!this.merchantId) {
      throw new Error('Cryptomus merchant ID is not configured');
    }

    const orderId = String(metadata?.order_id ?? metadata?.orderId ?? `order_${Date.now()}`);
    const urlReturn = String(metadata?.url_return ?? metadata?.urlReturn ?? '');
    const urlCallback = String(metadata?.url_callback ?? metadata?.urlCallback ?? '');
    const payload = {
      amount: amount.toString(),
      currency,
      order_id: orderId,
      url_return: urlReturn,
      url_callback: urlCallback,
    };

    const signature = this.generateSignature(payload);

    const response = await fetch(`${this.apiUrl}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        merchant: this.merchantId,
        sign: signature,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Cryptomus API error: ${response.status} ${err}`);
    }

    const data = (await response.json()) as { result?: CryptomusPaymentResponse };
    const payment = data.result;
    if (!payment) {
      throw new Error('Cryptomus did not return payment result');
    }

    return toPaymentResult(payment);
  }

  async getStatus(invoiceId: string): Promise<PaymentResult> {
    if (!this.config.apiKey) {
      throw new Error('Cryptomus API key is not configured');
    }

    const payload = { uuid: invoiceId };
    const signature = this.generateSignature(payload);

    const response = await fetch(`${this.apiUrl}/payment/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        merchant: this.merchantId,
        sign: signature,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Cryptomus API error: ${response.status} ${err}`);
    }

    const data = (await response.json()) as { result?: CryptomusPaymentResponse };
    const payment = data.result;
    if (!payment) {
      throw new Error('Cryptomus did not return payment info');
    }

    return toPaymentResult(payment);
  }

  private generateSignature(payload: Record<string, unknown>): string {
    const payloadString = JSON.stringify(payload);
    const base64Payload = Buffer.from(payloadString, 'utf8').toString('base64');
    return crypto.createHash('md5').update(base64Payload + this.config.apiKey).digest('hex');
  }
}
