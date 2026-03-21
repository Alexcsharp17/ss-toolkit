import { CaptchaTask } from '../../models/captcha/CaptchaTask';
import { CaptchaResult } from '../../models/captcha/CaptchaResult';
import { ICaptchaSolver, CaptchaProviderConfig } from './interfaces/ICaptchaSolver';
import { CaptchaFactory } from './CaptchaFactory';
import type { IProviderSelector } from '../../core/loadbalancer/IProviderSelector';
import type { RetryPolicy } from '../../core/retry/RetryPolicy';

export interface CaptchaServiceOptions {
  providers: CaptchaProviderConfig[];
  selector?: IProviderSelector<CaptchaProviderConfig>;
  retry?: RetryPolicy;
}

/**
 * Service layer for captcha solving with provider selection and retry
 */
export class CaptchaService {
  private readonly options: CaptchaServiceOptions;

  constructor(options: CaptchaServiceOptions) {
    this.options = options;
  }

  async solve(task: CaptchaTask): Promise<CaptchaResult> {
    const provider = this.selectProvider();
    const solver = CaptchaFactory.create(provider);

    const execute = async (): Promise<CaptchaResult> => solver.solve(task);

    if (this.options.retry) {
      return this.options.retry.execute(execute);
    }
    return execute();
  }

  async getTaskResult(taskId: string, providerName?: string): Promise<CaptchaResult> {
    const provider = providerName
      ? this.options.providers.find((p) => p.provider.toLowerCase() === providerName.toLowerCase())
      : this.selectProvider();

    if (!provider) {
      throw new Error(`Provider not found: ${providerName ?? 'default'}`);
    }

    const solver = CaptchaFactory.create(provider);
    return solver.getTaskResult(taskId);
  }

  private selectProvider(): CaptchaProviderConfig {
    if (this.options.selector) {
      return this.options.selector.select(this.options.providers);
    }
    const configured = this.options.providers.filter((p) => {
      const solver = CaptchaFactory.create(p);
      return solver.isConfigured();
    });
    if (configured.length === 0) {
      throw new Error('No configured captcha providers available');
    }
    return configured[0];
  }
}
