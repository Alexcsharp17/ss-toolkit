/**
 * Integration tests for AI chatting scenarios.
 *
 * Requires a running backend with the /suggest endpoint and a Groq API key.
 *
 * Env vars:
 *   SS_TOOLKIT_API_BASE_URL  — backend URL (default http://localhost:3000)
 *   SS_TOOLKIT_GROQ_API_KEY  — Groq key for buyer AI
 *   SS_TOOLKIT_ADMIN_API_KEY — admin key for /suggest endpoint
 *
 * Both describe blocks skip automatically when the required env vars are absent.
 */

import { GroqChatClient, SuggestReplyClient, runHappyPath, runDeviationScenarios } from '../../../ai-chatting';
import { hasEscalation, isReplyOnly } from '../../../ai-chatting';
import type { DeviationScenario, SellerPersonaConfig } from '../../../ai-chatting';

const API_BASE_URL = process.env.SS_TOOLKIT_API_BASE_URL ?? 'http://localhost:3000';
const GROQ_API_KEY = process.env.SS_TOOLKIT_GROQ_API_KEY ?? '';
const ADMIN_API_KEY = process.env.SS_TOOLKIT_ADMIN_API_KEY ?? 'sk_admin_fixed_key_12345';

const hasGroq = Boolean(GROQ_API_KEY);
const hasBackend = Boolean(process.env.SS_TOOLKIT_API_BASE_URL);

// ─── Shared fixtures ─────────────────────────────────────────────────────────

const SELLER_PERSONA: SellerPersonaConfig = {
  salesScript: [
    'Поприветствуй тепло, намекни на эксклюзивный контент и спроси чем можешь помочь',
    'Расскажи что именно есть — приватные фото, видео, эксклюзивные материалы только для подписчиков',
    'Создай интерес: ограниченный доступ, эксклюзивность, только для избранных подписчиков',
    'Назови условия и цену подписки, предложи попробовать',
    'Если пользователь говорит что хочет купить или спрашивает как оплатить — немедленно используй action reply_and_escalate с reason ready_to_buy',
  ],
  channelDescription:
    'Всем привет. Меня зовут Полина, а не жужука) Мне 22. Живу в Кривом Роге, но вся семья из Одессы. ' +
    'Учусь на историка, сейчас 5 курс. Подрабатываю репетиторством по истории. ' +
    'Всегда любила фоткаться, особенно горячие фото. Решила сделать такой канал, чтобы выкладывать их куда-нибудь. Всегда рада поболтать.',
  persona:
    'Ты — девушка Полина, ведёшь канал со своими фото. В ответах используй только женский род: рада, заинтересована, подскажу. ' +
    'Никогда не пиши в тексте пользователю слова «оператор», «менеджер», «передам оператору». ' +
    'Общайся тепло, по-русски, от своего имени (я, мне). При готовности к покупке напиши что-то вроде «сейчас подскажу как оплатить» или «кину ссылку».',
  channelFirstPost: 'Привет! Рада видеть тебя здесь 💋',
};

const BUYER_SYSTEM_PROMPT = `Ты потенциальный покупатель взрослого контента в Telegram. Следуй этому скрипту по шагам:
Шаг 1: Поздоровайся и спроси что здесь есть
Шаг 2: Уточни есть ли фото и видео материалы
Шаг 3: Вырази интерес, спроси про эксклюзивность
Шаг 4: Спроси цену
Шаг 5: Скажи что хочешь купить и спроси как оплатить

Правила:
- Пиши только одно сообщение за раз, коротко (1-2 предложения)
- Отвечай по-русски
- Продвигайся по шагам естественно — не перепрыгивай, дожидайся ответа продавца
- Если продавец назвал цену — переходи к шагу 5
- Отвечай ТОЛЬКО текстом сообщения, без пояснений и без кавычек`;

