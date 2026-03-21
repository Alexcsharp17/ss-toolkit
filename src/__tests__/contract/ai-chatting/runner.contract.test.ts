/**
 * Contract: one buyer turn + one seller turn completes (real Groq + backend).
 * Skip when either SS_TOOLKIT_GROQ_API_KEY or SS_TOOLKIT_API_BASE_URL is missing.
 */

import { GroqChatClient } from '../../../ai-chatting/GroqChatClient';
import { SuggestReplyClient } from '../../../ai-chatting/SuggestReplyClient';
import { runHappyPath } from '../../../ai-chatting/AiChattingRunner';

const groqKey = process.env.SS_TOOLKIT_GROQ_API_KEY || '';
const baseUrl = process.env.SS_TOOLKIT_API_BASE_URL || '';
const adminKey = process.env.SS_TOOLKIT_ADMIN_API_KEY || 'sk_admin_fixed_key_12345';

const describeContract = groqKey && baseUrl ? describe : describe.skip;

describeContract('runHappyPath (contract smoke)', () => {
  it(
    'completes one turn with a valid seller response shape',
    async () => {
      const groqClient = new GroqChatClient({ apiKey: groqKey });
      const suggestClient = new SuggestReplyClient({
        baseUrl,
        adminApiKey: adminKey,
        accountId: 'ss-toolkit-runner-contract',
        userId: 'ss-toolkit-runner-user',
      });

      const result = await runHappyPath({
        groqClient,
        suggestClient,
        buyerSystemPrompt: 'Say exactly one short Russian sentence asking what is sold here.',
        suggestOverrides: undefined,
        isSuccess: (r) =>
          r.suggestedText.length > 0 &&
          ['reply', 'ignore', 'escalate', 'reply_and_escalate'].includes(r.action),
        maxTurns: 1,
        turnDelayMs: 0,
        verbose: false,
      });

      expect(result.history.length).toBeGreaterThanOrEqual(2);
      expect(result.lastResult?.suggestedText.length).toBeGreaterThan(0);
    },
    120_000,
  );
});
