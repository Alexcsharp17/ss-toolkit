/**
 * ss-toolkit — library for integrating external services with unified architecture
 */

// Models
export { CaptchaTask, CaptchaTaskType, CaptchaResult } from './models/captcha';
export { MailInbox, MailMessage } from './models/mail';
export { PaymentResult, PaymentStatus } from './models/payment';
export { Fingerprint, FingerprintOptions } from './models/fingerprint';

// Services
export { CaptchaService } from './categories/captcha/CaptchaService';
export type { CaptchaServiceOptions } from './categories/captcha/CaptchaService';
export { MailService } from './categories/mail/MailService';
export type { MailServiceOptions } from './categories/mail/MailService';
export { PaymentService } from './categories/payment/PaymentService';
export type { PaymentServiceOptions } from './categories/payment/PaymentService';
export { FingerprintService } from './categories/fingerprint/FingerprintService';
export type { FingerprintServiceOptions } from './categories/fingerprint/FingerprintService';

// Factories
export { CaptchaFactory } from './categories/captcha/CaptchaFactory';
export { MailFactory } from './categories/mail/MailFactory';
export { PaymentFactory } from './categories/payment/PaymentFactory';
export { FingerprintFactory } from './categories/fingerprint/FingerprintFactory';

// Interfaces
export type {
  ICaptchaSolver,
  CaptchaProviderConfig,
} from './categories/captcha/interfaces/ICaptchaSolver';
export type {
  IMailProvider,
  MailProviderConfig,
} from './categories/mail/interfaces/IMailProvider';
export type {
  IPaymentProvider,
  PaymentProviderConfig,
} from './categories/payment/interfaces/IPaymentProvider';
export type {
  IFingerprintGenerator,
  FingerprintProviderConfig,
} from './categories/fingerprint/interfaces/IFingerprintGenerator';

// Scenarios
export { GroqApiKeyScenario } from './scenarios/api-key-retrieval/groq';
export type { GroqScenarioResult } from './scenarios/api-key-retrieval/groq';
export type { GroqScenarioConfig } from './scenarios/api-key-retrieval/groq/config';

// Telegram Bot API
export { TelegramBotApiClient } from './telegram/bot-api';
export type { TelegramBotApiClientOptions } from './telegram/bot-api';
export type {
  TelegramUser,
  TelegramChat,
  TelegramMessage,
  TelegramUpdate,
  TelegramApiResponse,
  BotInfo,
  SendMessageResult,
} from './telegram/bot-api';
export { runEchoBotLoop, startEchoBot } from './telegram/echo/runEchoBotLoop';
export type { RunEchoBotLoopOptions, EchoHandlerOptions } from './telegram/echo/runEchoBotLoop';
export { checkBotApiHealth } from './telegram/health/checkBot';
export type { BotHealthResult } from './telegram/health/checkBot';
export { BotDialogScriptRunner, runBotDialogScript } from './telegram/script';
export type {
  ScriptStep,
  BotDialogScriptRunnerOptions,
  ScriptStepResult,
  BotDialogScriptResult,
} from './telegram/script';

// Core
export { RoundRobinSelector } from './core/loadbalancer/RoundRobinSelector';
export type { IProviderSelector } from './core/loadbalancer/IProviderSelector';
export { SimpleRetryPolicy } from './core/retry/RetryPolicy';
export type { RetryPolicy, RetryPolicyOptions } from './core/retry/RetryPolicy';
export { SimpleCache } from './core/cache/SimpleCache';
export type { SimpleCacheOptions } from './core/cache/SimpleCache';
