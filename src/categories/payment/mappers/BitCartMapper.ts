import { PaymentResult } from '../../../models/payment/PaymentResult';

/**
 * Native BitCart API response format (placeholder)
 */
export interface BitCartPaymentResponse {
  id?: string;
  amount?: number | string;
  currency?: string;
  status?: string;
  payment_link?: string;
  created_at?: string;
  expires_at?: string;
}

function mapStatus(status?: string): PaymentResult['status'] {
  const s = (status ?? '').toLowerCase();
  if (s === 'paid' || s === 'complete' || s === 'confirmed') return 'paid';
  if (s === 'expired') return 'expired';
  if (s === 'failed' || s === 'error') return 'failed';
  return 'pending';
}

export function toPaymentResult(native: BitCartPaymentResponse): PaymentResult {
  const amount = typeof native.amount === 'string' ? parseFloat(native.amount) : Number(native.amount ?? 0);

  return {
    invoiceId: native.id ?? '',
    amount: isNaN(amount) ? 0 : amount,
    currency: native.currency ?? '',
    status: mapStatus(native.status),
    paymentUrl: native.payment_link,
    provider: 'bitcart',
    expiresAt: native.expires_at ? new Date(native.expires_at) : undefined,
    rawData: native as unknown,
  };
}
