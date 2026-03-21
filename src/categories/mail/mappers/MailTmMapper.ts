import { MailInbox } from '../../../models/mail/MailInbox';
import { MailMessage } from '../../../models/mail/MailMessage';

/**
 * Native mail.tm API response formats
 */
export interface MailTmAccountResponse {
  id?: string;
  address?: string;
  quota?: number;
  createdAt?: string;
  token?: { token: string };
}

export interface MailTmMessageResponse {
  id?: string;
  accountId?: string;
  msgid?: string;
  from?: { address: string; name: string };
  to?: Array<{ address: string; name: string }>;
  subject?: string;
  intro?: string;
  text?: string;
  html?: string[];
  createdAt?: string;
  hasAttachments?: boolean;
  attachments?: unknown[];
}

export function toMailInbox(native: MailTmAccountResponse, token?: string, password?: string): MailInbox {
  return {
    address: native.address ?? '',
    password,
    token: token ?? native.token?.token,
    provider: 'mailtm',
  };
}

export function toMailMessage(native: MailTmMessageResponse): MailMessage {
  const from = native.from?.address ?? native.from?.name ?? '';
  const to = native.to?.[0]?.address ?? native.to?.[0]?.name ?? '';
  const body = native.text ?? native.intro ?? '';
  const html = Array.isArray(native.html) ? native.html.join('') : undefined;

  return {
    id: String(native.id ?? native.msgid ?? ''),
    from,
    to,
    subject: native.subject ?? '',
    body,
    html: html ?? undefined,
    receivedAt: native.createdAt ? new Date(native.createdAt) : new Date(),
    hasAttachments: native.hasAttachments ?? (native.attachments?.length ?? 0) > 0,
    provider: 'mailtm',
    rawData: native as unknown,
  };
}
