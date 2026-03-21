/**
 * Unified temporary mail inbox model
 */
export interface MailInbox {
  address: string;
  password?: string;
  token?: string;
  provider: string;
  expiresAt?: Date;
}
