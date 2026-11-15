import pytest
from httpx import ASGITransport, AsyncClient

from app import main


@pytest.mark.asyncio
async def test_starter_has_public_health_and_authenticated_idempotent_jobs(monkeypatch, tmp_path):
    monkeypatch.setattr(main, "CAPABILITIES", ("instagram.account.health",))
    monkeypatch.setattr(main, "DB_PATH", str(tmp_path / "starter.sqlite3"))
    monkeypatch.setenv("SSPANEL_EXECUTOR_API_KEY", "starter-secret")
    request = {
        "idempotencyKey": "starter:test:v1",
        "orderId": 1,
        "platform": "instagram",
        "actionType": "instagram.account.health",
        "quantity": 1,
        "accountSelector": {"mode": "system"},
        "payload": {},
    }
    async with AsyncClient(transport=ASGITransport(app=main.app), base_url="http://test") as client:
        assert (await client.get("/module/v1/health")).status_code == 200
        assert (await client.get("/module/v1/manifest")).status_code == 401
        headers = {"X-SSPanel-Executor-Key": "starter-secret"}
        first = await client.post("/module/v1/jobs", headers=headers, json=request)
        second = await client.post("/module/v1/jobs", headers=headers, json=request)
        assert first.status_code == second.status_code == 202
        assert first.json()["jobId"] == second.json()["jobId"]


@pytest.mark.asyncio
async def test_starter_persists_cancelled_state_and_accepts_canonical_optional_fields(monkeypatch, tmp_path):
    monkeypatch.setattr(main, "CAPABILITIES", ("instagram.account.health",))
    monkeypatch.setattr(main, "DB_PATH", str(tmp_path / "starter-cancel.sqlite3"))
    monkeypatch.setenv("SSPANEL_EXECUTOR_API_KEY", "starter-secret")
    headers = {"X-SSPanel-Executor-Key": "starter-secret"}
    request = {
        "idempotencyKey": "starter:cancel:v1",
        "orderId": 2,
        "platform": "instagram",
        "actionType": "instagram.account.health",
        "quantity": 1,
        "accountSelector": {"mode": "system"},
        "payload": {},
        "policyEnvelope": {"policyVersion": "starter-policy-v1", "riskProfile": "safe"},
        "callbackUrl": "https://panel.example.test/internal/external-executions/events",
    }

    async with AsyncClient(transport=ASGITransport(app=main.app), base_url="http://test") as client:
        created = await client.post("/module/v1/jobs", headers=headers, json=request)
        assert created.status_code == 202
        job_id = created.json()["jobId"]

        cancelled = await client.post(f"/module/v1/jobs/{job_id}/cancel", headers=headers)
        persisted = await client.get(f"/module/v1/jobs/{job_id}", headers=headers)

    assert cancelled.status_code == persisted.status_code == 200
    assert cancelled.json()["status"] == "cancelled"
    assert persisted.json()["status"] == "cancelled"
