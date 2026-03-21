import { CaptchaTask } from '../../../models/captcha/CaptchaTask';
import { CaptchaResult } from '../../../models/captcha/CaptchaResult';

/**
 * Interface for captcha solving providers
 */
export interface ICaptchaSolver {
  solve(task: CaptchaTask): Promise<CaptchaResult>;
  getTaskResult(taskId: string): Promise<CaptchaResult>;
  getProviderName(): string;
  isConfigured(): boolean;
}

export interface CaptchaProviderConfig {
  provider: string;
  apiKey?: string;
  apiUrl?: string;
  timeout?: number;
}
