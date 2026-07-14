import {
  EXTERNAL_EXECUTOR_JOB_STATUSES,
  EXTERNAL_EXECUTOR_PLATFORMS,
  EXTERNAL_MODULE_CONTRACT_VERSIONS,
  EXTERNAL_MODULE_FEATURES,
  INSTAGRAM_EXECUTOR_IMPLEMENTED_CAPABILITIES,
  INSTAGRAM_EXECUTOR_ACTION_TYPES,
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
    expect(EXTERNAL_MODULE_CONTRACT_VERSIONS).toEqual(['1.0']);
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
});
