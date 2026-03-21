#!/usr/bin/env npx tsx
/**
 * Run Groq API key retrieval scenario
 * Usage: npx tsx ss-toolkit/src/scenarios/api-key-retrieval/groq/run.ts
 * Or: npm run groq:scenario (add script to ss-toolkit package.json)
 *
 * Runs several attempts in parallel, each with a different proxy.
 * Exits on first success or when all attempts finish.
 */

import type { MailProviderType } from '../../../categories/mail/MailFactory';
import { GroqApiKeyScenario } from './GroqApiKeyScenario';
import type { GroqScenarioResult } from './GroqApiKeyScenario';

/** Temporary working proxies for parallel attempts (used when PROXY env is not set) */
const DEFAULT_PROXIES = [
  { label: 'socks4', server: 'socks4://179.189.219.98:4145' },
  { label: 'http-1', server: 'http://51.79.71.106:8080' },
  { label: 'http-2', server: 'http://154.73.28.89:8080' },
];

async function main() {
  const mailProvider = (process.env.MAIL_PROVIDER ?? 'tempmailol') as MailProviderType;
  const baseName = `groq-${Date.now()}`;

  const PROXIES = process.env.PROXY
    ? [{ label: 'proxy', server: process.env.PROXY }]
    : DEFAULT_PROXIES;

  console.log('[Groq Scenario] Starting', PROXIES.length, 'attempt(s) (mail:', mailProvider, ')');

  const runOne = async (proxy: { label: string; server: string }): Promise<{ proxy: string; result: GroqScenarioResult }> => {
    const scenario = new GroqApiKeyScenario({
      headed: true,
      apiKeyName: `${baseName}-${proxy.label}`,
      stepDelayMs: 1500,
      emailPollMs: 5000,
      emailTimeoutMs: 120000,
      mailProvider,
      proxy: proxy.server,
    });
    const result = await scenario.run();
    return { proxy: proxy.label, result };
  };

  const outcomes = await Promise.allSettled(PROXIES.map((p) => runOne(p)));

  const succeeded = outcomes
    .filter((o): o is PromiseFulfilledResult<{ proxy: string; result: GroqScenarioResult }> => o.status === 'fulfilled' && o.value.result.success)
    .map((o) => o.value);

  const failed = outcomes
    .filter((o): o is PromiseFulfilledResult<{ proxy: string; result: GroqScenarioResult }> => o.status === 'fulfilled' && !o.value.result.success)
    .map((o) => o.value);

  const rejected = outcomes.filter((o): o is PromiseRejectedResult => o.status === 'rejected');

  if (succeeded.length > 0) {
    const first = succeeded[0];
    console.log('[Groq Scenario] Success via proxy:', first.proxy);
    console.log('API Key:', first.result.apiKey);
    console.log('Inbox:', first.result.inbox.address);
    return;
  }

  console.error('[Groq Scenario] All attempts failed.');
  for (const { proxy, result } of failed) {
    console.error(`  [${proxy}]`, result.error ?? 'Unknown error', '| Inbox:', result.inbox?.address ?? '-');
  }
  for (const r of rejected) {
    console.error('  [rejected]', r.reason?.message ?? r.reason);
  }
}

main().catch(console.error);
