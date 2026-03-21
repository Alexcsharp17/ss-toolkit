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

**What lives in the package (no URLs, no product scripts):**

| Piece | Role |
|--------|------|
| `GroqChatClient` | POST to Groq chat completions; you pass `apiKey` and prompts. |
| `SuggestReplyClient` | POST to your backend `.../operator/conversations/:account/:user/suggest`; you pass `baseUrl`, headers, ids. |
| `runHappyPath` | Loop: buyer message (Groq) → seller (`suggest`) until your `isSuccess(result)` returns true or `maxTurns`. |
| `runDeviationScenarios` | For each static `history` + `assert(result)`, calls `suggest` once. |
| `SuggestOverrides` | Optional JSON fields (`salesScript`, `persona`, …) merged into the suggest body. |
| `hasEscalation` / `isReplyOnly` / `printTranscript` | Small helpers; escalation **reason strings** are defined by your app. |

**What does *not* live here:** concrete seller persona, sales script text, “ready_to_buy” business rules, or any default API host — that stays in the consuming repo (e.g. SSPanel `automation/.../fixtures/`).

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

const apiOrigin = process.env.MY_API_BASE_URL!; // your app chooses staging/prod/dev

const groqClient = new GroqChatClient({ apiKey: process.env.GROQ_API_KEY! });
const suggestClient = new SuggestReplyClient({
  baseUrl: apiOrigin,
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
- **Contract** (`src/__tests__/contract/ai-chatting/`) — optional smoke; **skipped** unless you set env (`GROQ_API_KEY` / `SS_TOOLKIT_API_BASE_URL` / etc.). No API host or Groq key is committed in this repo.

```bash
# Groq only
npx jest modules/ss-toolkit/src/__tests__/contract/ai-chatting/groq --testTimeout=60000

# /suggest + runner — export your backend origin first
export SS_TOOLKIT_API_BASE_URL='https://your-api.example'
npx jest modules/ss-toolkit/src/__tests__/contract/ai-chatting/suggest-reply --testTimeout=120000
npx jest modules/ss-toolkit/src/__tests__/contract/ai-chatting/runner --testTimeout=120000
```

Product-specific scenarios (scripts, assertions) run from the **SSPanel** repo, not from this package.

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
