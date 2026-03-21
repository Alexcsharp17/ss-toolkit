import { IMailProvider, MailProviderConfig } from '../interfaces/IMailProvider';
import { MailInbox } from '../../../models/mail/MailInbox';
import { MailMessage } from '../../../models/mail/MailMessage';
import {
  toMailInbox,
  toMailMessage,
  TempmailLolInboxResponse,
  TempmailLolMessageResponse,
} from '../mappers/TempmailLolMapper';

const DEFAULT_API_URL = 'https://api.tempmail.lol';
const DEFAULT_TIMEOUT = 15000;

/**
 * Tempmail.lol adapter - placeholder implementation
 * Requires tempmail.lol npm package or HTTP API access
 */
export class TempmailLolAdapter implements IMailProvider {
  private readonly config: MailProviderConfig;
  private readonly apiUrl: string;
  private readonly timeout: number;

  constructor(config: MailProviderConfig) {
    this.config = config;
    this.apiUrl = config.apiUrl ?? DEFAULT_API_URL;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
  }

  getProviderName(): string {
    return 'tempmailol';
  }

  isConfigured(): boolean {
    return true;
  }

  async createInbox(): Promise<MailInbox> {
    // tempmail.lol /generate accepts GET; optional key via query or POST body
    const url = this.config.apiKey
      ? `${this.apiUrl}/generate?key=${encodeURIComponent(this.config.apiKey)}`
      : `${this.apiUrl}/generate`;
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`tempmail.lol create inbox failed: ${response.status} ${text.slice(0, 200)}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`tempmail.lol unexpected response: ${text.slice(0, 200)}`);
    }

    const data = (await response.json()) as TempmailLolInboxResponse;
    return toMailInbox(data);
  }

  async fetchMessages(inbox: MailInbox): Promise<MailMessage[]> {
    const token = inbox.token ?? inbox.address;
    if (!token) {
      throw new Error('Mail inbox has no token or address');
    }

    const response = await fetch(`${this.apiUrl}/auth/${token}`, {
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(`tempmail.lol fetch messages failed: ${response.status}`);
    }

    const data = (await response.json()) as { email?: TempmailLolMessageResponse[] };
    const items = data.email ?? [];
    return items.map(toMailMessage);
  }

  async getMessage(inbox: MailInbox, messageId: string): Promise<MailMessage> {
    const messages = await this.fetchMessages(inbox);
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) {
      throw new Error(`Message not found: ${messageId}`);
    }
    return msg;
  }
}
