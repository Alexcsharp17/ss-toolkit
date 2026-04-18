/** Discriminator for panel job JSON stored on orders (panelJobConfig). */
export type PanelJobKind =
  | 'tg_warmup'
  | 'tg_parser'
  | 'tg_chatting'
  | 'tg_neurochatting'
  | 'tg_channel_parser'
  | 'tg_user_parser'
  | 'tg_message_parser';

export const PANEL_JOB_KIND_TG_WARMUP = 'tg_warmup' as const;
export const PANEL_JOB_KIND_TG_PARSER = 'tg_parser' as const;
export const PANEL_JOB_KIND_TG_CHATTING = 'tg_chatting' as const;
export const PANEL_JOB_KIND_TG_NEUROCHATTING = 'tg_neurochatting' as const;
export const PANEL_JOB_KIND_TG_CHANNEL_PARSER = 'tg_channel_parser' as const;
export const PANEL_JOB_KIND_TG_USER_PARSER = 'tg_user_parser' as const;
export const PANEL_JOB_KIND_TG_MESSAGE_PARSER = 'tg_message_parser' as const;
