export interface HistoryMessage {
  text: string;
  /** true = seller (outbound), false = buyer (inbound) */
  out: boolean;
}

export interface SuggestReplyEscalation {
  reason: string;
  description: string;
  summary: string;
  confidence: number;
}

export interface SuggestReplyResult {
  suggestedText: string;
  action: string;
  escalation?: SuggestReplyEscalation;
}

/**
 * Optional fields forwarded to POST /suggest as *Override keys.
 * Domain-specific scripts/personas live in the consuming app, not in the toolkit.
 */
export interface SuggestOverrides {
  salesScript?: string[];
  persona?: string;
  channelDescription?: string;
  channelFirstPost?: string;
}

export interface AiChattingConfig {
  /** Backend base URL, e.g. http://localhost:3000 */
  apiBaseUrl: string;
  /** Admin API key for the /suggest endpoint */
  adminApiKey: string;
  /** Groq API key for the buyer AI */
  groqApiKey: string;
  /** Account ID injected into the conversation URL */
  accountId: string;
  /** User ID injected into the conversation URL */
  userId: string;
}

export interface DeviationScenario {
  name: string;
  history: HistoryMessage[];
  assert: (result: SuggestReplyResult) => string | null;
}

export interface HappyPathResult {
  success: boolean;
  turns: number;
  history: HistoryMessage[];
  lastResult?: SuggestReplyResult;
}

export interface DeviationRunResult {
  name: string;
  passed: boolean;
  failReason?: string;
  response?: string;
  action?: string;
}
