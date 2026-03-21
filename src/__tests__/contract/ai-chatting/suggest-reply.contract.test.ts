/**
 * Contract: backend /suggest returns structured JSON.
 * No default URL — set SS_TOOLKIT_API_BASE_URL or API_BASE_URL to your backend origin.
 */

import { SuggestReplyClient } from '../../../ai-chatting/SuggestReplyClient';

const baseUrl = process.env.SS_TOOLKIT_API_BASE_URL || process.env.API_BASE_URL || '';
const adminKey = process.env.SS_TOOLKIT_ADMIN_API_KEY || process.env.ADMIN_API_KEY || 'sk_admin_fixed_key_12345';

const describeContract = baseUrl ? describe : describe.skip;

describeContract('SuggestReplyClient (contract)', () => {
  it('returns suggestedText and action for minimal history', async () => {
    const client = new SuggestReplyClient({
      baseUrl,
      adminApiKey: adminKey,
      accountId: 'ss-toolkit-contract-account',
      userId: 'ss-toolkit-contract-user',
    });
    const res = await client.suggest([{ text: 'Привет', out: false }]);
    expect(typeof res.suggestedText).toBe('string');
    expect(typeof res.action).toBe('string');
  }, 90_000);
});
