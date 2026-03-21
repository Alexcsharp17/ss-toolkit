import { IMailProvider, MailProviderConfig } from './interfaces/IMailProvider';
import { MailTmAdapter } from './adapters/MailTmAdapter';
import { TempmailLolAdapter } from './adapters/TempmailLolAdapter';

export type MailProviderType = 'mailtm' | 'tempmailol';

/**
 * Factory for creating mail provider adapters
 */
export class MailFactory {
  static create(config: MailProviderConfig): IMailProvider {
    const provider = (config.provider ?? '').toLowerCase();
    switch (provider) {
      case 'mailtm':
        return new MailTmAdapter(config);
      case 'tempmailol':
        return new TempmailLolAdapter(config);
      default:
        throw new Error(`Unknown mail provider: ${config.provider}`);
    }
  }

  static getSupportedProviders(): MailProviderType[] {
    return ['mailtm', 'tempmailol'];
  }
}
