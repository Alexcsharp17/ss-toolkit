/**
 * Unified captcha task model
 */
export type CaptchaTaskType =
  | 'recaptcha-v2'
  | 'recaptcha-v3'
  | 'hcaptcha'
  | 'image'
  | 'turnstile';

export interface CaptchaTask {
  type: CaptchaTaskType;
  siteKey?: string;
  pageUrl?: string;
  action?: string;
  minScore?: number;
  imageBase64?: string;
  enterprisePayload?: Record<string, unknown>;
}
