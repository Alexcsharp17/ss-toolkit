import { MailFactory } from '../../../categories/mail/MailFactory';
import { MailTmAdapter } from '../../../categories/mail/adapters/MailTmAdapter';
import { TempmailLolAdapter } from '../../../categories/mail/adapters/TempmailLolAdapter';

describe('MailFactory', () => {
  it('creates MailTmAdapter for mailtm provider', () => {
    const adapter = MailFactory.create({ provider: 'mailtm' });
    expect(adapter).toBeInstanceOf(MailTmAdapter);
    expect(adapter.getProviderName()).toBe('mailtm');
  });

  it('creates TempmailLolAdapter for tempmailol provider', () => {
    const adapter = MailFactory.create({ provider: 'tempmailol' });
    expect(adapter).toBeInstanceOf(TempmailLolAdapter);
    expect(adapter.getProviderName()).toBe('tempmailol');
  });

  it('is case insensitive for provider name', () => {
    const adapter = MailFactory.create({ provider: 'MAILTM' });
    expect(adapter).toBeInstanceOf(MailTmAdapter);
  });

  it('throws for unknown provider', () => {
    expect(() => MailFactory.create({ provider: 'unknown' })).toThrow(
      'Unknown mail provider: unknown'
    );
  });

  it('returns supported providers', () => {
    const providers = MailFactory.getSupportedProviders();
    expect(providers).toContain('mailtm');
    expect(providers).toContain('tempmailol');
  });
});
