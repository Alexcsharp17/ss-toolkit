import { IMailProvider, MailProviderConfig } from '../interfaces/IMailProvider';
import { MailInbox } from '../../../models/mail/MailInbox';
import { MailMessage } from '../../../models/mail/MailMessage';
import {
  toMailInbox,
  toMailMessage,
  MailTmAccountResponse,
  MailTmMessageResponse,
} from '../mappers/MailTmMapper';

const DEFAULT_API_URL = 'https://api.mail.tm';
const DEFAULT_TIMEOUT = 15000;

export class MailTmAdapter implements IMailProvider {
  private readonly config: MailProviderConfig;
  private readonly apiUrl: string;
  private readonly timeout: number;

  constructor(config: MailProviderConfig) {
    this.config = config;
    this.apiUrl = config.apiUrl ?? DEFAULT_API_URL;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
  }

  getProviderName(): string {
    return 'mailtm';
  }

  isConfigured(): boolean {
    return true;
  }

  async createInbox(): Promise<MailInbox> {
    const domains = await this.getDomains();
    const domain = domains[0];
    if (!domain) {
      throw new Error('No mail.tm domains available');
    }

    const username = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const address = `${username}@${domain}`;
    const password = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

    const accountRes = await fetch(`${this.apiUrl}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password }),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!accountRes.ok) {
      const err = await accountRes.text();
      throw new Error(`mail.tm create account failed: ${accountRes.status} ${accountRes.statusText} ${err}`);
    }

    const account = (await accountRes.json()) as MailTmAccountResponse;

    const tokenRes = await fetch(`${this.apiUrl}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password }),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!tokenRes.ok) {
      throw new Error('mail.tm get token failed');
    }

    const tokenData = (await tokenRes.json()) as { token?: string };
    const token = tokenData.token;

    return toMailInbox(account, token, password);
  }

  async fetchMessages(inbox: MailInbox): Promise<MailMessage[]> {
    const token = inbox.token;
    if (!token) {
      throw new Error('Mail inbox has no token');
    }

    const response = await fetch(`${this.apiUrl}/messages`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(`mail.tm fetch messages failed: ${response.status}`);
    }

    const data = (await response.json()) as { 'hydra:member'?: MailTmMessageResponse[] };
    const items = data['hydra:member'] ?? [];
    return items.map(toMailMessage);
  }

  async getMessage(inbox: MailInbox, messageId: string): Promise<MailMessage> {
    const token = inbox.token;
    if (!token) {
      throw new Error('Mail inbox has no token');
    }

    const response = await fetch(`${this.apiUrl}/messages/${messageId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(`mail.tm get message failed: ${response.status}`);
    }

    const data = (await response.json()) as MailTmMessageResponse;
    return toMailMessage(data);
  }

  private async getDomains(): Promise<string[]> {
    const response = await fetch(`${this.apiUrl}/domains`, {
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(`mail.tm get domains failed: ${response.status}`);
    }

    const data = (await response.json()) as { 'hydra:member'?: Array<{ domain: string }> };
    const items = data['hydra:member'] ?? [];
    return items.map((d) => d.domain).filter(Boolean);
  }
}
