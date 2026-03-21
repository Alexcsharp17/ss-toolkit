import { CaptchaResult } from '../../../models/captcha/CaptchaResult';

/**
 * Native CapMonster API response format
 */
export interface CapMonsterApiResponse {
  errorId?: number;
  errorCode?: string;
  errorDescription?: string;
  taskId?: number;
  status?: string;
  solution?: {
    gRecaptchaResponse?: string;
    text?: string;
    token?: string;
  };
}

/**
 * Maps CapMonster API response to unified CaptchaResult
 */
export function toCaptchaResult(native: CapMonsterApiResponse): CaptchaResult {
  const solution =
    native.solution?.gRecaptchaResponse ??
    native.solution?.token ??
    native.solution?.text ??
    '';

  return {
    taskId: String(native.taskId ?? ''),
    solution,
    success: native.status === 'ready',
    provider: 'capmonster',
    solvedAt: new Date(),
    rawData: native,
  };
}
