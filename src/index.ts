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

// AI Chatting
export { GroqChatClient, SuggestReplyClient, runHappyPath, runDeviationScenarios, hasEscalation, isReplyOnly, printTranscript } from './ai-chatting';
export type { HistoryMessage, SuggestReplyResult, SuggestReplyEscalation, SuggestOverrides, AiChattingConfig, DeviationScenario, HappyPathResult, DeviationRunResult, GroqChatClientOptions, SuggestReplyClientOptions, HappyPathOptions, DeviationRunOptions } from './ai-chatting';

// Core
export { RoundRobinSelector } from './core/loadbalancer/RoundRobinSelector';
export type { IProviderSelector } from './core/loadbalancer/IProviderSelector';
export { SimpleRetryPolicy } from './core/retry/RetryPolicy';
export type { RetryPolicy, RetryPolicyOptions } from './core/retry/RetryPolicy';
export { SimpleCache } from './core/cache/SimpleCache';
export type { SimpleCacheOptions } from './core/cache/SimpleCache';

// Panel shared types + platform adapters (merged from former ss-adapters)
export type {
  PanelJobConfig,
  PanelJobKind,
  WarmupPanelJobConfig,
  WarmupJoinGroupsMode,
  WarmupReadChannelsMode,
  MembersScrapingPanelJobConfig,
  PanelJobConfigBase,
} from './shared-types';
export {
  PANEL_JOB_KIND_TG_WARMUP,
  PANEL_JOB_KIND_TG_PARSER,
  PANEL_JOB_KIND_TG_CHATTING,
} from './shared-types';
export type {
  IPlatformAdapter,
  PlatformCode,
  ProfileExecutionContext,
  ProfilePatch,
  ProfileResult,
} from './platform';
export { AdapterRegistry } from './platform';
