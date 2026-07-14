from __future__ import annotations

import hashlib
import os
import sqlite3
from datetime import datetime, timezone
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field

MODULE_ID = os.getenv("SSPANEL_MODULE_ID", "external-module-starter")
PLATFORM = os.getenv("SSPANEL_MODULE_PLATFORM", "instagram")
CAPABILITIES = tuple(filter(None, os.getenv("SSPANEL_MODULE_CAPABILITIES", "").split(",")))
DB_PATH = os.getenv("SSPANEL_MODULE_DB_PATH", "./data/module.sqlite3")

app = FastAPI(title="SS-panel External Module Starter")


class AccountSelector(BaseModel):
    model_config = ConfigDict(extra="forbid")

    mode: str
    accountIds: list[str] = Field(default_factory=list)
    constraints: dict[str, Any] = Field(default_factory=dict)


class JobStartRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    idempotencyKey: str = Field(min_length=1)
    orderId: int = Field(ge=1)
    platform: str
    actionType: str
    quantity: int = Field(ge=1)
    accountSelector: AccountSelector
    payload: dict[str, Any] = Field(default_factory=dict)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def db() -> sqlite3.Connection:
    directory = os.path.dirname(DB_PATH)
    if directory:
        os.makedirs(directory, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute(
        "CREATE TABLE IF NOT EXISTS jobs (job_id TEXT PRIMARY KEY, idempotency_key TEXT UNIQUE NOT NULL, payload TEXT NOT NULL)"
    )
    return connection


def executor_key(x_sspanel_executor_key: str | None = Header(default=None)) -> None:
    expected = os.getenv("SSPANEL_EXECUTOR_API_KEY", "")
    if not expected or x_sspanel_executor_key != expected:
        raise HTTPException(status_code=401, detail="Invalid SS-panel executor API key")


def job_response(job_id: str, request: JobStartRequest | None = None) -> dict[str, Any]:
    return {
        "jobId": job_id,
        "status": "queued",
        "completedCount": 0,
        "totalCount": request.quantity if request else 1,
        "result": {},
        "accountHealth": {},
    }


@app.get("/module/v1/health")
async def health() -> dict[str, str]:
    return {"moduleId": MODULE_ID, "status": "ok"}


@app.get("/module/v1/manifest", dependencies=[Depends(executor_key)])
async def manifest() -> dict[str, Any]:
    return {
        "moduleId": MODULE_ID,
        "platform": PLATFORM,
        "contractVersions": ["1.0"],
        "capabilities": list(CAPABILITIES),
        "workflowTypes": [],
        "supportsPolling": True,
        "supportsCallbacks": False,
    }


@app.post("/module/v1/jobs", status_code=202, dependencies=[Depends(executor_key)])
async def start_job(request: JobStartRequest) -> dict[str, Any]:
    if request.platform != PLATFORM or request.actionType not in CAPABILITIES:
        raise HTTPException(status_code=422, detail="Unsupported module capability")
    job_id = "job_" + hashlib.sha256(request.idempotencyKey.encode()).hexdigest()[:24]
    connection = db()
    try:
        connection.execute(
            "INSERT OR IGNORE INTO jobs(job_id, idempotency_key, payload) VALUES (?, ?, ?)",
            (job_id, request.idempotencyKey, request.model_dump_json()),
        )
        connection.commit()
    finally:
        connection.close()
    return {"jobId": job_id, "status": "queued", "acceptedAt": utc_now()}


@app.get("/module/v1/jobs/{job_id}", dependencies=[Depends(executor_key)])
async def get_job(job_id: str) -> dict[str, Any]:
    connection = db()
    try:
        row = connection.execute("SELECT job_id, payload FROM jobs WHERE job_id = ?", (job_id,)).fetchone()
    finally:
        connection.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Job not found")
    request = JobStartRequest.model_validate_json(row["payload"])
    return job_response(job_id, request)


@app.post("/module/v1/jobs/{job_id}/cancel", dependencies=[Depends(executor_key)])
async def cancel_job(job_id: str) -> dict[str, Any]:
    progress = await get_job(job_id)
    progress["status"] = "cancelled"
    return progress
