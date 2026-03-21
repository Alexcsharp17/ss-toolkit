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
