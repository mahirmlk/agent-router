from __future__ import annotations

from collections.abc import Mapping
from typing import Any
import time

from fastapi import HTTPException

from ..config import get_settings
from ..graph.workflow import get_chat_workflow
from ..schemas import ChatMetadata, ChatRequest, ChatResponse


SERVER_KEY_RATE_WINDOW_SECONDS = 600
SERVER_KEY_RATE_LIMIT = 12
SERVER_KEY_MAX_MESSAGE_CHARS = 1200
SERVER_KEY_MAX_HISTORY_MESSAGES = 8
SERVER_KEY_MAX_ATTACHMENT_CHARS = 12000

_request_buckets: dict[str, list[float]] = {}


def extract_client_id(headers: Mapping[str, Any]) -> str:
  explicit_client_id = headers.get("x-agent-router-client")

  if explicit_client_id:
    return str(explicit_client_id)

  forwarded_for = headers.get("x-forwarded-for")

  if forwarded_for:
    return str(forwarded_for).split(",")[0].strip() or "unknown"

  return "unknown"


def enforce_server_key_limits(
  request: ChatRequest,
  client_id: str,
  using_custom_key: bool,
) -> str | None:
  if using_custom_key:
    return None

  if len(request.message.strip()) > SERVER_KEY_MAX_MESSAGE_CHARS:
    return (
      "Message too long for the shared OpenRouter route. "
      f"Keep it under {SERVER_KEY_MAX_MESSAGE_CHARS} characters."
    )

  if len(request.conversation_history) > SERVER_KEY_MAX_HISTORY_MESSAGES:
    return (
      "Conversation too long for the shared OpenRouter route. "
      f"Keep history under {SERVER_KEY_MAX_HISTORY_MESSAGES} messages."
    )

  total_attachment_chars = sum(len(item.content or "") for item in request.attachments)

  if total_attachment_chars > SERVER_KEY_MAX_ATTACHMENT_CHARS:
    return (
      "Attachments are too large for the shared OpenRouter route. "
      f"Keep attachment text under {SERVER_KEY_MAX_ATTACHMENT_CHARS} characters."
    )

  now = time.time()
  existing = _request_buckets.get(client_id, [])
  valid_entries = [
    timestamp
    for timestamp in existing
    if now - timestamp <= SERVER_KEY_RATE_WINDOW_SECONDS
  ]

  if len(valid_entries) >= SERVER_KEY_RATE_LIMIT:
    _request_buckets[client_id] = valid_entries
    return (
      "Rate limit reached for the shared OpenRouter route. "
      "Please wait a few minutes or use your own OpenRouter key."
    )

  valid_entries.append(now)
  _request_buckets[client_id] = valid_entries
  return None


async def process_chat_request(
  request: ChatRequest,
  *,
  client_id: str,
  origin: str | None,
) -> ChatResponse:
  if not request.message.strip():
    raise HTTPException(status_code=400, detail="Message is required.")

  settings = get_settings()
  provider = request.selected_provider
  custom_api_key = ((provider.api_key if provider else "") or "").strip()
  custom_base_url = ((provider.base_url if provider else "") or "").strip()
  using_custom_key = bool(custom_api_key)
  api_key = custom_api_key or settings.openrouter_api_key

  if not api_key:
    raise HTTPException(
      status_code=500,
      detail=(
        "Missing OpenRouter API key. Set OPENROUTER_API_KEY "
        "or provide your own OpenRouter key in Providers."
      ),
    )

  limit_error = enforce_server_key_limits(request, client_id, using_custom_key)

  if limit_error:
    raise HTTPException(status_code=413, detail=limit_error)

  workflow = get_chat_workflow()

  try:
    result = await workflow.ainvoke(
      {
        "request": request,
        "settings": settings,
        "client_origin": origin,
        "api_key": api_key,
        "base_url": custom_base_url or settings.openrouter_base_url,
      }
    )
  except RuntimeError as error:
    raise HTTPException(status_code=502, detail=str(error)) from error

  return ChatResponse(
    response=str(result["response_text"]),
    metadata=ChatMetadata(
      model_used=str(result["model_used"]),
      tier_name=str(result["provider_label"]),
      tokens_used=int(result["tokens_used"]),
    ),
  )
