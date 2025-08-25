from fastapi import APIRouter, HTTPException, Request
from app.services.session_manager import (
    create_session,
    refresh_session,
    validate_session,
)

router = APIRouter(
    prefix="/session",
    tags=["session"],
    responses={
        404: {"description": "Session not found"},
        400: {"description": "Invalid Session ID"},
        500: {"description": "Internal server error"},
    },
)


@router.post("/")
def start_session():
    try:
        session_id, _ = create_session()
        return {"session_id": session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/verify-session")
def validate_existing_session(request: Request):
    session_id = request.headers.get("session_id")
    try:
        if not session_id:
            raise ValueError("No session_id provided in headers")
        if validate_session(session_id):
            refresh_session(session_id, sliding_expiration=True)
            return {"valid_session": True}
        return {"valid_session": False}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error during session verification: {e}")
        raise HTTPException(
            status_code=500, detail="Internal server error during session verification"
        )
