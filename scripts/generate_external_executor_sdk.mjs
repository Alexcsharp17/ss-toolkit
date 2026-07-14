#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const toolkitRoot = path.resolve(scriptDir, '..');
const schemaPath = path.join(toolkitRoot, 'contracts', 'external-executor.schema.json');
const outputPath = path.join(toolkitRoot, 'contracts', 'generated', 'external_executor_contract.py');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const fields = [
  ['contractVersions', 'CONTRACT_VERSIONS'],
  ['moduleFeatures', 'MODULE_FEATURES'],
  ['platforms', 'PLATFORMS'],
  ['jobStatuses', 'JOB_STATUSES'],
  ['eventTypes', 'EVENT_TYPES'],
  ['instagramActionTypes', 'INSTAGRAM_ACTION_TYPES'],
  ['workflowTypes', 'WORKFLOW_TYPES'],
  ['instagramImplementedCapabilities', 'INSTAGRAM_IMPLEMENTED_CAPABILITIES'],
];

const valuesFor = (field) => schema.properties[field].items.enum;
const pythonList = (values) => values.map((value) => `    ${JSON.stringify(value)},`).join('\n');

const output = `# Generated from contracts/external-executor.schema.json. Do not edit manually.\nfrom typing import Literal, TypedDict\n\n${fields.map(([schemaField, pythonName]) => `\n${pythonName} = (\n${pythonList(valuesFor(schemaField))}\n)\n`).join('')}\nExternalExecutorPlatform = Literal[${valuesFor('platforms').map(JSON.stringify).join(', ')}]\nExternalExecutorJobStatus = Literal[${valuesFor('jobStatuses').map(JSON.stringify).join(', ')}]\nExternalExecutorEventType = Literal[${valuesFor('eventTypes').map(JSON.stringify).join(', ')}]\nInstagramExecutorActionType = Literal[${valuesFor('instagramActionTypes').map(JSON.stringify).join(', ')}]\n\n\nclass ExternalExecutorAccountSelector(TypedDict, total=False):\n    mode: Literal['system', 'specific']\n    accountIds: list[str]\n    constraints: dict[str, object]\n\n\nclass ExternalExecutorPolicyEnvelope(TypedDict, total=False):\n    policyVersion: str\n    activityWindows: list[dict[str, str]]\n    actionLimits: dict[str, dict[str, int]]\n    durationMinutes: int\n    progressiveLimits: dict[str, object]\n    riskProfile: Literal['safe', 'standard', 'fast']\n    scenarioRef: str\n    targetPolicy: dict[str, object]\n\n\nclass JobStartRequest(TypedDict, total=False):\n    idempotencyKey: str\n    orderId: int\n    platform: ExternalExecutorPlatform\n    actionType: InstagramExecutorActionType\n    quantity: int\n    accountSelector: ExternalExecutorAccountSelector\n    payload: dict[str, object]\n    policyEnvelope: ExternalExecutorPolicyEnvelope\n    callbackUrl: str\n\n\nclass JobStartResponse(TypedDict):\n    jobId: str\n    status: ExternalExecutorJobStatus\n    acceptedAt: str\n\n\nclass ExternalExecutorUsageEvent(TypedDict, total=False):\n    metric: str\n    amount: float\n    unit: str\n    window: str\n\n\nclass ExternalExecutorActionEvent(TypedDict, total=False):\n    eventId: str\n    sequence: int\n    jobId: str\n    eventType: ExternalExecutorEventType\n    occurredAt: str\n    actionType: InstagramExecutorActionType\n    status: ExternalExecutorJobStatus\n    executorAccountId: str\n    targetRef: str\n    quantity: int\n    completedCount: int\n    totalCount: int\n    errorCode: str\n    errorMessage: str\n    usage: ExternalExecutorUsageEvent\n    metadata: dict[str, object]\n\n\nclass ExternalModuleManifest(TypedDict, total=False):\n    moduleId: str\n    platform: ExternalExecutorPlatform\n    contractVersions: list[str]\n    features: list[str]\n    capabilities: list[InstagramExecutorActionType]\n    workflowTypes: list[str]\n    supportsPolling: bool\n    supportsCallbacks: bool\n\n\nclass ExternalExecutorCallbackEnvelope(TypedDict):\n    contractVersion: str\n    moduleId: str\n    event: ExternalExecutorActionEvent\n\n\nclass JobProgressResponse(TypedDict, total=False):\n    jobId: str\n    status: ExternalExecutorJobStatus\n    completedCount: int\n    totalCount: int\n    nextRunAt: str\n    assignedAccountIds: list[str]\n    errorCode: str\n    errorMessage: str\n    result: dict[str, object]\n    accountHealth: dict[str, object]\n    eventSequence: int\n    events: list[ExternalExecutorActionEvent]\n\n\n__all__ = [\n    'CONTRACT_VERSIONS',\n    'PLATFORMS',\n    'JOB_STATUSES',\n    'EVENT_TYPES',\n    'INSTAGRAM_ACTION_TYPES',\n    'WORKFLOW_TYPES',\n    'INSTAGRAM_IMPLEMENTED_CAPABILITIES',\n    'ExternalExecutorPlatform',\n    'ExternalExecutorJobStatus',\n    'ExternalExecutorEventType',\n    'InstagramExecutorActionType',\n    'ExternalExecutorAccountSelector',\n    'ExternalExecutorPolicyEnvelope',\n    'JobStartRequest',\n    'JobStartResponse',\n    'JobProgressResponse',\n    'ExternalExecutorUsageEvent',\n    'ExternalExecutorActionEvent',\n    'ExternalModuleManifest',\n    'ExternalExecutorCallbackEnvelope',\n]\n`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const normalizedOutput = output
  .replace(
    "    'CONTRACT_VERSIONS',\n",
    "    'CONTRACT_VERSIONS',\n    'MODULE_FEATURES',\n",
  )
  .replace(
    "\n\nclass ExternalExecutorAccountSelector",
    `

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


class ExternalExecutorAccountSelector`,
  )
  .replace(
    "    capabilities: list[InstagramExecutorActionType]\n",
    "    capabilities: list[InstagramExecutorActionType]\n    inputSchemas: dict[str, ExternalExecutorInputSchema]\n",
  )
  .replace(
    "    'ExternalExecutorAccountSelector',\n",
    "    'ExternalExecutorInputFieldSchema',\n    'ExternalExecutorInputSchema',\n    'ExternalExecutorAccountSelector',\n",
  );
fs.writeFileSync(outputPath, normalizedOutput);
