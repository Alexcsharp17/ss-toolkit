import axios from 'axios';
import type { HistoryMessage, SuggestReplyResult, SuggestOverrides } from './types';

export interface SuggestReplyClientOptions {
  baseUrl: string;
  adminApiKey: string;
  accountId: string;
  userId: string;
  timeoutMs?: number;
}

/**
 * HTTP client for the backend /suggest endpoint.
 * Used by the "seller" AI side in AI chatting scenarios.
 */
export class SuggestReplyClient {
  private readonly options: Required<SuggestReplyClientOptions>;

  constructor(options: SuggestReplyClientOptions) {
    this.options = { timeoutMs: 60_000, ...options };
  }

  /**
   * Calls POST /api/v2/operator/conversations/:account/:user/suggest with the given
   * message history and optional body overrides (sales script, persona, channel text).
   * Retries on 429 / 500+429 up to 3 times.
   */
  async suggest(
    history: HistoryMessage[],
    overrides?: Partial<SuggestOverrides>,
  ): Promise<SuggestReplyResult> {
    const { baseUrl, adminApiKey, accountId, userId, timeoutMs } = this.options;
    const url = `${baseUrl}/api/v2/operator/conversations/${encodeURIComponent(accountId)}/${encodeURIComponent(userId)}/suggest`;

    const body: Record<string, unknown> = { messages: history };
    if (overrides?.salesScript) body.salesScriptOverride = overrides.salesScript;
    if (overrides?.persona) body.personaOverride = overrides.persona;
    if (overrides?.channelDescription) body.channelDescriptionOverride = overrides.channelDescription;
    if (overrides?.channelFirstPost) body.channelFirstPostOverride = overrides.channelFirstPost;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await axios.post<SuggestReplyResult>(url, body, {
          headers: { 'X-API-Key': adminApiKey, 'Content-Type': 'application/json' },
          timeout: timeoutMs,
        });
        return response.data;
      } catch (err: any) {
        const is429 =
          err.response?.status === 429 ||
          (err.response?.status === 500 &&
            String(err.response?.data?.message ?? '').includes('429'));
        if (is429 && attempt < 2) {
          const waitMs = 10_000 * (attempt + 1);
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }
        throw err;
      }
    }
    throw new Error('SuggestReplyClient: max retries exceeded');
  }
}
