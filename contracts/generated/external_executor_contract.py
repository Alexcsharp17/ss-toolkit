# Generated from contracts/external-executor.schema.json. Do not edit manually.
from typing import Literal, TypedDict


CONTRACT_VERSIONS = (
    "1.0",
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
    "instagram.story.upload",
    "instagram.dm.inbox",
    "instagram.dm.send",
    "instagram.dm.reply",
    "instagram.insights.basic",
)

ExternalExecutorPlatform = Literal["instagram"]
ExternalExecutorJobStatus = Literal["queued", "running", "paused", "completed", "partially_completed", "failed", "cancelled", "challenge_required", "rate_limited", "session_expired", "banned_or_locked"]
ExternalExecutorEventType = Literal["job.accepted", "job.started", "job.progressed", "workflow.paused", "action.completed", "action.failed", "account.health_changed", "job.completed", "job.partially_completed", "job.rate_limited", "job.failed", "job.cancelled"]
InstagramExecutorActionType = Literal["instagram.account.health", "instagram.profile.get", "instagram.media.upload.photo", "instagram.media.upload.video", "instagram.media.upload.reel", "instagram.story.upload", "instagram.comments.list", "instagram.warmup", "instagram.comments.reply", "instagram.comments.smart_reply", "instagram.comments.delete", "instagram.comments.pin", "instagram.dm.inbox", "instagram.dm.send", "instagram.dm.reply", "instagram.insights.basic"]


class AccountSelector(TypedDict, total=False):
    mode: Literal['system', 'specific']
    accountIds: list[str]
    constraints: dict[str, object]


class JobStartRequest(TypedDict, total=False):
    idempotencyKey: str
    orderId: int
    platform: ExternalExecutorPlatform
    actionType: InstagramExecutorActionType
    quantity: int
    accountSelector: AccountSelector
    payload: dict[str, object]
    policyEnvelope: dict[str, object]
    callbackUrl: str


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


__all__ = [
    'CONTRACT_VERSIONS',
    'PLATFORMS',
    'JOB_STATUSES',
    'EVENT_TYPES',
    'INSTAGRAM_ACTION_TYPES',
    'WORKFLOW_TYPES',
    'INSTAGRAM_IMPLEMENTED_CAPABILITIES',
    'ExternalExecutorPlatform',
    'ExternalExecutorJobStatus',
    'ExternalExecutorEventType',
    'InstagramExecutorActionType',
    'AccountSelector',
    'JobStartRequest',
    'JobProgressResponse',
]
