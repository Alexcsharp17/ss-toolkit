# External Module Starter

This is a minimal Python REST module starter for SS-panel social modules. Copy
the directory into a separate repository and replace the `capabilities` list
and `execute_job` implementation with platform-specific behavior.

The starter provides:

- public liveness at `/module/v1/health`;
- scoped API-key authentication for manifest and jobs;
- manifest and capability advertisement;
- SQLite-backed job/idempotency storage;
- stable job IDs for repeated starts;
- a reusable conformance test entry point;
- no SS-panel `Order`, Prisma, prompt, or credential dependency.

The reference Instagram module adds encrypted account storage, leases,
workflow checkpoints, callbacks, and provider error classification. Those are
deliberate extensions, not hidden requirements of this starter.

```bash
uv run pytest
```
