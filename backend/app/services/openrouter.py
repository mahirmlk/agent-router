from __future__ import annotations

from typing import Any

import httpx


def _get_response_text(payload: dict[str, Any]) -> str:
  choices = payload.get("choices") or []
  first_choice = choices[0] if choices else {}
  message = first_choice.get("message") or {}
  content = message.get("content")

  if isinstance(content, str):
    return content

  if isinstance(content, list):
    parts = [
      item.get("text", "").strip()
      for item in content
      if isinstance(item, dict) and item.get("text")
    ]
    return "\n\n".join(part for part in parts if part)

  return ""


async def call_openrouter(
  *,
  api_key: str,
  base_url: str,
  model: str,
  messages: list[dict[str, str]],
  max_tokens: int,
  temperature: float,
  origin: str | None = None,
) -> dict[str, Any]:
  async with httpx.AsyncClient(timeout=60.0) as client:
    response = await client.post(
      f"{base_url.rstrip('/')}/chat/completions",
      headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        **({"HTTP-Referer": origin} if origin else {}),
        "X-Title": "Agent Router",
      },
      json={
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
      },
    )

  content_type = response.headers.get("content-type", "")

  if "application/json" in content_type:
    payload = response.json()
  else:
    payload = {"error": {"message": response.text}}

  if not response.is_success:
    error_detail = (
      payload.get("error", {}).get("message")
      if isinstance(payload, dict)
      else None
    )
    raise RuntimeError(
      (error_detail or f"OpenRouter request failed with status {response.status_code}.").strip()
    )

  if not isinstance(payload, dict):
    raise RuntimeError("OpenRouter returned an unexpected response payload.")

  usage = payload.get("usage") or {}

  return {
    "content": _get_response_text(payload),
    "model_used": payload.get("model") or model,
    "tokens_used": int(usage.get("total_tokens") or 0),
  }
