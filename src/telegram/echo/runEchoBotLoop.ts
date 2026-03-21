import { TelegramBotApiClient } from '../bot-api/TelegramBotApiClient';
import type { TelegramBotApiClientOptions } from '../bot-api/TelegramBotApiClient';

export interface EchoHandlerOptions {
  /** Called when a /start command arrives. Default: "Hi {name}! I'm running." */
  buildStartReply?: (firstName: string) => string;
  /** Called for any other text. Default: "You wrote: {text}" */
  buildEchoReply?: (text: string) => string;
  /** Called when a non-text message arrives. Default: generic message. */
  buildFallbackReply?: () => string;
  /** Error handler for failed sendMessage. Default: console.error */
  onSendError?: (err: unknown) => void;
  /** Called on every handled update (before reply). Useful for logging. */
  onUpdate?: (chatId: number, text: string, reply: string) => void;
}

export interface RunEchoBotLoopOptions extends EchoHandlerOptions {
  client: TelegramBotApiClient;
  /** Delay in ms to wait before retrying after a failed getUpdates. Default: 2000. */
  retryDelayMs?: number;
  /** Signal to stop the loop gracefully. */
  signal?: AbortSignal;
}

/**
 * Starts a Telegram echo-bot long-polling loop.
 * Replies to /start with a greeting and to all other text with an echo.
 * The loop runs until the AbortSignal is aborted.
 *
 * Does NOT call process.exit — suitable for use inside Jest tests.
 */
export async function runEchoBotLoop(options: RunEchoBotLoopOptions): Promise<void> {
  const {
    client,
    retryDelayMs = 2000,
    signal,
    buildStartReply = (name) => `Hi ${name}! You sent /start — I'm running and replying.`,
    buildEchoReply = (text) => `You wrote: ${text}`,
    buildFallbackReply = () => "I got a message without text (e.g. photo/sticker). I only echo text.",
    onSendError = (err) => console.error('[runEchoBotLoop] sendMessage error:', err),
    onUpdate,
  } = options;

  let offset: number | undefined;

  while (!(signal?.aborted)) {
    const data = await client.getUpdates(offset, 30).catch(() => ({ ok: false, result: undefined }));

    if (!data.ok || !data.result) {
      await new Promise((r) => setTimeout(r, retryDelayMs));
      continue;
    }

    for (const u of data.result) {
      if (signal?.aborted) break;
      offset = u.update_id + 1;

      const msg = u.message;
      if (!msg?.chat) continue;

      const chatId = msg.chat.id;
      const text = (msg.text || '').trim();
      const name = msg.from?.first_name || 'there';

      let reply: string;
      if (text.toLowerCase() === '/start') {
        reply = buildStartReply(name);
      } else if (text) {
        reply = buildEchoReply(text);
      } else {
        reply = buildFallbackReply();
      }

      onUpdate?.(chatId, text, reply);

      const res = await client.sendMessage(chatId, reply).catch((err) => {
        onSendError(err);
        return null;
      });
      if (res && !res.ok) {
        onSendError(res);
      }
    }
  }
}

/**
 * Convenience factory: creates a TelegramBotApiClient and starts the echo loop.
 * Useful for CLI scripts.
 */
export async function startEchoBot(
  token: string,
  handlerOptions?: EchoHandlerOptions & { baseUrl?: string },
): Promise<void> {
  const clientOptions: TelegramBotApiClientOptions = {
    token,
    baseUrl: handlerOptions?.baseUrl,
  };
  const client = new TelegramBotApiClient(clientOptions);
  await runEchoBotLoop({ client, ...handlerOptions });
}
