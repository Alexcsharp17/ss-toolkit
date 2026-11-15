from __future__ import annotations

import hashlib
import json
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
    policyEnvelope: dict[str, Any] | None = None
    callbackUrl: str | None = Field(default=None, min_length=1)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def db() -> sqlite3.Connection:
    directory = os.path.dirname(DB_PATH)
    if directory:
        os.makedirs(directory, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS jobs (
            job_id TEXT PRIMARY KEY,
            idempotency_key TEXT UNIQUE NOT NULL,
            payload TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'queued',
            completed_count INTEGER NOT NULL DEFAULT 0,
            total_count INTEGER NOT NULL DEFAULT 1,
            result TEXT NOT NULL DEFAULT '{}',
            account_health TEXT NOT NULL DEFAULT '{}',
            accepted_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    columns = {row[1] for row in connection.execute("PRAGMA table_info(jobs)").fetchall()}
    migrations = {
        "status": "TEXT NOT NULL DEFAULT 'queued'",
        "completed_count": "INTEGER NOT NULL DEFAULT 0",
        "total_count": "INTEGER NOT NULL DEFAULT 1",
        "result": "TEXT NOT NULL DEFAULT '{}'",
        "account_health": "TEXT NOT NULL DEFAULT '{}'",
        "accepted_at": "TEXT NOT NULL DEFAULT ''",
        "updated_at": "TEXT NOT NULL DEFAULT ''",
    }
    for name, definition in migrations.items():
        if name not in columns:
            connection.execute(f"ALTER TABLE jobs ADD COLUMN {name} {definition}")
    return connection


def executor_key(x_sspanel_executor_key: str | None = Header(default=None)) -> None:
    expected = os.getenv("SSPANEL_EXECUTOR_API_KEY", "")
    if not expected or x_sspanel_executor_key != expected:
        raise HTTPException(status_code=401, detail="Invalid SS-panel executor API key")


def decode_json(value: str | None) -> dict[str, Any]:
    try:
        parsed = json.loads(value or "{}")
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def job_response(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "jobId": row["job_id"],
        "status": row["status"],
        "completedCount": row["completed_count"],
        "totalCount": row["total_count"],
        "result": decode_json(row["result"]),
        "accountHealth": decode_json(row["account_health"]),
    }


def find_job(connection: sqlite3.Connection, job_id: str) -> sqlite3.Row | None:
    return connection.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,)).fetchone()


@app.get("/module/v1/health")
async def health() -> dict[str, str]:
    return {"moduleId": MODULE_ID, "status": "ok"}


@app.get("/module/v1/manifest", dependencies=[Depends(executor_key)])
async def manifest() -> dict[str, Any]:
    return {
        "moduleId": MODULE_ID,
        "platform": PLATFORM,
        "contractVersions": ["1.0"],
        "features": [],
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
    accepted_at = utc_now()
    connection = db()
    try:
        connection.execute(
            """
            INSERT OR IGNORE INTO jobs(
                job_id, idempotency_key, payload, status, completed_count,
                total_count, result, account_health, accepted_at, updated_at
            ) VALUES (?, ?, ?, 'queued', 0, ?, '{}', '{}', ?, ?)
            """,
            (job_id, request.idempotencyKey, request.model_dump_json(), request.quantity, accepted_at, accepted_at),
        )
        connection.commit()
        row = find_job(connection, job_id)
    finally:
        connection.close()
    if row is None:
        raise HTTPException(status_code=500, detail="Job persistence failed")
    return {"jobId": job_id, "status": row["status"], "acceptedAt": row["accepted_at"] or accepted_at}


@app.get("/module/v1/jobs/{job_id}", dependencies=[Depends(executor_key)])
async def get_job(job_id: str) -> dict[str, Any]:
    connection = db()
    try:
        row = find_job(connection, job_id)
    finally:
        connection.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job_response(row)


@app.post("/module/v1/jobs/{job_id}/cancel", dependencies=[Depends(executor_key)])
async def cancel_job(job_id: str) -> dict[str, Any]:
    connection = db()
    try:
        row = find_job(connection, job_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Job not found")
        if row["status"] not in {"completed", "partially_completed", "failed", "cancelled"}:
            connection.execute(
                "UPDATE jobs SET status = 'cancelled', updated_at = ? WHERE job_id = ?",
                (utc_now(), job_id),
            )
            connection.commit()
        row = find_job(connection, job_id)
    finally:
        connection.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job_response(row)
