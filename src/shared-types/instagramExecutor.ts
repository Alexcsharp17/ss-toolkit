import type { ContentCommentCandidate, ContentCommentDecision } from './content';
import type {
  ExternalExecutorActionEvent,
  ExternalExecutorCallbackEnvelope,
  ExternalExecutorInputSchemas,
  ExternalExecutorJobProgressResponse,
  ExternalExecutorJobStartRequest,
  ExternalModuleManifest,
} from './externalExecutorCore';

export const INSTAGRAM_EXECUTOR_PLATFORM = 'instagram' as const;
export type InstagramExecutorPlatform = typeof INSTAGRAM_EXECUTOR_PLATFORM;

export const INSTAGRAM_EXECUTOR_ACTION_TYPES = [
  'instagram.account.health',
  'instagram.profile.get',
  'instagram.media.upload.photo',
  'instagram.media.upload.video',
  'instagram.media.upload.reel',
  'instagram.media.like',
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
  'instagram.media.like',
  'instagram.story.upload',
  'instagram.dm.inbox',
  'instagram.dm.send',
  'instagram.dm.reply',
  'instagram.insights.basic',
] as const satisfies readonly InstagramExecutorActionType[];
export type InstagramExecutorCapability = typeof INSTAGRAM_EXECUTOR_IMPLEMENTED_CAPABILITIES[number];

export type InstagramExecutorInputSchemas = ExternalExecutorInputSchemas<InstagramExecutorActionType>;

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

export interface InstagramMediaLikePayload {
  /** Canonical Instagram media id. Exactly one selector must be provided. */
  mediaId?: string;
  /** Public instagram.com post or reel URL. Exactly one selector must be provided. */
  mediaUrl?: string;
}

export interface InstagramMediaLikeResult {
  mediaId: string;
  mediaUrl?: string;
  liked: boolean;
  executorAccountId: string;
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

export interface InstagramExecutorActionPayloadMap {
  'instagram.account.health': Record<string, never>;
  'instagram.profile.get': InstagramProfileGetPayload;
  'instagram.media.upload.photo': InstagramMediaUploadPayload;
  'instagram.media.upload.video': InstagramMediaUploadPayload;
  'instagram.media.upload.reel': InstagramMediaUploadPayload;
  'instagram.media.like': InstagramMediaLikePayload;
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
  'instagram.media.like': InstagramMediaLikeResult;
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

export type InstagramExternalModuleManifest = ExternalModuleManifest<
  InstagramExecutorPlatform,
  InstagramExecutorActionType,
  InstagramExecutorWorkflowType
>;

export type InstagramExecutorJobStartRequestFor<
  TAction extends InstagramExecutorActionType = InstagramExecutorActionType,
> = ExternalExecutorJobStartRequest<
  InstagramExecutorPlatform,
  TAction,
  InstagramExecutorActionPayload<TAction>
>;

export type InstagramExecutorJobStartRequestByAction = {
  [TAction in InstagramExecutorActionType]: InstagramExecutorJobStartRequestFor<TAction>;
}[InstagramExecutorActionType];

export type InstagramExecutorJobProgressResponseFor<
  TAction extends InstagramExecutorActionType = InstagramExecutorActionType,
> = ExternalExecutorJobProgressResponse<InstagramExecutorActionResult<TAction>, TAction>;

export type InstagramExternalExecutorActionEvent = ExternalExecutorActionEvent<InstagramExecutorActionType>;
export type InstagramExecutorCallbackEnvelope = ExternalExecutorCallbackEnvelope<InstagramExecutorActionType>;

/** @deprecated Prefer InstagramExecutorJobStartRequestFor. */
export type ExternalExecutorJobStartRequestFor<
  TAction extends InstagramExecutorActionType = InstagramExecutorActionType,
> = InstagramExecutorJobStartRequestFor<TAction>;

/** @deprecated Prefer InstagramExecutorJobStartRequestByAction. */
export type ExternalExecutorJobStartRequestByAction = InstagramExecutorJobStartRequestByAction;

/** @deprecated Prefer InstagramExecutorJobProgressResponseFor. */
export type ExternalExecutorJobProgressResponseFor<
  TAction extends InstagramExecutorActionType = InstagramExecutorActionType,
> = InstagramExecutorJobProgressResponseFor<TAction>;

export interface InstagramExecutorCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  expires?: number;
}

/**
 * Secret-bearing import payload. Consumers must forward it directly to the
 * executor and must not persist it in the panel database or browser storage.
 */
export interface InstagramExecutorAccountImportRequest {
  username?: string;
  password?: string;
  twoFactorSecret?: string;
  sessionid?: string;
  cookies?: InstagramExecutorCookie[];
  settings?: Record<string, unknown>;
  proxy?: string;
}

export interface InstagramExecutorAccountImportResponse {
  executorAccountId: string;
  status: string;
  username?: string;
  displayName?: string;
  authenticationMethod?: 'session' | 'credentials' | 'stored';
}
