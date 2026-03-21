import {
  toMailInbox,
  toMailMessage,
  MailTmAccountResponse,
  MailTmMessageResponse,
} from '../../../categories/mail/mappers/MailTmMapper';

describe('MailTmMapper', () => {
  describe('toMailInbox', () => {
    it('maps native account response to MailInbox', () => {
      const native: MailTmAccountResponse = {
        id: '123',
        address: 'test@example.com',
        quota: 50,
      };
      const result = toMailInbox(native, 'token-abc', 'pass123');
      expect(result).toEqual({
        address: 'test@example.com',
        password: 'pass123',
        token: 'token-abc',
        provider: 'mailtm',
      });
    });

    it('uses native token when token param not provided', () => {
      const native: MailTmAccountResponse = {
        address: 'user@domain.com',
        token: { token: 'native-token' },
      };
      const result = toMailInbox(native);
      expect(result.token).toBe('native-token');
    });

    it('handles empty address', () => {
      const result = toMailInbox({});
      expect(result.address).toBe('');
      expect(result.provider).toBe('mailtm');
    });
  });

  describe('toMailMessage', () => {
    it('maps native message response to MailMessage', () => {
      const native: MailTmMessageResponse = {
        id: 'msg-1',
        from: { address: 'from@test.com', name: 'Sender' },
        to: [{ address: 'to@test.com', name: 'Recipient' }],
        subject: 'Test Subject',
        text: 'Hello world',
        intro: 'Hello',
        createdAt: '2024-01-15T10:00:00Z',
        hasAttachments: false,
      };
      const result = toMailMessage(native);
      expect(result.id).toBe('msg-1');
      expect(result.from).toBe('from@test.com');
      expect(result.to).toBe('to@test.com');
      expect(result.subject).toBe('Test Subject');
      expect(result.body).toBe('Hello world');
      expect(result.receivedAt).toEqual(new Date('2024-01-15T10:00:00Z'));
      expect(result.hasAttachments).toBe(false);
      expect(result.provider).toBe('mailtm');
    });

    it('handles html array', () => {
      const native: MailTmMessageResponse = {
        id: '1',
        html: ['<p>Hello</p>', '<p>World</p>'],
      };
      const result = toMailMessage(native);
      expect(result.html).toBe('<p>Hello</p><p>World</p>');
    });

    it('detects attachments from attachments array', () => {
      const native: MailTmMessageResponse = {
        id: '1',
        attachments: [{}],
      };
      const result = toMailMessage(native);
      expect(result.hasAttachments).toBe(true);
    });
  });
});
