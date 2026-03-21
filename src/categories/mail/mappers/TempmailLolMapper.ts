import { MailInbox } from '../../../models/mail/MailInbox';
import { MailMessage } from '../../../models/mail/MailMessage';

/**
 * Native tempmail.lol API response formats (placeholder - adjust per actual API)
 */
export interface TempmailLolInboxResponse {
  address?: string;
  token?: string;
  expires_at?: string;
}

export interface TempmailLolMessageResponse {
  id?: string;
  from?: string;
  to?: string;
  subject?: string;
  body?: string;
  html?: string;
  created_at?: string;
  attachments?: unknown[];
}

export function toMailInbox(native: TempmailLolInboxResponse): MailInbox {
  return {
    address: native.address ?? '',
    token: native.token,
    provider: 'tempmailol',
    expiresAt: native.expires_at ? new Date(native.expires_at) : undefined,
  };
}

export function toMailMessage(native: TempmailLolMessageResponse): MailMessage {
  return {
    id: String(native.id ?? ''),
    from: native.from ?? '',
    to: native.to ?? '',
    subject: native.subject ?? '',
    body: native.body ?? '',
    html: native.html,
    receivedAt: native.created_at ? new Date(native.created_at) : new Date(),
    hasAttachments: (native.attachments?.length ?? 0) > 0,
    provider: 'tempmailol',
    rawData: native as unknown,
  };
}
