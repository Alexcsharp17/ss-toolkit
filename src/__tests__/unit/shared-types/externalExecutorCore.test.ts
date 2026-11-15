import fs from 'node:fs';
import path from 'node:path';
import type {
  ExternalExecutorJobStartRequest,
  ExternalModuleManifest,
} from '../../../shared-types/externalExecutorCore';

describe('external executor core contract', () => {
  it('accepts a new platform without changing the core contract', () => {
    type TwitterAction = 'twitter.account.health' | 'twitter.post.like';
    type TwitterWorkflow = 'twitter.warmup';

    const manifest: ExternalModuleManifest<'twitter', TwitterAction, TwitterWorkflow> = {
      moduleId: 'twitter-executor',
      platform: 'twitter',
      contractVersions: ['1.1'],
      capabilities: ['twitter.account.health', 'twitter.post.like'],
      workflowTypes: ['twitter.warmup'],
      supportsPolling: true,
      supportsCallbacks: false,
    };
    const request: ExternalExecutorJobStartRequest<
      'twitter',
      'twitter.post.like',
      { tweetId: string }
    > = {
      idempotencyKey: 'twitter:order:1:v1',
      orderId: 1,
      platform: 'twitter',
      actionType: 'twitter.post.like',
      quantity: 1,
      accountSelector: { mode: 'system' },
      payload: { tweetId: 'tweet-1' },
    };

    expect(manifest.platform).toBe('twitter');
    expect(request.payload.tweetId).toBe('tweet-1');
  });

  it('does not contain platform extension identifiers', () => {
    const coreSource = fs.readFileSync(
      path.resolve(__dirname, '../../../shared-types/externalExecutorCore.ts'),
      'utf8',
    );

    expect(coreSource.toLowerCase()).not.toContain('instagram');
  });
});