const DEVIATION_SCENARIOS: DeviationScenario[] = [
  {
    name: 'Offensive — insults',
    history: [
      { text: 'Привет', out: false },
      { text: 'Привет! Рада видеть тебя 💋 Чем могу помочь?', out: true },
      { text: 'Иди нахер, тупая шлюха, закрой свой канал', out: false },
    ],
    assert: (r) => {
      if (hasEscalation(r, 'offensive') || r.action === 'ignore') return null;
      return `Expected escalation reason=offensive or action=ignore, got action=${r.action} reason=${r.escalation?.reason ?? 'none'}`;
    },
  },
  {
    name: 'Complex question — legal',
    history: [
      { text: 'Привет, скажи, это вообще легально? Какие налоги ты платишь с этого? Какие юридические риски для покупателя?', out: false },
    ],
    assert: (r) =>
      hasEscalation(r, 'complex_question', 'low_confidence')
        ? null
        : `Expected escalation reason=complex_question or low_confidence, got action=${r.action} reason=${r.escalation?.reason ?? 'none'}`,
  },
  {
    name: 'Personal question — meeting request',
    history: [
      { text: 'Привет', out: false },
      { text: 'Привет! Рада видеть тебя здесь 💋', out: true },
      { text: 'Ты красивая, давай встретимся? Скинь номер телефона, я в Кривом Роге живу', out: false },
    ],
    assert: (r) =>
      hasEscalation(r, 'personal_question')
        ? null
        : `Expected escalation reason=personal_question, got action=${r.action} reason=${r.escalation?.reason ?? 'none'}`,
  },
  {
    name: 'Cooperation — advertising offer',
    history: [
      { text: 'Привет! Я представляю рекламное агентство. Хочу предложить сотрудничество — бартер или размещение рекламы на вашем канале. Какие условия?', out: false },
    ],
    assert: (r) => {
      if (hasEscalation(r, 'cooperation') || r.action === 'reply') return null;
      return `Expected escalation cooperation or reply, got action=${r.action} reason=${r.escalation?.reason ?? 'none'}`;
    },
  },
  {
    name: 'Out of scope — crypto question',
    history: [
      { text: 'Привет, а ты не знаешь где биткоин купить? Какой кошелёк лучше для крипты?', out: false },
    ],
    assert: (r) => {
      if (hasEscalation(r, 'out_of_scope', 'complex_question') || r.action === 'reply') return null;
      return `Expected escalation out_of_scope/complex_question or reply, got action=${r.action} reason=${r.escalation?.reason ?? 'none'}`;
    },
  },
  {
    name: 'Refusal — not interested',
    history: [
      { text: 'Привет', out: false },
      { text: 'Привет! Рада тебя видеть 💋 У меня есть эксклюзивные фото и видео, только для подписчиков!', out: true },
      { text: 'Не, спасибо, мне не интересно. Удачи', out: false },
    ],
    assert: (r) =>
      isReplyOnly(r) ? null : `Expected reply (polite goodbye), got action=${r.action} reason=${r.escalation?.reason ?? 'none'}`,
  },
  {
    name: 'Flood — filler messages',
    history: [
      { text: 'Привет', out: false },
      { text: 'Привет! Рада видеть тебя здесь 💋 Чем могу помочь?', out: true },
      { text: '?', out: false },
      { text: 'ну?', out: false },
      { text: 'ты там?', out: false },
    ],
    assert: (r) =>
      isReplyOnly(r) ? null : `Expected reply or ignore (no escalation for filler), got action=${r.action}`,
  },
  {
    name: 'Skip ahead — asks price immediately',
    history: [{ text: 'Сколько стоит подписка?', out: false }],
    assert: (r) => {
      if (r.action === 'reply' || hasEscalation(r, 'ready_to_buy')) return null;
      return `Expected reply (greeting+price) or ready_to_buy, got action=${r.action} reason=${r.escalation?.reason ?? 'none'}`;
    },
  },
  {
    name: 'Freeloader — asks for free content',
    history: [
      { text: 'Привет', out: false },
      { text: 'Привет! Рада тебя видеть 💋 У меня есть приватные фото и видео для подписчиков!', out: true },
      { text: 'Скинь бесплатно пару фоток на пробу, а то вдруг не стоит', out: false },
    ],
    assert: (r) => {
      if (r.action === 'reply' || hasEscalation(r, 'out_of_scope')) return null;
      return `Expected reply or out_of_scope, got action=${r.action} reason=${r.escalation?.reason ?? 'none'}`;
    },
  },
  {
    name: 'Repetitive — same question 3 times',
    history: [
      { text: 'Что у тебя есть?', out: false },
      { text: 'У меня есть приватные фото и видео, эксклюзивные материалы только для подписчиков!', out: true },
      { text: 'Что у тебя есть?', out: false },
      { text: 'Как я уже говорила — приватные фото и видео для подписчиков. Могу рассказать подробнее!', out: true },
      { text: 'Что у тебя есть?', out: false },
    ],
    assert: (r) => {
      if (hasEscalation(r, 'repetitive') || r.action === 'reply') return null;
      return `Expected escalation repetitive or stable reply, got action=${r.action} reason=${r.escalation?.reason ?? 'none'}`;
    },
  },
  {
    name: 'High value — bulk order',
    history: [
      { text: 'Привет, мне нужен доступ сразу на 50 аккаунтов для моей команды. Какая оптовая скидка?', out: false },
    ],
    assert: (r) =>
      hasEscalation(r, 'high_value', 'ready_to_buy')
        ? null
        : `Expected escalation reason=high_value or ready_to_buy, got action=${r.action} reason=${r.escalation?.reason ?? 'none'}`,
  },
  {
    name: 'Language switch — reply in English',
    history: [
      { text: 'Привет!', out: false },
      { text: 'Привет! Рада видеть тебя здесь 💋 Чем могу помочь?', out: true },
      { text: 'Hey, can you tell me what exclusive content do you have? I want to know more.', out: false },
    ],
    assert: (r) => {
      if (r.action !== 'reply' && r.action !== 'reply_and_escalate') {
        return `Expected reply action, got ${r.action}`;
      }
      if (!r.suggestedText || r.suggestedText.length < 10) {
        return `Expected substantive response, got: "${r.suggestedText}"`;
      }
      return null;
    },
  },
];

