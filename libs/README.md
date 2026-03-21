# ss-toolkit libs

Go libraries and binaries used by ss-toolkit scenarios.

## tls-client (submodule)

[bogdanfinn/tls-client](https://github.com/bogdanfinn/tls-client) — HTTP client with TLS fingerprinting (Chrome, Firefox, etc.) and HTTP/2. Used to avoid Cloudflare/WAF blocks on HTTP requests (e.g. tempmail.lol API).

```bash
# Init/update submodule
git submodule update --init ss-toolkit/libs/tls-client
```

## groq-runner

CLI that runs the Groq API key retrieval scenario: temp mail (via tls-client) + browser (rod). Used by the TypeScript Groq scenario via `child_process.spawn`.

**Build:**

```bash
cd ss-toolkit/libs/groq-runner && go build -o groq-runner .
```

**Run (for testing):**

```bash
./groq-runner --proxy "http://host:port" --mail-provider tempmailol --timeout-ms 120000
# Output: one JSON line to stdout with success, apiKey, inbox, error.
```

**Flags:** `--proxy`, `--mail-provider`, `--timeout-ms`, `--api-key-name`, `--step-delay-ms`, `--email-poll-ms`, `--email-timeout-ms`.
