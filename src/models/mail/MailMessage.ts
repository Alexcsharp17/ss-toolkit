/**
 * Unified mail message model
 */
export interface MailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  receivedAt: Date;
  hasAttachments: boolean;
  provider: string;
  rawData?: unknown;
}
