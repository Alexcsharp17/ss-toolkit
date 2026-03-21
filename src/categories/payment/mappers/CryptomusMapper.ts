import { PaymentResult } from '../../../models/payment/PaymentResult';

/**
 * Native Cryptomus API response format
 */
export interface CryptomusPaymentResponse {
  uuid?: string;
  id?: string;
  amount?: string | number;
  currency?: string;
  status?: string;
  url?: string;
  order_id?: string;
  created_at?: string;
  expired_at?: string;
  network_fee?: string;
  total_amount?: string;
}

function mapStatus(status?: string): PaymentResult['status'] {
  const s = (status ?? '').toLowerCase();
  if (s === 'paid' || s === 'confirm' || s === 'confirmed') return 'paid';
  if (s === 'expired' || s === 'cancel' || s === 'cancelled') return 'expired';
  if (s === 'fail' || s === 'failed' || s === 'error') return 'failed';
  return 'pending';
}

export function toPaymentResult(native: CryptomusPaymentResponse): PaymentResult {
  const amount = typeof native.amount === 'string' ? parseFloat(native.amount) : Number(native.amount ?? 0);
  const invoiceId = native.uuid ?? native.id ?? '';

  return {
    invoiceId,
    amount: isNaN(amount) ? 0 : amount,
    currency: native.currency ?? '',
    status: mapStatus(native.status),
    paymentUrl: native.url,
    provider: 'cryptomus',
    expiresAt: native.expired_at ? new Date(native.expired_at) : undefined,
    rawData: native as unknown,
  };
}
