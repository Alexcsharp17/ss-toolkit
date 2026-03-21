import { ICaptchaSolver, CaptchaProviderConfig } from '../interfaces/ICaptchaSolver';
import { CaptchaTask } from '../../../models/captcha/CaptchaTask';
import { CaptchaResult } from '../../../models/captcha/CaptchaResult';
import { toCaptchaResult, CapMonsterApiResponse } from '../mappers/CapMonsterMapper';

const DEFAULT_API_URL = 'https://api.capmonster.cloud';
const DEFAULT_TIMEOUT = 60000;
const POLL_INTERVAL = 2000;

/**
 * Maps our CaptchaTask type to CapMonster task type
 */
function getCapMonsterTaskType(task: CaptchaTask): string {
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

function buildCapMonsterTask(task: CaptchaTask): Record<string, unknown> {
  const base: Record<string, unknown> = {
    type: getCapMonsterTaskType(task),
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

export class CapMonsterAdapter implements ICaptchaSolver {
  private readonly config: CaptchaProviderConfig;
  private readonly apiUrl: string;
  private readonly timeout: number;

  constructor(config: CaptchaProviderConfig) {
    this.config = config;
    this.apiUrl = config.apiUrl ?? DEFAULT_API_URL;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
  }

  getProviderName(): string {
    return 'capmonster';
  }

  isConfigured(): boolean {
    return Boolean(this.config.apiKey);
  }

  async solve(task: CaptchaTask): Promise<CaptchaResult> {
    if (!this.config.apiKey) {
      throw new Error('CapMonster API key is not configured');
    }

    const taskId = await this.createTask(task);
    return this.pollTaskResult(taskId);
  }

  async getTaskResult(taskId: string): Promise<CaptchaResult> {
    if (!this.config.apiKey) {
      throw new Error('CapMonster API key is not configured');
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
        task: buildCapMonsterTask(task),
      }),
      signal: AbortSignal.timeout(this.timeout),
    });

    const data = (await response.json()) as CapMonsterApiResponse & { taskId?: number };
    if (data.errorId && data.errorId !== 0) {
      throw new Error(data.errorDescription ?? data.errorCode ?? 'CapMonster API error');
    }
    if (data.taskId == null) {
      throw new Error('CapMonster did not return taskId');
    }
    return data.taskId;
  }

  private async pollTaskResult(taskId: number): Promise<CaptchaResult> {
    const start = Date.now();
    while (Date.now() - start < this.timeout) {
      const response = await this.fetchTaskResult(taskId);
      if (response.status === 'ready') {
        return toCaptchaResult(response);
      }
      if (response.errorId && response.errorId !== 0) {
        throw new Error(
          response.errorDescription ?? response.errorCode ?? 'CapMonster task failed'
        );
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    }
    throw new Error('CapMonster task timed out');
  }

  private async fetchTaskResult(taskId: number): Promise<CapMonsterApiResponse> {
    const response = await fetch(`${this.apiUrl}/getTaskResult`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientKey: this.config.apiKey,
        taskId,
      }),
      signal: AbortSignal.timeout(this.timeout),
    });

    return (await response.json()) as CapMonsterApiResponse;
  }
}
