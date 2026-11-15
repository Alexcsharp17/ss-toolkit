# Generated from the external executor core and Instagram extension schemas. Do not edit manually.
from typing import Literal, TypedDict


CONTRACT_VERSIONS = (
    "1.0",
    "1.1",
)

MODULE_FEATURES = (
    "callbacks.v1",
    "event-sequence.v1",
    "managed-workflows.v1",
    "pause-resume.v1",
    "provider-retry-confirmation.v1",
    "workflow-input.v1",
)

PLATFORMS = (
    "instagram",
)

JOB_STATUSES = (
    "queued",
    "running",
    "paused",
    "completed",
    "partially_completed",
    "failed",
    "cancelled",
    "challenge_required",
    "rate_limited",
    "session_expired",
    "banned_or_locked",
)

EVENT_TYPES = (
    "job.accepted",
    "job.started",
    "job.progressed",
    "workflow.paused",
    "action.completed",
    "action.failed",
    "account.health_changed",
    "job.completed",
    "job.partially_completed",
    "job.rate_limited",
    "job.failed",
    "job.cancelled",
)

INSTAGRAM_ACTION_TYPES = (
    "instagram.account.health",
    "instagram.profile.get",
    "instagram.media.upload.photo",
    "instagram.media.upload.video",
    "instagram.media.upload.reel",
    "instagram.media.like",
    "instagram.story.upload",
    "instagram.comments.list",
    "instagram.warmup",
    "instagram.comments.reply",
    "instagram.comments.smart_reply",
    "instagram.comments.delete",
    "instagram.comments.pin",
    "instagram.dm.inbox",
    "instagram.dm.send",
    "instagram.dm.reply",
    "instagram.insights.basic",
)

WORKFLOW_TYPES = (
    "instagram.comments.smart_reply",
    "instagram.warmup",
)

INSTAGRAM_IMPLEMENTED_CAPABILITIES = (
    "instagram.account.health",
    "instagram.profile.get",
    "instagram.comments.list",
    "instagram.warmup",
    "instagram.comments.reply",
    "instagram.comments.smart_reply",
    "instagram.comments.delete",
    "instagram.comments.pin",
    "instagram.media.upload.photo",
    "instagram.media.upload.video",
    "instagram.media.upload.reel",
    "instagram.media.like",
    "instagram.story.upload",
    "instagram.dm.inbox",
    "instagram.dm.send",
    "instagram.dm.reply",
    "instagram.insights.basic",
)

ExternalExecutorPlatform = str
ExternalExecutorActionType = str
RegisteredExternalExecutorPlatform = Literal["instagram"]
ExternalExecutorJobStatus = Literal["queued", "running", "paused", "completed", "partially_completed", "failed", "cancelled", "challenge_required", "rate_limited", "session_expired", "banned_or_locked"]
ExternalExecutorEventType = Literal["job.accepted", "job.started", "job.progressed", "workflow.paused", "action.completed", "action.failed", "account.health_changed", "job.completed", "job.partially_completed", "job.rate_limited", "job.failed", "job.cancelled"]
InstagramExecutorActionType = Literal["instagram.account.health", "instagram.profile.get", "instagram.media.upload.photo", "instagram.media.upload.video", "instagram.media.upload.reel", "instagram.media.like", "instagram.story.upload", "instagram.comments.list", "instagram.warmup", "instagram.comments.reply", "instagram.comments.smart_reply", "instagram.comments.delete", "instagram.comments.pin", "instagram.dm.inbox", "instagram.dm.send", "instagram.dm.reply", "instagram.insights.basic"]


class ExternalExecutorInputFieldSchema(TypedDict, total=False):
    type: Literal['string', 'integer', 'number', 'boolean', 'array', 'object']
    title: str
    description: str
    enum: list[str]
    items: dict[str, str]
    default: object


class ExternalExecutorInputSchema(TypedDict, total=False):
    type: Literal['object']
    properties: dict[str, ExternalExecutorInputFieldSchema]
    required: list[str]
    additionalProperties: bool


class ExternalExecutorAccountConstraints(TypedDict, total=False):
    allowedExecutorAccountIds: list[str]
    excludeExecutorAccountIds: list[str]


class ExternalExecutorAccountSelector(TypedDict, total=False):
    mode: Literal['system', 'specific']
    accountIds: list[str]
    constraints: ExternalExecutorAccountConstraints


class InstagramExecutorCookie(TypedDict, total=False):
    name: str
    value: str
    domain: str
    path: str
    secure: bool
    httpOnly: bool
    expires: float


