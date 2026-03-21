import { MailInbox } from '../../models/mail/MailInbox';
import { MailMessage } from '../../models/mail/MailMessage';
import { IMailProvider, MailProviderConfig } from './interfaces/IMailProvider';
import { MailFactory } from './MailFactory';
import type { IProviderSelector } from '../../core/loadbalancer/IProviderSelector';

export interface MailServiceOptions {
  providers: MailProviderConfig[];
  selector?: IProviderSelector<MailProviderConfig>;
}

/**
 * Service layer for temporary mail with provider selection
 */
export class MailService {
  private readonly options: MailServiceOptions;

  constructor(options: MailServiceOptions) {
    this.options = options;
  }

  async createInbox(): Promise<MailInbox> {
    const provider = this.selectProvider();
    const mail = MailFactory.create(provider);
    return mail.createInbox();
  }

  async fetchMessages(inbox: MailInbox): Promise<MailMessage[]> {
    const provider = this.getProviderForInbox(inbox);
    const mail = MailFactory.create(provider);
    return mail.fetchMessages(inbox);
  }

  async getMessage(inbox: MailInbox, messageId: string): Promise<MailMessage> {
    const provider = this.getProviderForInbox(inbox);
    const mail = MailFactory.create(provider);
    return mail.getMessage(inbox, messageId);
  }

  private selectProvider(): MailProviderConfig {
    if (this.options.selector) {
      return this.options.selector.select(this.options.providers);
    }
    const configured = this.options.providers.filter((p) => {
      const mail = MailFactory.create(p);
      return mail.isConfigured();
    });
    if (configured.length === 0) {
      throw new Error('No configured mail providers available');
    }
    return configured[0];
  }

  private getProviderForInbox(inbox: MailInbox): MailProviderConfig {
    const provider = this.options.providers.find(
      (p) => p.provider.toLowerCase() === inbox.provider.toLowerCase()
    );
    if (provider) {
      return provider;
    }
    return this.selectProvider();
  }
}
