/**
 * Unified captcha result model
 */
export interface CaptchaResult {
  taskId: string;
  solution: string;
  success: boolean;
  provider: string;
  cost?: number;
  solvedAt: Date;
  rawData?: unknown;
}
