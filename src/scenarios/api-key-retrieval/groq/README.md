# Groq API Key Retrieval Scenario

Автоматизация получения API ключа на https://console.groq.com/keys

**Issue:** #15 Automate Groq API key registration

Сценарий запускается через Go-бинарник **groq-runner** (ss-toolkit/libs/groq-runner), который использует [bogdanfinn/tls-client](https://github.com/bogdanfinn/tls-client) для HTTP (tempmail.lol) и [go-rod/rod](https://github.com/go-rod/rod) для браузера. TypeScript вызывает бинарник через `child_process.spawn` и парсит JSON из stdout.

## Flow

1. Создание temp mail inbox (tempmail.lol API через tls-client с TLS fingerprint)
2. Запуск headless браузера (rod)
3. Переход на console.groq.com/login, ввод email, Continue
4. Ожидание письма с верификацией (poll tempmail.lol через tls-client)
5. Открытие ссылки из письма
6. Переход на /keys, Create API key, имя, no expiration
7. Создание ключа, извлечение API key с страницы

## Запуск

Сначала соберите groq-runner (один раз):

```bash
cd ss-toolkit/libs/groq-runner && go build -o groq-runner . && cd -
```

Затем из **ss-toolkit** или из корня репо (с `GROQ_RUNNER_PATH`):

```bash
# Из ss-toolkit
cd ss-toolkit && npx tsx src/scenarios/api-key-retrieval/groq/run.ts

# Из корня репо — укажите путь к бинарнику
GROQ_RUNNER_PATH=./ss-toolkit/libs/groq-runner/groq-runner npx tsx ss-toolkit/src/scenarios/api-key-retrieval/groq/run.ts
```

## Использование в коде

```typescript
import { GroqApiKeyScenario } from '@sspanel/ss-toolkit';

const scenario = new GroqApiKeyScenario({
  headed: true,
  apiKeyName: 'my-key',
  stepDelayMs: 1500,
});

const result = await scenario.run();
if (result.success && result.apiKey) {
  console.log('API Key:', result.apiKey);
}
```

## Конфиг

- `headed` — видимый браузер (default: true)
- `proxy` — прокси сервер
- `mailProvider` — провайдер temp mail: `tempmailol` (default) или `mailtm`
- `emailPollMs` — интервал проверки почты (default: 5000)
- `emailTimeoutMs` — таймаут ожидания письма (default: 120000)
- `apiKeyName` — имя создаваемого ключа
- `stepDelayMs` — задержка между шагами
- `groqRunnerPath` — путь к бинарнику groq-runner (по умолчанию ищется `libs/groq-runner/groq-runner` от cwd или `ss-toolkit/libs/...`)

Env: `GROQ_RUNNER_PATH` — путь к groq-runner при запуске из корня репо. `MAIL_PROVIDER=tempmailol` при запуске `run.ts`.

## Проверенные селекторы (Groq login)

- **Email input:** `input#email-input`, `input[name="email"]`, `input[type="email"]`
- **Continue:** `button:has-text("Continue with email")`, `button[type="submit"]`
- **Login link (home):** `a[href="https://console.groq.com/login"]`, `a:has-text("Log In")`

Селекторы в `selectors.ts` — несколько fallback на каждый элемент (id/class/text).

## TODO

- Интеграция CaptchaService для Cloudflare
- Retry с proxy/fingerprint при ошибках
- Groq может блокировать temp mail — по умолчанию используется tempmail.lol; при блокировке переключить на mailtm или прокси
- После нажатия «Continue» сценарий проверяет страницу на сообщение об ошибке (например «Registration failed», «Stytch error logging you in»). Текст ошибки выводится в `result.error` как `Groq registration error: …`
- **Stytch** — провайдер аутентификации, который использует Groq для входа по email. Ошибка «Stytch error logging you in» обычно означает блокировку temp mail, rate limit или сбой на стороне Stytch.
