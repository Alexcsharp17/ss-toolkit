import type { MailProviderType } from '../../../categories/mail/MailFactory';

/**
 * Groq API key retrieval scenario config
 */
export interface GroqScenarioConfig {
  /** Run browser in headed mode (visible) */
  headed?: boolean;
  /** Proxy server (http://host:port or socks5://host:port) */
  proxy?: string;
  /** Use fingerprint injection (requires fingerprint-injector) */
  useFingerprint?: boolean;
  /** Email poll interval ms (waiting for verification) */
  emailPollMs?: number;
  /** Max email wait time ms */
  emailTimeoutMs?: number;
  /** API key name to create */
  apiKeyName?: string;
  /** Slow down actions (ms delay between steps) */
  stepDelayMs?: number;
  /** Temp mail provider for receiving verification email (mailtm | tempmailol). Default: tempmailol */
  mailProvider?: MailProviderType;
  /** Path to groq-runner binary (default: libs/groq-runner/groq-runner or GROQ_RUNNER_PATH) */
  groqRunnerPath?: string;
}

export const DEFAULT_GROQ_CONFIG: Omit<Required<GroqScenarioConfig>, 'proxy' | 'groqRunnerPath'> & { proxy?: string; groqRunnerPath?: string } = {
  headed: true,
  useFingerprint: false,
  emailPollMs: 5000,
  emailTimeoutMs: 120000,
  apiKeyName: `ss-toolkit-${Date.now()}`,
  stepDelayMs: 1000,
  mailProvider: 'tempmailol',
};
