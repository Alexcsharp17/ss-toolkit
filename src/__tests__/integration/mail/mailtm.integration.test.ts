/**
 * Integration test for mail.tm provider
 * Creates inbox and verifies fetchMessages for empty/new inbox
 *
 * Note: Full receive test (send email -> fetch messages) requires real SMTP
 * that delivers to external addresses. Ethereal/nodemailer createTestAccount
 * does not deliver to real mailboxes.
 *
 * mail.tm has 8 QPS rate limit - may fail with 429 if run frequently.
 */

import { MailService } from '../../../categories/mail/MailService';
import { MailInbox } from '../../../models/mail/MailInbox';

const TIMEOUT_MS = 25000;

async function createInboxWithRetry(mailService: MailService, maxRetries = 3): Promise<MailInbox> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await mailService.createInbox();
    } catch (err) {
      const is429 = err instanceof Error && err.message.includes('429');
      if (is429 && i < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
      } else {
        throw err;
      }
    }
  }
  throw new Error('Failed to create inbox after retries');
}

describe('mail.tm integration', () => {
  const mailService = new MailService({
    providers: [{ provider: 'mailtm' }],
  });

  let inbox: MailInbox;

  beforeAll(async () => {
    inbox = await createInboxWithRetry(mailService);
  }, TIMEOUT_MS);

  it(
    'creates inbox with valid address and token',
    () => {
      expect(inbox).toBeDefined();
      expect(inbox.address).toMatch(/^[^@]+@[^@]+$/);
      expect(inbox.provider).toBe('mailtm');
      expect(inbox.token).toBeDefined();
      expect(inbox.token!.length).toBeGreaterThan(0);
    },
    TIMEOUT_MS
  );

  it(
    'returns empty array for new inbox when fetching messages',
    async () => {
      const messages = await mailService.fetchMessages(inbox);

      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBe(0);
    },
    TIMEOUT_MS
  );
});
