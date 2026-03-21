import type { HistoryMessage, SuggestReplyResult } from './types';

/** Returns true when the result contains an escalation with one of the given reasons. */
export function hasEscalation(result: SuggestReplyResult, ...reasons: string[]): boolean {
  if (!result.escalation) return false;
  const act = result.action;
  if (act !== 'escalate' && act !== 'reply_and_escalate') return false;
  return reasons.includes(result.escalation.reason);
}

/** Returns true when the result is a plain reply (no escalation). */
export function isReplyOnly(result: SuggestReplyResult): boolean {
  return result.action === 'reply' || result.action === 'ignore';
}

/** Returns true when the result signals the buyer is ready to purchase. */
export function isReadyToBuy(result: SuggestReplyResult): boolean {
  return hasEscalation(result, 'ready_to_buy');
}

/**
 * Prints a full conversation transcript to stdout.
 * Useful for debugging failing scenarios.
 */
export function printTranscript(history: HistoryMessage[], result?: SuggestReplyResult): void {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ПОЛНЫЙ ТРАНСКРИПТ ДИАЛОГА');
  console.log('═══════════════════════════════════════════════════════════════\n');

  for (const msg of history) {
    const role = msg.out ? '🤖 Продавец' : '👤 Покупатель';
    console.log(`  ${role}: ${msg.text}`);
    console.log();
  }

  if (result?.escalation) {
    console.log(`  📋 Последний action: ${result.action}`);
    console.log(`  📋 Escalation reason: ${result.escalation.reason}`);
    console.log(`  📋 Confidence: ${result.escalation.confidence}`);
    console.log(`  📋 Summary: ${result.escalation.summary}`);
  }
  console.log('═══════════════════════════════════════════════════════════════\n');
}
