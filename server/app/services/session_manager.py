import asyncio
import uuid
import time
import json
from pathlib import Path
from app.utils.shared_functionality import get_base_dir_path
from app.utils.constants import DATABASE_USER_FOLDER, SESSION_TIMEOUT, CLEANER_TIMEOUT

# Config
SESSIONS_BASE = get_base_dir_path() / DATABASE_USER_FOLDER
SESSIONS_BASE.mkdir(parents=True, exist_ok=True)


def _get_session_file(session_id: str) -> Path:
    return SESSIONS_BASE / session_id / "data.json"


def create_session() -> tuple[str, int]:
    session_id = str(uuid.uuid4())
    workdir = SESSIONS_BASE / session_id
    workdir.mkdir(parents=True, exist_ok=True)

    now = int(time.time())
    expires_at = now + SESSION_TIMEOUT

    data: dict[str, int] = {
        "created_date": now,
        "last_used_date": now,
        "expire_date": expires_at,
    }

    # Save metadata to JSON
    with open(_get_session_file(session_id), "w") as f:
        json.dump(data, f)

    return session_id, expires_at


def _load_session_data(session_id: str) -> dict[str, int] | None:
    session_file = _get_session_file(session_id)
    if not session_file.exists():
        return None
    with open(session_file, "r") as f:
        return json.load(f)


def _save_session_data(session_id: str, data: dict[str, int]) -> None:
    session_file = _get_session_file(session_id)
    with open(session_file, "w") as f:
        json.dump(data, f)


def refresh_session(session_id: str, sliding_expiration: bool = False) -> bool:
    data = _load_session_data(session_id)
    if not data:
        return False

    now = int(time.time())
    data["last_used_date"] = now

    if sliding_expiration:
        data["expire_date"] = now + SESSION_TIMEOUT

    _save_session_data(session_id, data)
    return True


def validate_session(session_id: str) -> bool:
    data = _load_session_data(session_id)
    if not data:
        return False
    if data["expire_date"] < int(time.time()):
        delete_session(session_id)
        return False
    return True


def delete_session(session_id: str) -> None:
    workdir = SESSIONS_BASE / session_id
    if workdir.exists() and workdir.is_dir():
        for f in workdir.glob("*"):
            f.unlink()
        workdir.rmdir()


def cleanup_expired_sessions() -> None:
    now = int(time.time())
    for session_dir in SESSIONS_BASE.iterdir():
        if not session_dir.is_dir():
            continue
        session_file = session_dir / "data.json"
        if not session_file.exists():
            continue

        with open(session_file, "r") as f:
            data = json.load(f)

        if data.get("expire_date", 0) < now:
            delete_session(session_dir.name)


async def session_cleaner():
    while True:
        cleanup_expired_sessions()
        await asyncio.sleep(CLEANER_TIMEOUT)  # run every 24 hours
