import type { PanelJobKind } from './panelJobKinds';
import { PANEL_JOB_KIND_TG_PARSER, PANEL_JOB_KIND_TG_WARMUP } from './panelJobKinds';

/** How join-group discovery uses targets (`from_target` / `sequential` = order in target list). */
export type WarmupJoinGroupsMode = 'random' | 'from_target' | 'sequential';

/**
 * Channel reading: `random` = random pick from targetLinks; `target_list` = first link (sequential use via executor).
 * Source is always targetLinks (same as spam channel list).
 */
export type WarmupReadChannelsMode = 'random' | 'target_list';

/** What advances progressive limit scale toward target. */
export type WarmupProgressiveDriver = 'calendar_days' | 'success_count' | 'hybrid';

/** Calendar anchor for `calendar_days` / `hybrid` day leg. */
export type WarmupProgressiveCalendarAnchor = 'warmup_started' | 'order_created';

/** How to combine day-based and success-based progress when driver is `hybrid`. */
export type WarmupProgressiveHybridPolicy = 'min';

/** Warmup payload aligned with panel UI / API (v1). */
export interface WarmupPanelJobConfig {
  v: number;
  kind: typeof PANEL_JOB_KIND_TG_WARMUP;
  accountIds: string[];
  targetLinks: string[];
  activityFrom: string;
  activityTo: string;
  /** Display label (e.g. preset name or UTC±H); not used for calculations. */
  timezone: string;
  /** Offset from UTC in minutes (authoritative for activity window). */
  timezoneOffsetMinutes?: number;
  /** Optional human label (any string); not used for calculations. */
  timezoneLabel?: string;
  randomBreaks: boolean;
  /** Preset from limit-configs (telegram), e.g. safe | standard | fast — used when hydrating snapshot at order create. */
  limitConfigName: string;
  /**
   * Frozen daily/hourly max per ActionType (stringified enum value: "8" JoinChannel, "18" SendReaction, "21" ReadChannelHistory).
   * Filled at order creation from preset or custom security fields; executor uses this instead of re-reading limit-configs.
   */
  warmupActionLimits?: Record<string, { daily: number; hourly: number }>;
  /** When true, executor may adjust intensity from account age / telemetry (UI: «Автоадаптация»). */
  autoAdaptation?: boolean;
  patternReactions?: boolean;
  patternReadChannels?: boolean;
  readChannelsMode?: WarmupReadChannelsMode;
  patternDialogs: boolean;
  patternStories: boolean;
  patternJoinGroups: boolean;
  joinGroupsMode?: WarmupJoinGroupsMode | string;
  patternTrust: boolean;
  durationMinutes?: number;
  /** Master switch for custom numeric caps below (UI: «Лимиты безопасности»). */
  securityLimitsEnabled?: boolean;
  actionsPerHour?: number;
  actionsPerDay?: number;
  joinsPerDay?: number;
  messagesPerDay?: number;
  /** Gradual ramp of effective limits toward full snapshot (UI). */
  progressiveLimits?: boolean;
  progressiveLimitsDriver?: WarmupProgressiveDriver;
  /** Start of ramp as % of base limits (e.g. 30). */
  progressiveLimitsStartPercent?: number;
  /** End of ramp (%), usually 100. */
  progressiveLimitsTargetPercent?: number;
  /** Full ramp after this many calendar days (order TZ). Required for calendar_days / hybrid. */
  progressiveLimitsRampDays?: number;
  /** Full ramp after this many successful warmup actions. Required for success_count / hybrid. */
  progressiveLimitsRampSuccesses?: number;
  progressiveLimitsHybridPolicy?: WarmupProgressiveHybridPolicy;
  progressiveCalendarAnchor?: WarmupProgressiveCalendarAnchor;
}

/** Panel «chat / members scraping» job (service type Panel_TgMembersScraping). */
export interface MembersScrapingPanelJobConfig {
  v: number;
  kind: typeof PANEL_JOB_KIND_TG_PARSER;
  accountIds: string[];
  keywords: string[];
  aiProtection?: boolean;
  endingsMode?: 'manual' | 'auto';
  endingsCount?: number;
  /** Min participants (string from UI inputs). */
  participantsMin?: string;
  /** Max participants (string from UI inputs). */
  participantsMax?: string;
  mailingRating?: number;
  languageDetection?: boolean;
  quickWork?: boolean;
  resultLimit?: number;
  activityFilter?: 'any' | 'active' | 'inactive';
  delayBetweenRequests?: number;
  delayBetweenChannels?: number;
}