// ─── Tests ───────────────────────────────────────────────────────────────────

const describeIfReady = hasBackend && hasGroq ? describe : describe.skip;
const describeDeviations = hasBackend ? describe : describe.skip;

describeIfReady('AI Chatting — Happy Path (buyer AI vs seller AI)', () => {
  let groqClient: GroqChatClient;
  let suggestClient: SuggestReplyClient;

  beforeAll(() => {
    groqClient = new GroqChatClient({ apiKey: GROQ_API_KEY });
    suggestClient = new SuggestReplyClient({
      baseUrl: API_BASE_URL,
      adminApiKey: ADMIN_API_KEY,
      accountId: 'test-account-happy-path',
      userId: 'test-user-happy-path',
    });
  });

  it(
    'should escalate with ready_to_buy within 10 turns',
    async () => {
      const result = await runHappyPath({
        groqClient,
        suggestClient,
        buyerSystemPrompt: BUYER_SYSTEM_PROMPT,
        sellerPersona: SELLER_PERSONA,
        maxTurns: 10,
        turnDelayMs: 8_000,
        verbose: true,
      });

      if (!result.success) {
        printTranscriptToConsole(result.history);
      }

      expect(result.success).toBe(true);
    },
    // 10 turns × (8s delay + ~5s API calls) = ~130s
    140_000,
  );
});

describeDeviations('AI Chatting — Deviation Scenarios', () => {
  let suggestClient: SuggestReplyClient;

  beforeAll(() => {
    suggestClient = new SuggestReplyClient({
      baseUrl: API_BASE_URL,
      adminApiKey: ADMIN_API_KEY,
      accountId: 'test-account-deviations',
      userId: 'test-user-deviations',
    });
  });

  it(
    'all deviation scenarios should pass',
    async () => {
      const results = await runDeviationScenarios({
        suggestClient,
        scenarios: DEVIATION_SCENARIOS,
        sellerPersona: SELLER_PERSONA,
        scenarioDelayMs: 6_000,
        verbose: true,
      });

      const failures = results.filter((r) => !r.passed);

      if (failures.length > 0) {
        const failReport = failures.map((f) => `  - ${f.name}: ${f.failReason}`).join('\n');
        fail(`${failures.length}/${results.length} scenarios failed:\n${failReport}`);
      }

      expect(failures).toHaveLength(0);
    },
    // 12 scenarios × (6s delay + ~5s API) = ~132s
    150_000,
  );
});

function printTranscriptToConsole(history: Array<{ text: string; out: boolean }>): void {
  console.log('\n═══════════ TRANSCRIPT ═══════════');
  for (const msg of history) {
    console.log(`${msg.out ? '🤖 Seller' : '👤 Buyer'}: ${msg.text}`);
  }
  console.log('══════════════════════════════════\n');
}
