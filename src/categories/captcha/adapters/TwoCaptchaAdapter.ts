import { ICaptchaSolver, CaptchaProviderConfig } from '../interfaces/ICaptchaSolver';
import { CaptchaTask } from '../../../models/captcha/CaptchaTask';
import { CaptchaResult } from '../../../models/captcha/CaptchaResult';
import { toCaptchaResult, TwoCaptchaApiResponse } from '../mappers/TwoCaptchaMapper';

const DEFAULT_API_URL = 'https://api.2captcha.com';
const DEFAULT_TIMEOUT = 120000;
const POLL_INTERVAL = 3000;

function getTwoCaptchaTaskType(task: CaptchaTask): string {
  switch (task.type) {
    case 'recaptcha-v2':
      return 'RecaptchaV2TaskProxyless';
    case 'recaptcha-v3':
      return 'RecaptchaV3TaskProxyless';
    case 'hcaptcha':
      return 'HCaptchaTaskProxyless';
    case 'image':
      return 'ImageToTextTask';
    case 'turnstile':
      return 'TurnstileTaskProxyless';
    default:
      return 'RecaptchaV2TaskProxyless';
  }
}

function buildTwoCaptchaTask(task: CaptchaTask): Record<string, unknown> {
  const base: Record<string, unknown> = {
    type: getTwoCaptchaTaskType(task),
    websiteURL: task.pageUrl ?? 'https://example.com',
    websiteKey: task.siteKey,
  };

  if (task.type === 'recaptcha-v3') {
    base.action = task.action ?? 'verify';
    base.minScore = task.minScore ?? 0.7;
  }

  if (task.type === 'image' && task.imageBase64) {
    return {
      type: 'ImageToTextTask',
      body: task.imageBase64.replace(/^data:image\/\w+;base64,/, ''),
    };
  }

  if (task.type === 'turnstile') {
    return {
      type: 'TurnstileTaskProxyless',
      websiteURL: task.pageUrl ?? 'https://example.com',
      websiteKey: task.siteKey,
    };
  }

  if (task.enterprisePayload) {
    base.enterprisePayload = task.enterprisePayload;
  }

  return base;
}

export class TwoCaptchaAdapter implements ICaptchaSolver {
  private readonly config: CaptchaProviderConfig;
  private readonly apiUrl: string;
  private readonly timeout: number;

  constructor(config: CaptchaProviderConfig) {
    this.config = config;
    this.apiUrl = config.apiUrl ?? DEFAULT_API_URL;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
  }

  getProviderName(): string {
    return '2captcha';
  }

  isConfigured(): boolean {
    return Boolean(this.config.apiKey);
  }

  async solve(task: CaptchaTask): Promise<CaptchaResult> {
    if (!this.config.apiKey) {
      throw new Error('2Captcha API key is not configured');
    }

    const taskId = await this.createTask(task);
    return this.pollTaskResult(taskId);
  }

  async getTaskResult(taskId: string): Promise<CaptchaResult> {
    if (!this.config.apiKey) {
      throw new Error('2Captcha API key is not configured');
    }

    const response = await this.fetchTaskResult(Number(taskId));
    return toCaptchaResult(response);
  }

  private async createTask(task: CaptchaTask): Promise<number> {
    const response = await fetch(`${this.apiUrl}/createTask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientKey: this.config.apiKey,
        task: buildTwoCaptchaTask(task),
      }),
      signal: AbortSignal.timeout(this.timeout),
    });

    const data = (await response.json()) as TwoCaptchaApiResponse & { taskId?: number };
    if (data.error_text) {
      throw new Error(`2Captcha API error: ${data.error_text}`);
    }
    if (data.taskId == null) {
      throw new Error('2Captcha did not return taskId');
    }
    return Number(data.taskId);
  }

  private async pollTaskResult(taskId: number): Promise<CaptchaResult> {
    const start = Date.now();
    while (Date.now() - start < this.timeout) {
      const response = await this.fetchTaskResult(taskId);
      if (response.status === 1) {
        return toCaptchaResult(response);
      }
      if (response.error_text) {
        throw new Error(`2Captcha task failed: ${response.error_text}`);
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    }
    throw new Error('2Captcha task timed out');
  }

  private async fetchTaskResult(taskId: number): Promise<TwoCaptchaApiResponse> {
    const response = await fetch(`${this.apiUrl}/getTaskResult`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientKey: this.config.apiKey,
        taskId,
      }),
      signal: AbortSignal.timeout(this.timeout),
    });

    return (await response.json()) as TwoCaptchaApiResponse;
  }
}
