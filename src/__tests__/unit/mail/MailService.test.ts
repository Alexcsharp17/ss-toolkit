import { MailService } from '../../../categories/mail/MailService';
import { MailInbox } from '../../../models/mail/MailInbox';

describe('MailService', () => {
  describe('constructor', () => {
    it('accepts provider config', () => {
      const service = new MailService({
        providers: [{ provider: 'mailtm' }],
      });
      expect(service).toBeDefined();
    });
  });

  describe('createInbox', () => {
    it('throws when no providers configured', async () => {
      const service = new MailService({ providers: [] });
      await expect(service.createInbox()).rejects.toThrow(
        'No configured mail providers available'
      );
    });
  });

  describe('fetchMessages', () => {
    it('throws when inbox has no token', async () => {
      const service = new MailService({
        providers: [{ provider: 'mailtm' }],
      });
      const inbox: MailInbox = {
        address: 'test@example.com',
        provider: 'mailtm',
        token: undefined,
      };
      await expect(service.fetchMessages(inbox)).rejects.toThrow(
        'Mail inbox has no token'
      );
    });
  });
});
