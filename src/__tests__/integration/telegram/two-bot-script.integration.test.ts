/**
 * Integration tests: Telegram Bot API
 *
 * Health-only test: needs SS_TOOLKIT_TELEGRAM_ACTOR_BOT_TOKEN (one token).
 * Two-bot dialog test: also needs SS_TOOLKIT_TELEGRAM_TARGET_BOT_TOKEN.
 *
 * The target bot must already be running as an echo bot before executing
 * the two-bot describe block. Start it with:
 *   SS_TOOLKIT_TELEGRAM_TARGET_BOT_TOKEN=<token> npx tsx automation/scripts/telegram-bot-echo.ts
 *
 * Run:
 *   SS_TOOLKIT_TELEGRAM_ACTOR_BOT_TOKEN=<token> \
 *   SS_TOOLKIT_TELEGRAM_TARGET_BOT_TOKEN=<token> \
 *   npx jest --testPathPattern=telegram --testTimeout=120000
 */

import { TelegramBotApiClient } from '../../../telegram/bot-api/TelegramBotApiClient';
import { checkBotApiHealth } from '../../../telegram/health/checkBot';
import { runBotDialogScript } from '../../../telegram/script/BotDialogScriptRunner';

const ACTOR_TOKEN = process.env.SS_TOOLKIT_TELEGRAM_ACTOR_BOT_TOKEN;
const TARGET_TOKEN = process.env.SS_TOOLKIT_TELEGRAM_TARGET_BOT_TOKEN;

const hasActorToken = !!ACTOR_TOKEN;
const hasBothTokens = !!ACTOR_TOKEN && !!TARGET_TOKEN;

// Allow overriding timeouts from env for slow CI.
const STEP_TIMEOUT_MS = parseInt(process.env.TELEGRAM_STEP_TIMEOUT_MS ?? '20000', 10);

const describeHealthOnly = hasActorToken ? describe : describe.skip;
const describeTwoBot = hasBothTokens ? describe : describe.skip;

describeHealthOnly('Telegram: bot health check (single token)', () => {
  const client = new TelegramBotApiClient({ token: ACTOR_TOKEN! });

  it('getMe returns a valid bot identity', async () => {
    const me = await client.getMe();
    expect(me.ok).toBe(true);
    expect(me.result?.is_bot).toBe(true);
    expect(typeof me.result?.id).toBe('number');
  }, 15_000);

  it('checkBotApiHealth returns ok with bot info', async () => {
    const health = await checkBotApiHealth(client);
    expect(health.ok).toBe(true);
    expect(health.bot?.is_bot).toBe(true);
    expect(typeof health.pendingUpdates).toBe('number');
  }, 15_000);
});

describeTwoBot('Telegram: two-bot scripted dialog', () => {
  let actorClient: TelegramBotApiClient;
  let targetBotId: number;

  beforeAll(async () => {
    actorClient = new TelegramBotApiClient({ token: ACTOR_TOKEN! });
    const targetClient = new TelegramBotApiClient({ token: TARGET_TOKEN! });

    // Clear webhook on actor so long polling works.
    await actorClient.deleteWebhook();

    const targetMe = await targetClient.getMe();
    if (!targetMe.ok || !targetMe.result) {
      throw new Error(`Failed to resolve target bot identity: ${targetMe.description}`);
    }
    targetBotId = targetMe.result.id;
  }, 30_000);

  it('/start triggers a greeting reply from the echo bot', async () => {
    const result = await runBotDialogScript({
      actorClient,
      targetBotId,
      steps: [{ sendText: '/start', expectSubstring: 'start', timeoutMs: STEP_TIMEOUT_MS }],
      onStepStart: (i, step) =>
        console.log(`  [step ${i}] sending: ${step.sendText}`),
      onStepReply: (i, _step, reply) =>
        console.log(`  [step ${i}] reply: ${reply.text}`),
    });

    expect(result.success).toBe(true);
    expect(result.steps).toHaveLength(1);
  }, STEP_TIMEOUT_MS + 5_000);

  it('echo bot returns sent text back', async () => {
    const probe = `ping-${Date.now()}`;
    const result = await runBotDialogScript({
      actorClient,
      targetBotId,
      steps: [{ sendText: probe, expectSubstring: probe, timeoutMs: STEP_TIMEOUT_MS }],
    });

    expect(result.success).toBe(true);
    expect(result.steps[0].reply.text).toContain(probe);
  }, STEP_TIMEOUT_MS + 5_000);

  it('multi-step dialog completes all steps', async () => {
    const a = `alpha-${Date.now()}`;
    const b = `beta-${Date.now()}`;

    const result = await runBotDialogScript({
      actorClient,
      targetBotId,
      steps: [
        { sendText: a, expectSubstring: a, timeoutMs: STEP_TIMEOUT_MS },
        { sendText: b, expectSubstring: b, timeoutMs: STEP_TIMEOUT_MS },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].reply.text).toContain(a);
    expect(result.steps[1].reply.text).toContain(b);
  }, (STEP_TIMEOUT_MS + 5_000) * 2);
});
