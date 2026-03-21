import { ICaptchaSolver, CaptchaProviderConfig } from './interfaces/ICaptchaSolver';
import { CapMonsterAdapter } from './adapters/CapMonsterAdapter';
import { TwoCaptchaAdapter } from './adapters/TwoCaptchaAdapter';

export type CaptchaProviderType = 'capmonster' | '2captcha';

/**
 * Factory for creating captcha solver adapters
 */
export class CaptchaFactory {
  static create(config: CaptchaProviderConfig): ICaptchaSolver {
    const provider = (config.provider ?? '').toLowerCase();
    switch (provider) {
      case 'capmonster':
        return new CapMonsterAdapter(config);
      case '2captcha':
        return new TwoCaptchaAdapter(config);
      default:
        throw new Error(`Unknown captcha provider: ${config.provider}`);
    }
  }

  static getSupportedProviders(): CaptchaProviderType[] {
    return ['capmonster', '2captcha'];
  }
}
