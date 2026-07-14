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
