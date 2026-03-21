import { TelegramBotApiClient } from '../bot-api/TelegramBotApiClient';
import type { BotInfo } from '../bot-api/types';

export interface BotHealthResult {
  ok: boolean;
  bot?: BotInfo;
  pendingUpdates: number;
  error?: string;
}

/**
 * Checks Telegram Bot API health: resolves bot identity via getMe and
 * counts pending updates via getUpdates (limit=5, timeout=0).
 *
 * Does NOT call process.exit — returns a structured result.
 */
export async function checkBotApiHealth(client: TelegramBotApiClient): Promise<BotHealthResult> {
  const me = await client.getMe().catch((err) => ({
    ok: false as const,
    description: err instanceof Error ? err.message : String(err),
    result: undefined,
  }));

  if (!me.ok) {
    return { ok: false, pendingUpdates: 0, error: me.description ?? 'getMe failed' };
  }

  const updates = await client.getUpdates(undefined, 0, 5).catch((err) => ({
    ok: false as const,
    description: err instanceof Error ? err.message : String(err),
    result: undefined,
  }));

  if (!updates.ok) {
    return {
      ok: false,
      bot: me.result,
      pendingUpdates: 0,
      error: updates.description ?? 'getUpdates failed',
    };
  }

  return {
    ok: true,
    bot: me.result,
    pendingUpdates: updates.result?.length ?? 0,
  };
}
