/**
 * Contract: Groq API returns non-empty completion (real key).
 * Skip when SS_TOOLKIT_GROQ_API_KEY is unset.
 */

import { GroqChatClient } from '../../../ai-chatting/GroqChatClient';

const key = process.env.SS_TOOLKIT_GROQ_API_KEY || '';

const describeContract = key ? describe : describe.skip;

describeContract('GroqChatClient (contract)', () => {
  it('returns non-empty text', async () => {
    const client = new GroqChatClient({ apiKey: key });
    const text = await client.chat('Reply with exactly one word: OK.', [{ text: 'Ping', out: true }]);
    expect(text.trim().length).toBeGreaterThan(0);
  }, 45_000);
});
