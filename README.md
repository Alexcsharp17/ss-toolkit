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

## AI Chatting (generic runners)

The toolkit only ships **transport + loop helpers**: Groq chat, HTTP client for `/suggest`, and two runners. **Sales scripts, persona text, escalation reason names, and scenario assertions belong in your application** (see SSPanel `automation/integration/api/aiChattingScenarios/fixtures/`).

```typescript
import {
  GroqChatClient,
  SuggestReplyClient,
  runHappyPath,
  runDeviationScenarios,
  hasEscalation,
  isReplyOnly,
} from '@sspanel/ss-toolkit';
import type { SuggestOverrides, DeviationScenario } from '@sspanel/ss-toolkit';

const groqClient = new GroqChatClient({ apiKey: process.env.GROQ_API_KEY! });
const suggestClient = new SuggestReplyClient({
  baseUrl: 'http://localhost:3000',
  adminApiKey: process.env.ADMIN_API_KEY!,
  accountId: 'test-account',
  userId: 'test-user',
});

const overrides: SuggestOverrides = {
  salesScript: ['...'],
  persona: '...',
  channelDescription: '...',
  channelFirstPost: '...',
};

const result = await runHappyPath({
  groqClient,
  suggestClient,
  buyerSystemPrompt: '...',
  suggestOverrides: overrides,
  isSuccess: (r) =>
    (r.action === 'reply_and_escalate' || r.action === 'escalate') &&
    r.escalation?.reason === 'ready_to_buy',
  maxTurns: 10,
  verbose: true,
});

const scenarios: DeviationScenario[] = [
  {
    name: 'example',
    history: [{ text: 'Hi', out: false }],
    assert: (r) => (hasEscalation(r, 'offensive') ? null : 'expected offensive'),
  },
];
const devResults = await runDeviationScenarios({ suggestClient, scenarios, suggestOverrides: overrides });
```

### Tests in this package

- **Unit** (`src/__tests__/unit/ai-chatting/`) — pure assertion helpers, no network.
- **Contract** (`src/__tests__/contract/ai-chatting/`) — smoke against real APIs when env is set; skipped otherwise.

```bash
# Contract: Groq only (needs key)
SS_TOOLKIT_GROQ_API_KEY=gsk_... npx jest modules/ss-toolkit/src/__tests__/contract/ai-chatting/groq --testTimeout=60000

# Contract: backend /suggest only (set URL explicitly)
SS_TOOLKIT_API_BASE_URL=http://localhost:3000 npx jest modules/ss-toolkit/src/__tests__/contract/ai-chatting/suggest-reply --testTimeout=120000

# Contract: one full loop (needs both)
SS_TOOLKIT_GROQ_API_KEY=gsk_... SS_TOOLKIT_API_BASE_URL=http://localhost:3000 \
  npx jest modules/ss-toolkit/src/__tests__/contract/ai-chatting/runner --testTimeout=120000
```

`SS_TOOLKIT_API_BASE_URL` has **no default** in contract tests: export it when you intend to hit a server.

Product-specific Polina scenarios run from the **SSPanel** repo (Jest + `automation/.../fixtures/polina-scenario.ts`), not from this package.

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
