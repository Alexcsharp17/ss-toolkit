import type { ContentCommentCandidate, ContentCommentDecision } from './content';

export const EXTERNAL_EXECUTOR_PLATFORMS = ['instagram'] as const;
export type ExternalExecutorPlatform = typeof EXTERNAL_EXECUTOR_PLATFORMS[number];

export const EXTERNAL_MODULE_CONTRACT_VERSIONS = ['1.0'] as const;
export type ExternalModuleContractVersion = typeof EXTERNAL_MODULE_CONTRACT_VERSIONS[number];

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
] as const satisfies readonly InstagramExecutorActionType[];
export type InstagramExecutorCapability = typeof INSTAGRAM_EXECUTOR_IMPLEMENTED_CAPABILITIES[number];

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
  repliedToCommentId?: string | number;
}

export interface InstagramCommentReplyResult {
  mediaId: string;
  comment: Record<string, unknown>;
  executorAccountId: string;
}

export interface InstagramExecutorActionPayloadMap {
  'instagram.account.health': Record<string, never>;
  'instagram.profile.get': InstagramProfileGetPayload;
  'instagram.comments.list': InstagramCommentsListPayload;
  'instagram.warmup': InstagramWarmupPayload;
  'instagram.comments.reply': InstagramCommentReplyPayload;
  'instagram.comments.smart_reply': InstagramSmartCommentsPayload;
}

export interface InstagramExecutorActionResultMap {
  'instagram.account.health': Record<string, unknown>;
  'instagram.profile.get': InstagramProfileGetResult;
  'instagram.comments.list': InstagramCommentsListResult;
  'instagram.warmup': InstagramWarmupProgressResult;
  'instagram.comments.reply': InstagramCommentReplyResult;
  'instagram.comments.smart_reply': InstagramSmartCommentsProgressResult;
}

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
  capabilities: InstagramExecutorActionType[];
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
