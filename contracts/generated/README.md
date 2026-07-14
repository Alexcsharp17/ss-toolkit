# Generated Contract SDK

`external_executor_contract.py` is generated from the canonical JSON Schema.
Regenerate it from the toolkit checkout with:

```bash
node scripts/generate_external_executor_sdk.mjs
```

The generated module contains the shared vocabulary and lightweight Python
`TypedDict` request/response models. It is intentionally free of SS-panel
database, billing, prompt, and credential code so a module developer can copy
it into an independent REST service.
