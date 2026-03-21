import type { SuggestReplyResult } from '../../../ai-chatting/types';
import { hasEscalation, isReplyOnly } from '../../../ai-chatting/assertions';

function result(partial: Partial<SuggestReplyResult>): SuggestReplyResult {
  return {
    suggestedText: partial.suggestedText ?? '',
    action: partial.action ?? 'reply',
    escalation: partial.escalation,
  };
}

describe('ai-chatting assertions', () => {
  it('hasEscalation matches reply_and_escalate and reason', () => {
    const r = result({
      action: 'reply_and_escalate',
      escalation: { reason: 'ready_to_buy', description: '', summary: '', confidence: 1 },
    });
    expect(hasEscalation(r, 'ready_to_buy')).toBe(true);
    expect(hasEscalation(r, 'offensive')).toBe(false);
  });

  it('hasEscalation returns false for reply without escalation object', () => {
    const r = result({ action: 'reply' });
    expect(hasEscalation(r, 'ready_to_buy')).toBe(false);
  });

  it('isReplyOnly is true for reply and ignore', () => {
    expect(isReplyOnly(result({ action: 'reply' }))).toBe(true);
    expect(isReplyOnly(result({ action: 'ignore' }))).toBe(true);
    expect(isReplyOnly(result({ action: 'escalate' }))).toBe(false);
  });
});
