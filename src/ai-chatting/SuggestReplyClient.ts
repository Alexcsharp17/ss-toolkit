import axios from 'axios';
import type { HistoryMessage, SuggestReplyResult, SellerPersonaConfig } from './types';

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
   * message history and optional persona overrides.
   * Retries on 429 / 500+429 up to 3 times.
   */
  async suggest(
    history: HistoryMessage[],
    persona?: Partial<SellerPersonaConfig>,
  ): Promise<SuggestReplyResult> {
    const { baseUrl, adminApiKey, accountId, userId, timeoutMs } = this.options;
    const url = `${baseUrl}/api/v2/operator/conversations/${encodeURIComponent(accountId)}/${encodeURIComponent(userId)}/suggest`;

    const body: Record<string, unknown> = { messages: history };
    if (persona?.salesScript) body.salesScriptOverride = persona.salesScript;
    if (persona?.persona) body.personaOverride = persona.persona;
    if (persona?.channelDescription) body.channelDescriptionOverride = persona.channelDescription;
    if (persona?.channelFirstPost) body.channelFirstPostOverride = persona.channelFirstPost;

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
