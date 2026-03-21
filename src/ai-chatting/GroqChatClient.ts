import axios from 'axios';
import type { HistoryMessage } from './types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.1-8b-instant';

export interface GroqChatClientOptions {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

/**
 * Thin wrapper around the Groq chat completions API.
 * Used by the "buyer" AI side in AI chatting scenarios.
 */
export class GroqChatClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly temperature: number;
  private readonly maxTokens: number;
  private readonly timeoutMs: number;

  constructor(options: GroqChatClientOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model ?? DEFAULT_MODEL;
    this.temperature = options.temperature ?? 0.7;
    this.maxTokens = options.maxTokens ?? 256;
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  /**
   * Sends a conversation history to Groq and returns the assistant reply.
   * Automatically retries on 429 rate limit (up to 3 attempts).
   */
  async chat(systemPrompt: string, history: HistoryMessage[]): Promise<string> {
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    for (const msg of history) {
      messages.push({
        role: msg.out ? 'user' : 'assistant',
        content: msg.text,
      });
    }

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await axios.post<{ choices: Array<{ message: { content: string } }> }>(
          GROQ_API_URL,
          { model: this.model, messages, temperature: this.temperature, max_tokens: this.maxTokens },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: this.timeoutMs,
          },
        );
        return (response.data.choices?.[0]?.message?.content ?? '').trim();
      } catch (err: any) {
        if (err.response?.status === 429 && attempt < 2) {
          const waitMs = 10_000 * (attempt + 1);
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }
        throw err;
      }
    }
    throw new Error('GroqChatClient: max retries exceeded');
  }
}
