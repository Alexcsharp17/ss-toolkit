export { TelegramBotApiClient } from './bot-api';
export type { TelegramBotApiClientOptions } from './bot-api';
export type {
  TelegramUser,
  TelegramChat,
  TelegramMessage,
  TelegramUpdate,
  TelegramApiResponse,
  BotInfo,
  SendMessageResult,
} from './bot-api';

export { runEchoBotLoop, startEchoBot } from './echo/runEchoBotLoop';
export type { RunEchoBotLoopOptions, EchoHandlerOptions } from './echo/runEchoBotLoop';

export { checkBotApiHealth } from './health/checkBot';
export type { BotHealthResult } from './health/checkBot';

export { BotDialogScriptRunner, runBotDialogScript } from './script';
export type {
  ScriptStep,
  BotDialogScriptRunnerOptions,
  ScriptStepResult,
  BotDialogScriptResult,
} from './script';
