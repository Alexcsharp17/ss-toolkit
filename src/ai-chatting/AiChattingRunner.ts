import { GroqChatClient } from './GroqChatClient';
import { SuggestReplyClient } from './SuggestReplyClient';
import { isReadyToBuy, printTranscript } from './assertions';
import type {
  HistoryMessage,
  SuggestReplyResult,
  SellerPersonaConfig,
  HappyPathResult,
  DeviationScenario,
  DeviationRunResult,
} from './types';

export interface HappyPathOptions {
  groqClient: GroqChatClient;
  suggestClient: SuggestReplyClient;
  buyerSystemPrompt: string;
  sellerPersona: SellerPersonaConfig;
  /** Maximum conversation turns before declaring failure (default 10) */
  maxTurns?: number;
  /** Delay in ms between turns to avoid rate limiting (default 8000) */
  turnDelayMs?: number;
  /** If true, print transcript to stdout during run (default false) */
  verbose?: boolean;
}

export interface DeviationRunOptions {
  suggestClient: SuggestReplyClient;
  scenarios: DeviationScenario[];
  sellerPersona: SellerPersonaConfig;
  /** Delay in ms between scenarios to avoid rate limiting (default 6000) */
  scenarioDelayMs?: number;
  verbose?: boolean;
}

/**
 * Runs the happy-path "buyer AI vs seller AI" scenario:
 * the buyer AI (Groq) sends messages, the seller AI (backend /suggest) responds.
 * Succeeds when the seller escalates with reason=ready_to_buy within maxTurns.
 */
export async function runHappyPath(options: HappyPathOptions): Promise<HappyPathResult> {
  const {
    groqClient,
    suggestClient,
    buyerSystemPrompt,
    sellerPersona,
    maxTurns = 10,
    turnDelayMs = 8_000,
    verbose = false,
  } = options;

  const history: HistoryMessage[] = [];
  let lastResult: SuggestReplyResult | undefined;

  for (let turn = 1; turn <= maxTurns; turn++) {
    if (turn > 1) {
      await new Promise((r) => setTimeout(r, turnDelayMs));
    }

    if (verbose) console.log(`── Ход ${turn}/${maxTurns} ──`);

    const buyerMessage = await groqClient.chat(buyerSystemPrompt, history);
    if (verbose) console.log(`  👤 Покупатель: ${buyerMessage}`);
    history.push({ text: buyerMessage, out: false });

    const result = await suggestClient.suggest(history, sellerPersona);
    lastResult = result;

    if (verbose) {
      const tag = result.escalation
        ? `${result.action} · ${result.escalation.reason}`
        : result.action;
      console.log(`  🤖 Продавец: ${result.suggestedText}  [${tag}]`);
    }

    if (isReadyToBuy(result)) {
      history.push({ text: result.suggestedText, out: true });
      if (verbose) printTranscript(history, result);
      return { success: true, turns: turn, history, lastResult: result };
    }

    history.push({ text: result.suggestedText, out: true });
  }

  if (verbose) printTranscript(history, lastResult);
  return { success: false, turns: maxTurns, history, lastResult };
}

/**
 * Runs a list of static deviation scenarios against the seller AI.
 * Each scenario sends a pre-built history and asserts the response matches expectations.
 */
export async function runDeviationScenarios(options: DeviationRunOptions): Promise<DeviationRunResult[]> {
  const { suggestClient, scenarios, sellerPersona, scenarioDelayMs = 6_000, verbose = false } =
    options;

  const results: DeviationRunResult[] = [];

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    if (i > 0) await new Promise((r) => setTimeout(r, scenarioDelayMs));

    if (verbose) console.log(`── ${scenario.name} ──`);

    try {
      const result = await suggestClient.suggest(scenario.history, sellerPersona);
      const tag = result.escalation
        ? `${result.action} · ${result.escalation.reason}`
        : result.action;

      if (verbose) {
        const preview = result.suggestedText.slice(0, 100);
        const ellipsis = result.suggestedText.length > 100 ? '...' : '';
        console.log(`   Response: "${preview}${ellipsis}"`);
        console.log(`   Action: [${tag}]`);
      }

      const failReason = scenario.assert(result);
      if (failReason) {
        if (verbose) console.log(`   ❌ FAIL: ${failReason}`);
        results.push({
          name: scenario.name,
          passed: false,
          failReason,
          response: result.suggestedText,
          action: tag,
        });
      } else {
        if (verbose) console.log(`   ✅ PASS`);
        results.push({ name: scenario.name, passed: true, response: result.suggestedText, action: tag });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      if (verbose) console.log(`   💥 ERROR: ${msg}`);
      results.push({ name: scenario.name, passed: false, failReason: `Crashed: ${msg}` });
    }
  }

  return results;
}
