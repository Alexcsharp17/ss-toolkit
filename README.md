# ss-toolkit

Library for integrating external services with unified architecture.

## Categories

- **Captcha Solvers** — CapMonster, 2Captcha
- **Temporary Mail** — mail.tm, tempmail.lol
- **Payment Providers** — Cryptomus, BitCart
- **Fingerprint Generators** — Apify (fingerprint-injector, fingerprint-generator)

## Architecture

- **Models** — unified structures (CaptchaTask, CaptchaResult, MailInbox, MailMessage, PaymentResult, Fingerprint)
- **Interfaces** — ICaptchaSolver, IMailProvider, IPaymentProvider, IFingerprintGenerator
- **Adapters** — translate provider API responses to unified models
- **Mappers** — map native provider fields to project models
- **Factories** — create adapter instances by config
- **Services** — provider selection, load balancing, retry

## Installation

```bash
npm install @sspanel/ss-toolkit
# Optional for fingerprint: fingerprint-generator fingerprint-injector playwright
```

## Usage

```typescript
import {
  CaptchaService,
  MailService,
  FingerprintService,
  CaptchaTask,
  RoundRobinSelector,
  SimpleRetryPolicy,
} from '@sspanel/ss-toolkit';

// Captcha
const captcha = new CaptchaService({
  providers: [
    { provider: 'capmonster', apiKey: '...' },
    { provider: '2captcha', apiKey: '...' },
  ],
  selector: new RoundRobinSelector(),
  retry: new SimpleRetryPolicy({ maxAttempts: 3 }),
});
const result = await captcha.solve({ type: 'recaptcha-v2', siteKey: '...', pageUrl: '...' });

// Temp mail
const mail = new MailService({ providers: [{ provider: 'mailtm' }] });
const inbox = await mail.createInbox();
const messages = await mail.fetchMessages(inbox);

// Fingerprint
const fingerprint = new FingerprintService({ providers: [{ provider: 'apify' }] });
const fp = await fingerprint.generateFingerprint({ devices: ['desktop'], operatingSystems: ['windows'] });
const browser = await import('playwright').then((p) => p.chromium.launch({ headless: false }));
const context = await fingerprint.injectIntoBrowser(browser, { devices: ['mobile'] });
```

## Tests

```bash
# From project root
npm test ss-toolkit              # all ss-toolkit tests (unit + integration)
npm test ss-toolkit/src/__tests__/unit    # unit only
npm test ss-toolkit/src/__tests__/integration  # integration only (mail.tm)
```

Integration tests for mail.tm hit the real API and may fail with 429 (rate limit) if run too frequently. Retry with delay is built in.

## Telegram Bot API

Lightweight wrapper over Telegram Bot API (no external dependencies, uses built-in `fetch`).

```typescript
import {
  TelegramBotApiClient,
  runEchoBotLoop,
  checkBotApiHealth,
  runBotDialogScript,
} from '@sspanel/ss-toolkit';

// Health check
const client = new TelegramBotApiClient({ token: process.env.BOT_TOKEN! });
const health = await checkBotApiHealth(client);
console.log(health.bot?.username, health.pendingUpdates);

// Echo bot loop (long polling, runs until signal aborted)
const controller = new AbortController();
await runEchoBotLoop({ client, signal: controller.signal });

// Scripted two-bot dialog
const actorClient = new TelegramBotApiClient({ token: process.env.ACTOR_BOT_TOKEN! });
const targetBotInfo = await new TelegramBotApiClient({ token: process.env.TARGET_BOT_TOKEN! }).getMe();

const result = await runBotDialogScript({
  actorClient,
  targetBotId: targetBotInfo.result!.id,
  steps: [
    { sendText: '/start', expectSubstring: 'Hi', timeoutMs: 10_000 },
    { sendText: 'hello', expectSubstring: 'hello', timeoutMs: 10_000 },
  ],
});
console.log(result.success, result.steps);
```

### Integration tests (Telegram)

Two bots are required. The **target** bot must already be running and replying before the test runs (e.g. with `startEchoBot`).

```bash
# Terminal 1 — start echo (target) bot:
TARGET_BOT_TOKEN=<token> npx tsx automation/scripts/telegram-bot-echo.ts

# Terminal 2 — run Telegram integration tests:
SS_TOOLKIT_TELEGRAM_ACTOR_BOT_TOKEN=<token> \
SS_TOOLKIT_TELEGRAM_TARGET_BOT_TOKEN=<token> \
npx jest --testPathPattern=telegram --testTimeout=120000
```

**Environment variables:**

| Variable | Required for | Description |
|---|---|---|
| `SS_TOOLKIT_TELEGRAM_ACTOR_BOT_TOKEN` | two-bot test | Token for the actor bot (sends messages, polls replies) |
| `SS_TOOLKIT_TELEGRAM_TARGET_BOT_TOKEN` | two-bot test | Token for the target (echo) bot |

Without these variables the two-bot `describe` is skipped automatically. Health-only tests also skip if no token is set.

## Scenarios

Pre-built automation scenarios:

- **api-key-retrieval/groq** — Groq API key registration (Issue #15)
  - `npm run groq:scenario` (from project root)

## Extensibility

Add a new provider:

1. Create adapter in `categories/{category}/adapters/`
2. Create mapper in `categories/{category}/mappers/`
3. Register in factory

Service layer remains unchanged.
