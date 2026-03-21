/**
 * Integration test: send email between two mail.tm inboxes via SMTP
 *
 * mail.tm only receives emails, so we use external SMTP to send.
 * Configure via environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 *
 * If SMTP not configured, test is skipped.
 *
 * Example with Gmail:
 *   SMTP_HOST=smtp.gmail.com SMTP_PORT=587 SMTP_USER=you@gmail.com SMTP_PASS=app-password npm test
 *
 * Example with Resend:
 *   SMTP_HOST=smtp.resend.com SMTP_PORT=587 SMTP_USER=resend SMTP_PASS=re_xxx npm test
 */

import * as nodemailer from 'nodemailer';
import { MailService } from '../../../categories/mail/MailService';
import { MailInbox } from '../../../models/mail/MailInbox';
import { MailMessage } from '../../../models/mail/MailMessage';

const TIMEOUT_MS = 90000; // 90 seconds for email delivery
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 12; // 12 * 5s = 60s max wait

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

const smtpConfigured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function createInboxWithRetry(mailService: MailService, maxRetries = 3): Promise<MailInbox> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await mailService.createInbox();
    } catch (err) {
      const is429 = err instanceof Error && err.message.includes('429');
      if (is429 && i < maxRetries - 1) {
        await sleep(3000 * (i + 1));
      } else {
        throw err;
      }
    }
  }
  throw new Error('Failed to create inbox after retries');
}

async function waitForMessage(
  mailService: MailService,
  inbox: MailInbox,
  subjectContains: string,
  maxAttempts = MAX_POLL_ATTEMPTS
): Promise<MailMessage | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const messages = await mailService.fetchMessages(inbox);
    const found = messages.find((m) => m.subject?.includes(subjectContains));
    if (found) return found;
    await sleep(POLL_INTERVAL_MS);
  }
  return null;
}

(smtpConfigured ? describe : describe.skip)('mail send-receive integration (SMTP)', () => {
  const mailService = new MailService({
    providers: [{ provider: 'mailtm' }],
  });

  let senderInbox: MailInbox;
  let receiverInbox: MailInbox;
  let transporter: nodemailer.Transporter;
  const testSubject = `Test-${Date.now()}`;
  const testBody = `Hello from integration test! Random: ${Math.random()}`;

  beforeAll(async () => {
    // Create sender inbox (we use its address as "from" even though mail.tm can't send)
    senderInbox = await createInboxWithRetry(mailService);
    await sleep(1500); // Rate limit buffer

    // Create receiver inbox
    receiverInbox = await createInboxWithRetry(mailService);

    // Create SMTP transporter
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    console.log(`Sender: ${senderInbox.address}`);
    console.log(`Receiver: ${receiverInbox.address}`);
  }, TIMEOUT_MS);

  afterAll(async () => {
    transporter?.close?.();
  });

  it(
    'sends email and receiver inbox receives it',
    async () => {
      // Send email via SMTP to receiver inbox
      const info = await transporter.sendMail({
        from: SMTP_USER, // Must be valid for the SMTP provider
        to: receiverInbox.address,
        subject: testSubject,
        text: testBody,
        html: `<p>${testBody}</p>`,
      });

      console.log(`Email sent: ${info.messageId}`);
      expect(info.messageId).toBeDefined();

      // Wait for email to arrive
      const received = await waitForMessage(mailService, receiverInbox, testSubject);

      expect(received).not.toBeNull();
      expect(received!.subject).toContain(testSubject);
      expect(received!.body).toContain('integration test');
    },
    TIMEOUT_MS
  );

  it(
    'sender inbox does not receive the email (correct routing)',
    async () => {
      // Sender inbox should not have the email
      const messages = await mailService.fetchMessages(senderInbox);
      const wrongDelivery = messages.find((m) => m.subject?.includes(testSubject));
      expect(wrongDelivery).toBeUndefined();
    },
    TIMEOUT_MS
  );
});

// Basic test without SMTP - just verify inbox creation
describe('mail.tm inbox creation (no SMTP)', () => {
  const mailService = new MailService({
    providers: [{ provider: 'mailtm' }],
  });

  it(
    'creates two inboxes with different addresses',
    async () => {
      const inbox1 = await createInboxWithRetry(mailService);
      await sleep(2000);
      const inbox2 = await createInboxWithRetry(mailService);

      expect(inbox1.address).not.toBe(inbox2.address);
      expect(inbox1.token).toBeDefined();
      expect(inbox2.token).toBeDefined();
    },
    30000
  );
});
