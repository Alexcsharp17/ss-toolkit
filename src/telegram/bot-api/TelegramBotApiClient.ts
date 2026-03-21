import type {
  TelegramApiResponse,
  TelegramUpdate,
  BotInfo,
  SendMessageResult,
} from './types';

export interface TelegramBotApiClientOptions {
  token: string;
  /** Override base URL, e.g. for local Bot API server. Default: https://api.telegram.org */
  baseUrl?: string;
  /** Default fetch timeout in ms. Default: 35000 */
  timeoutMs?: number;
}

export class TelegramBotApiClient {
  private readonly base: string;
  private readonly timeoutMs: number;

  constructor(options: TelegramBotApiClientOptions) {
    const root = (options.baseUrl ?? 'https://api.telegram.org').replace(/\/$/, '');
    this.base = `${root}/bot${options.token}`;
    this.timeoutMs = options.timeoutMs ?? 35_000;
  }

  private async request<T>(
    method: string,
    params?: Record<string, unknown>,
  ): Promise<TelegramApiResponse<T>> {
    const url = `${this.base}/${method}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, {
        method: params ? 'POST' : 'GET',
        headers: params ? { 'Content-Type': 'application/json' } : undefined,
        body: params ? JSON.stringify(params) : undefined,
        signal: controller.signal,
      });
      return (await res.json()) as TelegramApiResponse<T>;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Returns basic information about the bot. */
  async getMe(): Promise<TelegramApiResponse<BotInfo>> {
    return this.request<BotInfo>('getMe');
  }

  /**
   * Receive incoming updates using long polling.
   * @param offset - Identifier of the first update to be returned.
   * @param timeout - Timeout in seconds for long polling. Default: 30.
   * @param limit - Max updates to receive. Default: 100.
   */
  async getUpdates(
    offset?: number,
    timeout = 30,
    limit = 100,
  ): Promise<TelegramApiResponse<TelegramUpdate[]>> {
    const params: Record<string, unknown> = { timeout, limit };
    if (offset != null) params.offset = offset;
    return this.request<TelegramUpdate[]>('getUpdates', params);
  }

  /** Sends a text message to a chat. */
  async sendMessage(
    chatId: number | string,
    text: string,
  ): Promise<TelegramApiResponse<SendMessageResult>> {
    return this.request<SendMessageResult>('sendMessage', { chat_id: chatId, text });
  }

  /**
   * Removes the webhook so long polling can be used.
   * Safe to call even if no webhook is set.
   */
  async deleteWebhook(): Promise<TelegramApiResponse<boolean>> {
    return this.request<boolean>('deleteWebhook', { drop_pending_updates: false });
  }
}
