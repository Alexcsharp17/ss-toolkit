import { MailInbox } from '../../../models/mail/MailInbox';
import { MailMessage } from '../../../models/mail/MailMessage';

/**
 * Interface for temporary mail providers
 */
export interface IMailProvider {
  createInbox(): Promise<MailInbox>;
  fetchMessages(inbox: MailInbox): Promise<MailMessage[]>;
  getMessage(inbox: MailInbox, messageId: string): Promise<MailMessage>;
  getProviderName(): string;
  isConfigured(): boolean;
}

export interface MailProviderConfig {
  provider: string;
  apiKey?: string;
  apiUrl?: string;
  timeout?: number;
}