/** @deprecated Use MembersScrapingPanelJobConfig */
export type ParserPanelJobConfigPlaceholder = MembersScrapingPanelJobConfig;

/** Placeholder for future chatting panel jobs. */
export interface ChattingPanelJobConfigPlaceholder {
  v: number;
  kind: 'tg_chatting';
}

/** AI protection mode used across panel modules. */
export type AiProtectionMode = 'off' | 'conservative' | 'balanced' | 'aggressive';

/** Neurochatting panel job: monitor groups/chats and reply based on triggers or interval. */
export interface NeurochattingPanelJobConfig {
  v: number;
  kind: 'tg_neurochatting';
  accountIds: string[];
  chatLinks: string[];
  /** 'interval' = reply to every N-th message; 'trigger' = reply only when keywords match. */
  mode: 'interval' | 'trigger';
  /** Percentage of messages to respond to in interval mode (1-100). */
  intervalPercent?: number;
  triggerKeywords?: string[];
  semanticMatching?: boolean;
  workMode: 'by_count' | 'by_time';
  maxMessages?: number;
  durationMinutes?: number;
  promptId?: string;
  promptText?: string;
  languageMode?: 'auto' | string;
  autoResponder?: boolean;
  /** Number of previous chat messages to include as context. */
  conversationContext?: number;
  /** Percentage chance to mention a product organically (0-100). */
  productPromotion?: number;
  productPromotionText?: string;
  rotationAfter?: number;
  aiProtectionMode?: AiProtectionMode;
  delayMinSec?: number;
  delayMaxSec?: number;
}

/** Channel parser panel job: find Telegram channels by keywords. */
export interface ChannelParserPanelJobConfig {
  v: number;
  kind: 'tg_channel_parser';
  accountIds: string[];
  keywords: string[];
  endingsMode?: 'manual' | 'auto';
  endingsCount?: number;
  activityFilter?: 'any' | 'active' | 'inactive';
  /** Filter by comment availability. */
  commentFilter?: 'any' | 'open' | 'closed';
  participantsMin?: string;
  participantsMax?: string;
  mailingRating?: number;
  languageDetection?: boolean;
  quickMode?: boolean;
  resultLimit?: number;
  aiProtection?: boolean;
  delayBetweenRequests?: number;
}

/** User parser panel job: collect users from open-member-list chats. */
export interface UserParserPanelJobConfig {
  v: number;
  kind: 'tg_user_parser';
  accountIds: string[];
  sourceChats: string[];
  skipBots?: boolean;
  skipDeleted?: boolean;
  skipScam?: boolean;
  onlyActive?: boolean;
  onlyWithUsername?: boolean;
  onlyWithPhoto?: boolean;
  onlyPremium?: boolean;
  aiProtection?: boolean;
  resultLimit?: number;
}

/** Message parser panel job: collect users from chats with hidden member lists via message activity. */
export interface MessageParserPanelJobConfig {
  v: number;
  kind: 'tg_message_parser';
  accountIds: string[];
  sourceChats: string[];
  messageLimit?: number;
  periodDays?: number;
  keywords?: string[];
  includeForwarded?: boolean;
  quickMode?: boolean;
  skipBots?: boolean;
  skipDeleted?: boolean;
  skipScam?: boolean;
  onlyWithUsername?: boolean;
  onlyWithPhoto?: boolean;
  onlyPremium?: boolean;
  onlyActive?: boolean;
  aiProtection?: boolean;
  resultLimit?: number;
}

export interface PanelJobConfigBase {
  v: number;
  kind: PanelJobKind;
}

export type PanelJobConfig =
  | WarmupPanelJobConfig
  | MembersScrapingPanelJobConfig
  | ChattingPanelJobConfigPlaceholder
  | NeurochattingPanelJobConfig
  | ChannelParserPanelJobConfig
  | UserParserPanelJobConfig
  | MessageParserPanelJobConfig;
