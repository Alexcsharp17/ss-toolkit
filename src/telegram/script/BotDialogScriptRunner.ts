import { TelegramBotApiClient } from '../bot-api/TelegramBotApiClient';
import type { TelegramMessage } from '../bot-api/types';

export interface ScriptStep {
  /** Text sent from the actor to the target bot. */
  sendText: string;
  /** If set, the reply must contain this substring (case-insensitive). */
  expectSubstring?: string;
  /** Timeout in ms to wait for the target bot's reply. Default: 30000. */
  timeoutMs?: number;
}

export interface BotDialogScriptRunnerOptions {
  /** Bot API client for the actor bot (the one that sends messages and reads replies). */
  actorClient: TelegramBotApiClient;
  /**
   * Telegram user/bot ID of the target bot.
   * Use TelegramBotApiClient.getMe() on the target token to get this ID.
   */
  targetBotId: number;
  /** Steps to execute. */
  steps: ScriptStep[];
  /** Default step timeout in ms. Default: 30000. */
  defaultTimeoutMs?: number;
  /** Polling interval in ms. Default: 1000. */
  pollIntervalMs?: number;
  /** Called before each step is sent. */
  onStepStart?: (index: number, step: ScriptStep) => void;
  /** Called when a step reply is received. */
  onStepReply?: (index: number, step: ScriptStep, reply: TelegramMessage) => void;
}

export interface ScriptStepResult {
  stepIndex: number;
  sent: string;
  reply: TelegramMessage;
  durationMs: number;
}

export interface BotDialogScriptResult {
  success: boolean;
  steps: ScriptStepResult[];
  /** Populated when success=false */
  error?: string;
  /** Index of the failed step, if any */
  failedStep?: number;
}

/**
 * Runs a scripted dialog between two Telegram bots:
 *
 * 1. Actor sends a message to the target bot.
 * 2. Actor polls getUpdates until it receives a reply from the target bot.
 * 3. Optionally checks that the reply contains `expectSubstring`.
 * 4. Repeats for each step.
 *
 * Does NOT call process.exit. Returns a structured result suitable for Jest assertions.
 *
 * Prerequisite: the target bot must be running and responding.
 * To use long polling on the actor's token, ensure no webhook is registered
 * (call actorClient.deleteWebhook() before running if needed).
 */
export async function runBotDialogScript(
  options: BotDialogScriptRunnerOptions,
): Promise<BotDialogScriptResult> {
  const {
    actorClient,
    targetBotId,
    steps,
    defaultTimeoutMs = 30_000,
    pollIntervalMs = 1000,
    onStepStart,
    onStepReply,
  } = options;

  const results: ScriptStepResult[] = [];

  // Drain any stale updates so actor only sees fresh replies.
  let offset = await drainUpdates(actorClient);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const timeoutMs = step.timeoutMs ?? defaultTimeoutMs;

    onStepStart?.(i, step);

    const sendRes = await actorClient.sendMessage(targetBotId, step.sendText);
    if (!sendRes.ok) {
      return {
        success: false,
        steps: results,
        error: `Step ${i}: sendMessage failed — ${sendRes.description ?? 'unknown'}`,
        failedStep: i,
      };
    }

    const stepStart = Date.now();
    const reply = await waitForReply({
      actorClient,
      fromBotId: targetBotId,
      offset,
      timeoutMs,
      pollIntervalMs,
      expectSubstring: step.expectSubstring,
    });

    if (!reply.message) {
      return {
        success: false,
        steps: results,
        error: `Step ${i}: timed out waiting for reply from bot ${targetBotId}${
          step.expectSubstring ? ` containing "${step.expectSubstring}"` : ''
        } within ${timeoutMs}ms`,
        failedStep: i,
      };
    }

    offset = reply.nextOffset;
    const result: ScriptStepResult = {
      stepIndex: i,
      sent: step.sendText,
      reply: reply.message,
      durationMs: Date.now() - stepStart,
    };
    results.push(result);
    onStepReply?.(i, step, reply.message);
  }

  return { success: true, steps: results };
}

/** Convenience class wrapper around runBotDialogScript for repeated use. */
export class BotDialogScriptRunner {
  constructor(private readonly defaultOptions: BotDialogScriptRunnerOptions) {}

  run(steps?: ScriptStep[]): Promise<BotDialogScriptResult> {
    return runBotDialogScript({
      ...this.defaultOptions,
      steps: steps ?? this.defaultOptions.steps,
    });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Drains all pending updates and returns the next offset. */
async function drainUpdates(client: TelegramBotApiClient): Promise<number> {
  let offset = 0;
  const res = await client.getUpdates(undefined, 0, 100).catch(() => ({ ok: false, result: undefined }));
  if (res.ok && res.result && res.result.length > 0) {
    const last = res.result[res.result.length - 1];
    offset = last.update_id + 1;
    // Acknowledge drained updates
    await client.getUpdates(offset, 0, 1).catch(() => null);
  }
  return offset;
}

interface WaitResult {
  message: TelegramMessage | null;
  nextOffset: number;
}

async function waitForReply(params: {
  actorClient: TelegramBotApiClient;
  fromBotId: number;
  offset: number;
  timeoutMs: number;
  pollIntervalMs: number;
  expectSubstring?: string;
}): Promise<WaitResult> {
  const { actorClient, fromBotId, timeoutMs, pollIntervalMs, expectSubstring } = params;
  let offset = params.offset;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const remaining = deadline - Date.now();
    // Use short long-poll timeout to respect our deadline
    const pollTimeout = Math.min(Math.floor(remaining / 1000), 5);
    if (pollTimeout <= 0) break;

    const res = await actorClient.getUpdates(offset, pollTimeout, 100).catch(() => ({
      ok: false as const,
      result: undefined,
    }));

    if (res.ok && res.result) {
      for (const u of res.result) {
        offset = u.update_id + 1;
        const msg = u.message;
        if (!msg) continue;
        if (msg.from?.id !== fromBotId) continue;

        if (expectSubstring) {
          const text = (msg.text ?? '').toLowerCase();
          if (!text.includes(expectSubstring.toLowerCase())) continue;
        }

        return { message: msg, nextOffset: offset };
      }
    }

    if (Date.now() + pollIntervalMs < deadline) {
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
  }

  return { message: null, nextOffset: offset };
}
