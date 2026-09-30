from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.voice import (
    VoiceCommandRequest,
    VoiceCommandResponse,
)
from app.services.voice_ai import process_voice_command


router = APIRouter(
    prefix="/api/voice",
    tags=["Voice Ordering"],
)


@router.post(
    "/command",
    response_model=VoiceCommandResponse,
)
def voice_command(
    request: VoiceCommandRequest,
    db: Session = Depends(get_db),
):
    try:
        result = process_voice_command(
            transcript=request.transcript,
            restaurant_id=request.restaurant_id,
            cart=request.cart,
            conversation_history=request.conversation_history,
            conversation_state=request.conversation_state.model_dump(),
            db=db,
        )

        return result

    except RuntimeError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        print(
            "Voice AI error:",
            repr(exc),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Voice assistant failed "
                "to process the request."
            ),
        ) from exc
