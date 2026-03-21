import { CaptchaResult } from '../../../models/captcha/CaptchaResult';

/**
 * Native 2Captcha API response format (getTaskResult)
 */
export interface TwoCaptchaApiResponse {
  status?: number;
  request?: string;
  error_text?: string;
  taskId?: string | number;
  token?: string;
  errorCode?: string;
}

/**
 * Maps 2Captcha API response to unified CaptchaResult
 */
export function toCaptchaResult(native: TwoCaptchaApiResponse): CaptchaResult {
  const solution = native.request ?? native.token ?? '';

  return {
    taskId: String(native.taskId ?? ''),
    solution,
    success: native.status === 1,
    provider: '2captcha',
    solvedAt: new Date(),
    rawData: native,
  };
}
