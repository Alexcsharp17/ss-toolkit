import type { ContentCommentCandidate, ContentCommentDecision } from './content';

export const EXTERNAL_EXECUTOR_PLATFORMS = ['instagram'] as const;
export type ExternalExecutorPlatform = typeof EXTERNAL_EXECUTOR_PLATFORMS[number];

export const EXTERNAL_MODULE_CONTRACT_VERSIONS = ['1.0', '1.1'] as const;
export type ExternalModuleContractVersion = typeof EXTERNAL_MODULE_CONTRACT_VERSIONS[number];

export const EXTERNAL_MODULE_FEATURES = [
  'callbacks.v1',
  'event-sequence.v1',
  'managed-workflows.v1',
  'pause-resume.v1',
  'provider-retry-confirmation.v1',
  'workflow-input.v1',
] as const;
export type ExternalModuleFeature = typeof EXTERNAL_MODULE_FEATURES[number];

export const EXTERNAL_EXECUTOR_JOB_STATUSES = [
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
] as const;
export type ExternalExecutorJobStatus = typeof EXTERNAL_EXECUTOR_JOB_STATUSES[number];

export const EXTERNAL_EXECUTOR_EVENT_TYPES = [
  'job.accepted',
  'job.started',
  'job.progressed',
  'workflow.paused',
  'action.completed',
  'action.failed',
  'account.health_changed',
  'job.completed',
  'job.partially_completed',
  'job.rate_limited',
  'job.failed',
  'job.cancelled',
] as const;
export type ExternalExecutorEventType = typeof EXTERNAL_EXECUTOR_EVENT_TYPES[number];

export const INSTAGRAM_EXECUTOR_ACTION_TYPES = [
  'instagram.account.health',
  'instagram.profile.get',
  'instagram.media.upload.photo',
  'instagram.media.upload.video',
  'instagram.media.upload.reel',
  'instagram.story.upload',
  'instagram.comments.list',
  'instagram.warmup',
  'instagram.comments.reply',
  'instagram.comments.smart_reply',
  'instagram.comments.delete',
  'instagram.comments.pin',
  'instagram.dm.inbox',
  'instagram.dm.send',
  'instagram.dm.reply',
  'instagram.insights.basic',
] as const;
export type InstagramExecutorActionType = typeof INSTAGRAM_EXECUTOR_ACTION_TYPES[number];

export const INSTAGRAM_EXECUTOR_WORKFLOW_TYPES = [
  'instagram.comments.smart_reply',
  'instagram.warmup',
] as const;
export type InstagramExecutorWorkflowType = typeof INSTAGRAM_EXECUTOR_WORKFLOW_TYPES[number];

export const INSTAGRAM_EXECUTOR_IMPLEMENTED_CAPABILITIES = [
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
] as const satisfies readonly InstagramExecutorActionType[];
export type InstagramExecutorCapability = typeof INSTAGRAM_EXECUTOR_IMPLEMENTED_CAPABILITIES[number];

export type ExternalExecutorInputFieldType = 'string' | 'integer' | 'number' | 'boolean' | 'array' | 'object';

export interface ExternalExecutorInputFieldSchema {
  type: ExternalExecutorInputFieldType;
  title?: string;
  description?: string;
  enum?: string[];
  items?: { type: ExternalExecutorInputFieldType };
  default?: unknown;
}

export interface ExternalExecutorInputSchema {
  type: 'object';
  properties: Record<string, ExternalExecutorInputFieldSchema>;
  required?: string[];
  additionalProperties?: boolean;
}

export type ExternalExecutorInputSchemas = Partial<Record<InstagramExecutorActionType, ExternalExecutorInputSchema>>;

export interface InstagramProfileGetPayload {
  /** Omit both selectors to fetch the authenticated executor account profile. */
  username?: string;
  userId?: string;
}

export interface InstagramProfileGetResult {
  profile: Record<string, unknown>;
  executorAccountId: string;
}

export interface InstagramCommentsListPayload {
  mediaId: string;
  amount?: number;
  cursor?: string;
}

export interface InstagramCommentsListResult {
  mediaId: string;
  comments: Array<Record<string, unknown>>;
  nextCursor?: string;
  executorAccountId: string;
}

export interface InstagramWarmupPayload {
  actionMix?: Array<'instagram.account.health' | 'instagram.profile.get' | 'instagram.comments.list'>;
  targetIds?: string[];
  mediaIds?: string[];
  durationMinutes?: number;
}

export interface InstagramWarmupProgressResult {
  phase: 'warmup';
  cursor: number;
  startedAt?: string;
  lastAction?: string;
  lastTarget?: string;
  accountId?: string;
  stoppedReason?: 'duration_elapsed';
}

export interface InstagramCommentReplyPayload {
  mediaId: string;
  text: string;
  /** Native Instagram comment id to reply to. */
  commentId?: string | number;
  /** @deprecated Use commentId. Kept for compatibility with early executor clients. */
  repliedToCommentId?: string | number;
}

export interface InstagramCommentReplyResult {
  mediaId: string;
  comment: Record<string, unknown>;
  executorAccountId: string;
}

