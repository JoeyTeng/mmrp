from contextvars import ContextVar
import contextlib

_current_session: ContextVar[str] = ContextVar("current_session")


@contextlib.contextmanager
def set_session_context(session_id: str):
    token = _current_session.set(session_id)
    try:
        yield
    finally:
        _current_session.reset(token)


def get_current_session() -> str:
    session_id = _current_session.get()
    if not session_id:
        raise ValueError(
            "No session context available. This function must be called within a request context."
        )
    return session_id
