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
  ['platforms', 'PLATFORMS'],
  ['jobStatuses', 'JOB_STATUSES'],
  ['eventTypes', 'EVENT_TYPES'],
  ['instagramActionTypes', 'INSTAGRAM_ACTION_TYPES'],
  ['workflowTypes', 'WORKFLOW_TYPES'],
  ['instagramImplementedCapabilities', 'INSTAGRAM_IMPLEMENTED_CAPABILITIES'],
];

const valuesFor = (field) => schema.properties[field].items.enum;
const pythonList = (values) => values.map((value) => `    ${JSON.stringify(value)},`).join('\n');

const output = `# Generated from contracts/external-executor.schema.json. Do not edit manually.\nfrom typing import Literal, TypedDict\n\n${fields.map(([schemaField, pythonName]) => `\n${pythonName} = (\n${pythonList(valuesFor(schemaField))}\n)\n`).join('')}\nExternalExecutorPlatform = Literal[${valuesFor('platforms').map(JSON.stringify).join(', ')}]\nExternalExecutorJobStatus = Literal[${valuesFor('jobStatuses').map(JSON.stringify).join(', ')}]\nExternalExecutorEventType = Literal[${valuesFor('eventTypes').map(JSON.stringify).join(', ')}]\nInstagramExecutorActionType = Literal[${valuesFor('instagramActionTypes').map(JSON.stringify).join(', ')}]\n\n\nclass AccountSelector(TypedDict, total=False):\n    mode: Literal['system', 'specific']\n    accountIds: list[str]\n    constraints: dict[str, object]\n\n\nclass JobStartRequest(TypedDict, total=False):\n    idempotencyKey: str\n    orderId: int\n    platform: ExternalExecutorPlatform\n    actionType: InstagramExecutorActionType\n    quantity: int\n    accountSelector: AccountSelector\n    payload: dict[str, object]\n    policyEnvelope: dict[str, object]\n    callbackUrl: str\n\n\nclass JobProgressResponse(TypedDict, total=False):\n    jobId: str\n    status: ExternalExecutorJobStatus\n    completedCount: int\n    totalCount: int\n    nextRunAt: str\n    assignedAccountIds: list[str]\n    errorCode: str\n    errorMessage: str\n    result: dict[str, object]\n    accountHealth: dict[str, object]\n\n\n__all__ = [\n    'CONTRACT_VERSIONS',\n    'PLATFORMS',\n    'JOB_STATUSES',\n    'EVENT_TYPES',\n    'INSTAGRAM_ACTION_TYPES',\n    'WORKFLOW_TYPES',\n    'INSTAGRAM_IMPLEMENTED_CAPABILITIES',\n    'ExternalExecutorPlatform',\n    'ExternalExecutorJobStatus',\n    'ExternalExecutorEventType',\n    'InstagramExecutorActionType',\n    'AccountSelector',\n    'JobStartRequest',\n    'JobProgressResponse',\n]\n`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output);