export interface InstagramMediaUploadPayload {
  /** HTTPS URL fetched by the executor into private temporary storage. */
  mediaUrl: string;
  caption?: string;
  thumbnailUrl?: string;
}

export interface InstagramMediaUploadResult {
  media: Record<string, unknown>;
  executorAccountId: string;
  mediaId?: string;
}

export interface InstagramStoryUploadPayload extends InstagramMediaUploadPayload {
  mediaType: 'photo' | 'video';
}

export interface InstagramStoryUploadResult {
  story: Record<string, unknown>;
  executorAccountId: string;
  mediaId?: string;
}

export interface InstagramCommentModerationPayload {
  mediaId: string;
  commentIds: Array<string | number>;
}

export interface InstagramCommentModerationResult {
  mediaId: string;
  affectedCommentIds: string[];
  executorAccountId: string;
}

export interface InstagramDmInboxPayload {
  amount?: number;
  selectedFilter?: 'flagged' | 'unread';
  box?: 'primary' | 'general';
  threadMessageLimit?: number;
}

export interface InstagramDmInboxResult {
  threads: Array<Record<string, unknown>>;
  executorAccountId: string;
}

export interface InstagramDmSendPayload {
  text: string;
  userIds?: Array<string | number>;
  threadIds?: Array<string | number>;
}

export interface InstagramDmSendResult {
  message: Record<string, unknown>;
  executorAccountId: string;
  messageId?: string;
  threadId?: string;
}

export interface InstagramDmReplyPayload {
  threadId: string | number;
  text: string;
}

export interface InstagramDmReplyResult {
  message: Record<string, unknown>;
  executorAccountId: string;
  messageId?: string;
  threadId?: string;
}

export interface InstagramInsightsPayload {
  mediaId?: string;
}

export interface InstagramInsightsResult {
  scope: 'account' | 'media';
  insights: Record<string, unknown>;
  executorAccountId: string;
  mediaId?: string;
}

export interface InstagramExecutorActionPayloadMap {
  'instagram.account.health': Record<string, never>;
  'instagram.profile.get': InstagramProfileGetPayload;
  'instagram.media.upload.photo': InstagramMediaUploadPayload;
  'instagram.media.upload.video': InstagramMediaUploadPayload;
  'instagram.media.upload.reel': InstagramMediaUploadPayload;
  'instagram.story.upload': InstagramStoryUploadPayload;
  'instagram.comments.list': InstagramCommentsListPayload;
  'instagram.warmup': InstagramWarmupPayload;
  'instagram.comments.reply': InstagramCommentReplyPayload;
  'instagram.comments.smart_reply': InstagramSmartCommentsPayload;
  'instagram.comments.delete': InstagramCommentModerationPayload;
  'instagram.comments.pin': InstagramCommentModerationPayload;
  'instagram.dm.inbox': InstagramDmInboxPayload;
  'instagram.dm.send': InstagramDmSendPayload;
  'instagram.dm.reply': InstagramDmReplyPayload;
  'instagram.insights.basic': InstagramInsightsPayload;
}

export interface InstagramExecutorActionResultMap {
  'instagram.account.health': Record<string, unknown>;
  'instagram.profile.get': InstagramProfileGetResult;
  'instagram.media.upload.photo': InstagramMediaUploadResult;
  'instagram.media.upload.video': InstagramMediaUploadResult;
  'instagram.media.upload.reel': InstagramMediaUploadResult;
  'instagram.story.upload': InstagramStoryUploadResult;
  'instagram.comments.list': InstagramCommentsListResult;
  'instagram.warmup': InstagramWarmupProgressResult;
  'instagram.comments.reply': InstagramCommentReplyResult;
  'instagram.comments.smart_reply': InstagramSmartCommentsProgressResult;
  'instagram.comments.delete': InstagramCommentModerationResult;
  'instagram.comments.pin': InstagramCommentModerationResult;
  'instagram.dm.inbox': InstagramDmInboxResult;
  'instagram.dm.send': InstagramDmSendResult;
  'instagram.dm.reply': InstagramDmReplyResult;
  'instagram.insights.basic': InstagramInsightsResult;
}

/** Payload selected by an Instagram action type. */
export type InstagramExecutorActionPayload<
  TAction extends InstagramExecutorActionType = InstagramExecutorActionType,
> = InstagramExecutorActionPayloadMap[TAction];

/** Result selected by an Instagram action type. */
export type InstagramExecutorActionResult<
  TAction extends InstagramExecutorActionType = InstagramExecutorActionType,
> = InstagramExecutorActionResultMap[TAction];

export interface InstagramSmartCommentsPayload {
  mediaIds: string[];
  maxCandidates?: number;
  scenarioRef?: string;
}

export interface InstagramSmartCommentCandidate extends ContentCommentCandidate {
  mediaId: string;
  commentId: string;
  authorUsername?: string;
}

export interface InstagramSmartCommentsProgressResult {
  phase: 'awaiting_content' | 'publishing';
  candidates?: InstagramSmartCommentCandidate[];
  publishedCandidateIds?: string[];
  scenarioRef?: string;
}

