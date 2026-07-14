# External Module Contract

`external-executor.schema.json` is the canonical wire contract for modules
managed by SS-panel. TypeScript consumers import the matching types from
`@sspanel/ss-toolkit/shared-types`; non-TypeScript modules must generate or
validate their local models from this schema.

## Required module surface

Every module exposes the same authenticated lifecycle under its own REST
service:

```text
GET  /module/v1/manifest
GET  /module/v1/health
POST /module/v1/jobs
GET  /module/v1/jobs/{jobId}
POST /module/v1/jobs/{jobId}/cancel
```

The manifest must advertise only implemented capabilities. A module must make
start, workflow input, and write operations idempotent, preserve monotonic
event sequence numbers, and redact credentials and private message content.

## Python synchronization

From the `modules/aiograpi-rest` checkout:

```bash
python scripts/sync_sspanel_contract.py \
  --schema ../ss-toolkit/contracts/external-executor.schema.json
```

The generated fixture is committed with the module. CI must run the toolkit
drift test and the module schema test before publishing either repository.

The toolkit also ships a generated lightweight Python SDK at
`contracts/generated/external_executor_contract.py` and a copyable starter at
`templates/external-module-python`. Regenerate the SDK after changing the
schema:

```bash
node scripts/generate_external_executor_sdk.mjs
```

Black-box protocol checks are available at
`contracts/conformance/python/sspanel_module_conformance.py`. Copy that file
into a module repository or import it from the toolkit checkout and run
`assert_sspanel_module_conformance` against an async HTTP client. The runner
checks authentication, health, manifest, capability rejection, idempotent
start, and polling without calling a live provider account.

The starter is a REST microservice baseline, not a gateway. It demonstrates
authentication, health, manifest, idempotent jobs, SQLite persistence, and a
conformance test while leaving platform-specific workflows to the module
repository.

## Fork convention

SS-panel module forks use the working branch `sspanel-main`. Keep the original
project as the `upstream` remote and rebase or merge upstream changes into the
fork only after the facade and contract tests pass.