class InstagramExecutorAccountImportRequest(TypedDict, total=False):
    username: str
    password: str
    twoFactorSecret: str
    sessionid: str
    cookies: list[InstagramExecutorCookie]
    settings: dict[str, object]
    proxy: str


class InstagramExecutorAccountImportResponse(TypedDict, total=False):
    executorAccountId: str
    status: str
    username: str
    displayName: str
    authenticationMethod: Literal['session', 'credentials', 'stored']


class ExternalExecutorAccountProxyUpdateRequest(TypedDict):
    proxy: str | None


class ExternalExecutorAccountProxyUpdateResponse(TypedDict):
    executorAccountId: str
    configured: bool
    updatedAt: str


class ExternalExecutorPolicyEnvelope(TypedDict, total=False):
    policyVersion: str
    activityWindows: list[dict[str, str]]
    actionLimits: dict[str, dict[str, int]]
    durationMinutes: int
    progressiveLimits: dict[str, object]
    riskProfile: Literal['safe', 'standard', 'fast']
    scenarioRef: str
    targetPolicy: dict[str, object]


class JobStartRequest(TypedDict, total=False):
    idempotencyKey: str
    orderId: int
    platform: ExternalExecutorPlatform
    actionType: ExternalExecutorActionType
    quantity: int
    accountSelector: ExternalExecutorAccountSelector
    payload: dict[str, object]
    policyEnvelope: ExternalExecutorPolicyEnvelope
    callbackUrl: str


class JobStartResponse(TypedDict):
    jobId: str
    status: ExternalExecutorJobStatus
    acceptedAt: str


class ExternalExecutorUsageEvent(TypedDict, total=False):
    metric: str
    amount: float
    unit: str
    window: str


class ExternalExecutorActionEvent(TypedDict, total=False):
    eventId: str
    sequence: int
    jobId: str
    eventType: ExternalExecutorEventType
    occurredAt: str
    actionType: ExternalExecutorActionType
    status: ExternalExecutorJobStatus
    executorAccountId: str
    targetRef: str
    quantity: int
    completedCount: int
    totalCount: int
    errorCode: str
    errorMessage: str
    usage: ExternalExecutorUsageEvent
    metadata: dict[str, object]


class ExternalModuleManifest(TypedDict, total=False):
    moduleId: str
    platform: ExternalExecutorPlatform
    contractVersions: list[str]
    features: list[str]
    capabilities: list[ExternalExecutorActionType]
    inputSchemas: dict[str, ExternalExecutorInputSchema]
    workflowTypes: list[str]
    supportsPolling: bool
    supportsCallbacks: bool


class ExternalExecutorCallbackEnvelope(TypedDict):
    contractVersion: str
    moduleId: str
    event: ExternalExecutorActionEvent


class JobProgressResponse(TypedDict, total=False):
    jobId: str
    status: ExternalExecutorJobStatus
    completedCount: int
    totalCount: int
    nextRunAt: str
    assignedAccountIds: list[str]
    errorCode: str
    errorMessage: str
    result: dict[str, object]
    accountHealth: dict[str, object]
    eventSequence: int
    events: list[ExternalExecutorActionEvent]


__all__ = [
    'CONTRACT_VERSIONS',
    'MODULE_FEATURES',
    'PLATFORMS',
    'JOB_STATUSES',
    'EVENT_TYPES',
    'INSTAGRAM_ACTION_TYPES',
    'WORKFLOW_TYPES',
    'INSTAGRAM_IMPLEMENTED_CAPABILITIES',
    'ExternalExecutorPlatform',
    'ExternalExecutorActionType',
    'RegisteredExternalExecutorPlatform',
    'ExternalExecutorJobStatus',
    'ExternalExecutorEventType',
    'InstagramExecutorActionType',
    'ExternalExecutorInputFieldSchema',
    'ExternalExecutorInputSchema',
    'ExternalExecutorAccountConstraints',
    'ExternalExecutorAccountSelector',
    'InstagramExecutorCookie',
    'InstagramExecutorAccountImportRequest',
    'InstagramExecutorAccountImportResponse',
    'ExternalExecutorAccountProxyUpdateRequest',
    'ExternalExecutorAccountProxyUpdateResponse',
    'ExternalExecutorPolicyEnvelope',
    'JobStartRequest',
    'JobStartResponse',
    'JobProgressResponse',
    'ExternalExecutorUsageEvent',
    'ExternalExecutorActionEvent',
    'ExternalModuleManifest',
    'ExternalExecutorCallbackEnvelope',
]
