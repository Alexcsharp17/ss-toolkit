"""Black-box checks for an SS-panel external module REST client.

The runner intentionally depends on an HTTP-client-shaped object only. Module
authors can use it with ``httpx.AsyncClient``, a test transport, or their own
language binding without importing SS-panel internals.
"""

from __future__ import annotations

from typing import Any, Iterable


DEFAULT_REQUIRED_CAPABILITIES = (
    "instagram.account.health",
    "instagram.profile.get",
    "instagram.comments.list",
)


async def assert_sspanel_module_conformance(
    client: Any,
    api_key: str,
    *,
    expected_platform: str = "instagram",
    required_capabilities: Iterable[str] = DEFAULT_REQUIRED_CAPABILITIES,
    idempotency_key: str = "conformance:idempotency:v1",
) -> dict[str, Any]:
    """Validate the mandatory module lifecycle and return its manifest.

    ``client`` must provide async ``get`` and ``post`` methods compatible with
    httpx. The checks avoid provider calls: they only create a queued test job
    and verify the lifecycle response.
    """
    required = tuple(required_capabilities)
    if not required:
        raise AssertionError("at least one required capability is needed for the lifecycle check")

    missing_auth = await client.get("/module/v1/manifest")
    assert missing_auth.status_code == 401

    health = await client.get("/module/v1/health")
    assert health.status_code == 200
    assert health.json().get("status") in {"ok", "degraded", "unavailable"}

    headers = {"X-SSPanel-Executor-Key": api_key}
    manifest_response = await client.get("/module/v1/manifest", headers=headers)
    assert manifest_response.status_code == 200
    manifest = manifest_response.json()
    assert manifest.get("moduleId")
    assert manifest.get("platform") == expected_platform
    assert manifest.get("contractVersions")
    assert isinstance(manifest.get("features", []), list)
    assert manifest.get("supportsPolling") is True
    capabilities = set(manifest.get("capabilities", []))
    assert set(required).issubset(capabilities)

    unsupported = await client.post(
        "/module/v1/jobs",
        headers=headers,
        json={
            "idempotencyKey": f"{idempotency_key}:unsupported",
            "orderId": 1,
            "platform": expected_platform,
            "actionType": "unsupported.capability",
            "quantity": 1,
            "accountSelector": {"mode": "system"},
            "payload": {},
        },
    )
    assert unsupported.status_code in {400, 422}

    request = {
        "idempotencyKey": idempotency_key,
        "orderId": 1,
        "platform": expected_platform,
        "actionType": required[0],
        "quantity": 1,
        "accountSelector": {"mode": "system"},
        "payload": {},
    }
    first = await client.post("/module/v1/jobs", headers=headers, json=request)
    second = await client.post("/module/v1/jobs", headers=headers, json=request)
    assert first.status_code == second.status_code == 202
    assert first.json().get("jobId") == second.json().get("jobId")

    progress = await client.get(
        f"/module/v1/jobs/{first.json()['jobId']}",
        headers=headers,
    )
    assert progress.status_code == 200
    body = progress.json()
    assert body.get("jobId") == first.json().get("jobId")
    assert isinstance(body.get("completedCount"), int)
    assert isinstance(body.get("totalCount"), int)
    return manifest