export interface InstagramSmartCommentsWorkflowInput {
  inputIdempotencyKey: string;
  decisions: ContentCommentDecision[];
}

export interface ExternalModuleManifest {
  moduleId: string;
  platform: ExternalExecutorPlatform;
  contractVersions: ExternalModuleContractVersion[];
  features?: ExternalModuleFeature[];
  capabilities: InstagramExecutorActionType[];
  inputSchemas?: ExternalExecutorInputSchemas;
  workflowTypes: string[];
  supportsPolling: boolean;
  supportsCallbacks: boolean;
}

export interface ExternalModuleHealthResponse {
  moduleId: string;
  status: 'ok' | 'degraded' | 'unavailable';
}

export interface ExternalExecutorAccountSelector {
  mode: 'system' | 'specific';
  accountIds?: string[];
  constraints?: Record<string, unknown>;
}

export interface ExternalExecutorAccountDeleteResponse {
  executorAccountId: string;
  deleted: boolean;
}

export interface ExternalExecutorActivityWindow {
  from: string;
  to: string;
  timezone: string;
}

export interface ExternalExecutorActionLimit {
  hourly?: number;
  daily?: number;
}

export interface ExternalExecutorProgressiveLimitPolicy {
  driver: 'calendar_days' | 'success_count' | 'hybrid';
  startPercent: number;
  targetPercent: number;
  rampDays?: number;
  rampSuccesses?: number;
  hybridPolicy?: 'min';
}

/** Immutable policy snapshot attached to one external execution. */
export interface ExternalExecutorPolicyEnvelope {
  policyVersion: string;
  activityWindows?: ExternalExecutorActivityWindow[];
  actionLimits?: Record<string, ExternalExecutorActionLimit>;
  durationMinutes?: number;
  progressiveLimits?: ExternalExecutorProgressiveLimitPolicy;
  riskProfile?: 'safe' | 'standard' | 'fast';
  scenarioRef?: string;
  targetPolicy?: Record<string, unknown>;
}

export interface ExternalExecutorJobStartRequest {
  idempotencyKey: string;
  orderId: number;
  platform: ExternalExecutorPlatform;
  actionType: InstagramExecutorActionType;
  quantity: number;
  accountSelector: ExternalExecutorAccountSelector;
  payload: Record<string, unknown>;
  policyEnvelope?: ExternalExecutorPolicyEnvelope;
  callbackUrl?: string;
}

export interface ExternalExecutorJobStartResponse {
  jobId: string;
  status: ExternalExecutorJobStatus;
  acceptedAt: string;
}

export interface ExternalExecutorJobProgressResponse {
  jobId: string;
  status: ExternalExecutorJobStatus;
  completedCount: number;
  totalCount: number;
  nextRunAt?: string;
  assignedAccountIds?: string[];
  errorCode?: string;
  errorMessage?: string;
  result?: Record<string, unknown>;
  accountHealth?: Record<string, unknown>;
  eventSequence?: number;
  events?: ExternalExecutorActionEvent[];
}

/**
 * Action-correlated start request for Instagram callers.
 *
 * ExternalExecutorJobStartRequest remains intentionally broad for generic
 * module clients and older integrations. New Instagram code can use this
 * alias when it knows the action at compile time.
 */
export type ExternalExecutorJobStartRequestFor<
  TAction extends InstagramExecutorActionType = InstagramExecutorActionType,
> = Omit<ExternalExecutorJobStartRequest, 'actionType' | 'payload'> & {
  actionType: TAction;
  payload: InstagramExecutorActionPayload<TAction>;
};

/** Union form that preserves action/payload correlation for dynamic dispatch. */
export type ExternalExecutorJobStartRequestByAction = {
  [TAction in InstagramExecutorActionType]: ExternalExecutorJobStartRequestFor<TAction>;
}[InstagramExecutorActionType];

/** Progress response with an action-specific result payload. */
export type ExternalExecutorJobProgressResponseFor<
  TAction extends InstagramExecutorActionType = InstagramExecutorActionType,
> = Omit<ExternalExecutorJobProgressResponse, 'result'> & {
  result?: InstagramExecutorActionResult<TAction>;
};

export interface ExternalExecutorUsageEvent {
  metric: string;
  amount: number;
  unit?: string;
  window?: string;
}

/** Normalized, replayable event emitted by a social executor. */
export interface ExternalExecutorActionEvent {
  eventId: string;
  sequence: number;
  jobId: string;
  eventType: ExternalExecutorEventType;
  occurredAt: string;
  actionType?: InstagramExecutorActionType;
  status?: ExternalExecutorJobStatus;
  executorAccountId?: string;
  targetRef?: string;
  quantity?: number;
  completedCount?: number;
  totalCount?: number;
  errorCode?: string;
  errorMessage?: string;
  usage?: ExternalExecutorUsageEvent;
  metadata?: Record<string, unknown>;
}

export interface ExternalExecutorCallbackEnvelope {
  contractVersion: ExternalModuleContractVersion;
  moduleId: string;
  event: ExternalExecutorActionEvent;
}
