import {
  EXTERNAL_EXECUTOR_JOB_STATUSES,
  EXTERNAL_EXECUTOR_PLATFORMS,
  EXTERNAL_MODULE_CONTRACT_VERSIONS,
  EXTERNAL_MODULE_FEATURES,
  INSTAGRAM_EXECUTOR_IMPLEMENTED_CAPABILITIES,
  INSTAGRAM_EXECUTOR_ACTION_TYPES,
} from '../../../shared-types';
import type {
  ExternalExecutorJobProgressResponseFor,
  ExternalExecutorJobStartRequestByAction,
  ExternalExecutorJobStartRequestFor,
  InstagramExecutorActionPayload,
  InstagramExecutorActionResult,
} from '../../../shared-types';

describe('external executor shared types', () => {
  it('exports the canonical Instagram executor wire constants', () => {
    expect(EXTERNAL_EXECUTOR_PLATFORMS).toEqual(['instagram']);
    expect(EXTERNAL_EXECUTOR_JOB_STATUSES).toEqual([
      'queued',
      'running',
      'paused',
      'completed',
      'partially_completed',
      'failed',
      'cancelled',
      'challenge_required',
      'rate_limited',
      'session_expired',
      'banned_or_locked',
    ]);
    expect(INSTAGRAM_EXECUTOR_ACTION_TYPES).toContain('instagram.comments.reply');
    expect(INSTAGRAM_EXECUTOR_ACTION_TYPES).toContain('instagram.account.health');
    expect(EXTERNAL_MODULE_CONTRACT_VERSIONS).toEqual(['1.0', '1.1']);
    expect(EXTERNAL_MODULE_FEATURES).toEqual([
      'callbacks.v1',
      'event-sequence.v1',
      'managed-workflows.v1',
      'pause-resume.v1',
      'provider-retry-confirmation.v1',
      'workflow-input.v1',
    ]);
    expect(INSTAGRAM_EXECUTOR_IMPLEMENTED_CAPABILITIES).toEqual([
      'instagram.account.health',
      'instagram.profile.get',
      'instagram.comments.list',
      'instagram.warmup',
      'instagram.comments.reply',
      'instagram.comments.smart_reply',
      'instagram.comments.delete',
      'instagram.comments.pin',
      'instagram.media.upload.photo',
      'instagram.media.upload.video',
      'instagram.media.upload.reel',
      'instagram.story.upload',
      'instagram.dm.inbox',
      'instagram.dm.send',
      'instagram.dm.reply',
      'instagram.insights.basic',
    ]);
  });

  it('correlates Instagram action types with their payload and result types', () => {
    const replyRequest = {
      idempotencyKey: 'test:reply:1',
      orderId: 1,
      platform: 'instagram' as const,
      actionType: 'instagram.comments.reply' as const,
      quantity: 1,
      accountSelector: { mode: 'system' as const },
      payload: {
        mediaId: 'media-1',
        commentId: 'comment-1',
        text: 'Thanks',
      },
    } satisfies ExternalExecutorJobStartRequestFor<'instagram.comments.reply'>;

    const dynamicRequest: ExternalExecutorJobStartRequestByAction = replyRequest;
    const dmPayload: InstagramExecutorActionPayload<'instagram.dm.send'> = {
      text: 'Hello',
      userIds: ['user-1'],
    };
    const commentsResult: InstagramExecutorActionResult<'instagram.comments.list'> = {
      mediaId: 'media-1',
      comments: [],
      executorAccountId: 'account-1',
    };
    const progress: ExternalExecutorJobProgressResponseFor<'instagram.comments.list'> = {
      jobId: 'job-1',
      status: 'completed',
      completedCount: 1,
      totalCount: 1,
      result: commentsResult,
    };

    expect(dynamicRequest.payload).toEqual(replyRequest.payload);
    expect(dmPayload.text).toBe('Hello');
    expect(progress.result?.executorAccountId).toBe('account-1');
  });

  it('keeps the default aliases usable for generic clients', () => {
    const request: ExternalExecutorJobStartRequestFor = {
      idempotencyKey: 'test:health:1',
      orderId: 1,
      platform: 'instagram',
      actionType: 'instagram.account.health',
      quantity: 1,
      accountSelector: { mode: 'system' },
      payload: {},
    };
    const progress: ExternalExecutorJobProgressResponseFor = {
      jobId: 'job-1',
      status: 'running',
      completedCount: 0,
      totalCount: 1,
      result: {},
    };

    expect(request.payload).toEqual({});
    expect(progress.status).toBe('running');
  });
});
