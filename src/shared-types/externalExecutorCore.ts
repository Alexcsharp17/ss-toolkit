/** Platform-neutral wire primitives shared by SS-panel and external modules. */

export type ExternalExecutorPlatform = string;

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

export type ExternalExecutorInputSchemas<TCapability extends string = string> = Partial<
  Record<TCapability, ExternalExecutorInputSchema>
>;

export interface ExternalModuleManifest<
  TPlatform extends ExternalExecutorPlatform = ExternalExecutorPlatform,
  TCapability extends string = string,
  TWorkflow extends string = string,
> {
  moduleId: string;
  platform: TPlatform;
  contractVersions: ExternalModuleContractVersion[];
  features?: ExternalModuleFeature[];
  capabilities: TCapability[];
  inputSchemas?: ExternalExecutorInputSchemas<TCapability>;
  workflowTypes: TWorkflow[];
  supportsPolling: boolean;
  supportsCallbacks: boolean;
}

export interface ExternalModuleHealthResponse {
  moduleId: string;
  status: 'ok' | 'degraded' | 'unavailable';
}

export interface ExternalExecutorAccountConstraints {
  allowedExecutorAccountIds?: string[];
  excludeExecutorAccountIds?: string[];
  [constraint: string]: unknown;
}

export interface ExternalExecutorAccountSelector {
  mode: 'system' | 'specific';
  accountIds?: string[];
  constraints?: ExternalExecutorAccountConstraints;
}

/** Secret-bearing module request. The panel must never log or persist `proxy`. */
export interface ExternalExecutorAccountProxyUpdateRequest {
  proxy: string | null;
}

export interface ExternalExecutorAccountProxyUpdateResponse {
  executorAccountId: string;
  configured: boolean;
  updatedAt: string;
}

export interface ExternalExecutorAccountDeleteResponse {
  executorAccountId: string;
  deleted: boolean;
}

/** Platform-neutral fields returned after an executor imports account credentials/session data. */
export interface ExternalExecutorAccountImportResponse {
  executorAccountId: string;
  status: string;
  username?: string;
  displayName?: string;
  authenticationMethod?: string;
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

export interface ExternalExecutorJobStartRequest<
  TPlatform extends ExternalExecutorPlatform = ExternalExecutorPlatform,
  TAction extends string = string,
  TPayload = Record<string, unknown>,
> {
  idempotencyKey: string;
  orderId: number;
  platform: TPlatform;
  actionType: TAction;
  quantity: number;
  accountSelector: ExternalExecutorAccountSelector;
  payload: TPayload;
  policyEnvelope?: ExternalExecutorPolicyEnvelope;
  callbackUrl?: string;
}

export interface ExternalExecutorJobStartResponse {
  jobId: string;
  status: ExternalExecutorJobStatus;
  acceptedAt: string;
}

export interface ExternalExecutorUsageEvent {
  metric: string;
  amount: number;
  unit?: string;
  window?: string;
}

/** Normalized, replayable event emitted by a social executor. */
export interface ExternalExecutorActionEvent<TAction extends string = string> {
  eventId: string;
  sequence: number;
  jobId: string;
  eventType: ExternalExecutorEventType;
  occurredAt: string;
  actionType?: TAction;
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

export interface ExternalExecutorJobProgressResponse<
  TResult = Record<string, unknown>,
  TAction extends string = string,
> {
  jobId: string;
  status: ExternalExecutorJobStatus;
  completedCount: number;
  totalCount: number;
  nextRunAt?: string;
  assignedAccountIds?: string[];
  errorCode?: string;
  errorMessage?: string;
  result?: TResult;
  accountHealth?: Record<string, unknown>;
  eventSequence?: number;
  events?: ExternalExecutorActionEvent<TAction>[];
}

export interface ExternalExecutorCallbackEnvelope<TAction extends string = string> {
  contractVersion: ExternalModuleContractVersion;
  moduleId: string;
  event: ExternalExecutorActionEvent<TAction>;
}
