from pydantic import BaseModel, Field


class VoiceConversationState(BaseModel):
    pending_product_ids: list[int] = Field(default_factory=list)
    last_selected_product_id: int | None = None
    last_mentioned_product_id: int | None = None
    pending_intent: str | None = None


class VoiceCommandRequest(BaseModel):
    restaurant_id: int
    transcript: str = Field(min_length=1)
    cart: list[dict] = Field(default_factory=list)
    conversation_history: list[dict] = Field(default_factory=list)
    conversation_state: VoiceConversationState = Field(
        default_factory=VoiceConversationState
    )


class VoiceCommandResponse(BaseModel):
    action: str
    product_id: int | None = None
    quantity: int = 1
    response: str
    requires_confirmation: bool = False
    conversation_state: VoiceConversationState = Field(
        default_factory=VoiceConversationState
    )
