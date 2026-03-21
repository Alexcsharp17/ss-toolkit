/**
 * Unified payment result model
 */
export type PaymentStatus = 'pending' | 'paid' | 'expired' | 'failed';

export interface PaymentResult {
  invoiceId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentUrl?: string;
  provider: string;
  expiresAt?: Date;
  rawData?: unknown;
}
