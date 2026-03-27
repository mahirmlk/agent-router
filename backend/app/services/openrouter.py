from __future__ import annotations

from typing import Any

import httpx


def _get_openai_response_text(payload: dict[str, Any]) -> str:
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


def _get_anthropic_response_text(payload: dict[str, Any]) -> str:
  content = payload.get("content") or []

  if not isinstance(content, list):
    return ""

  parts = [
    item.get("text", "").strip()
    for item in content
    if isinstance(item, dict) and item.get("type") == "text" and item.get("text")
  ]
  return "\n\n".join(part for part in parts if part)


def _is_openrouter_url(base_url: str) -> bool:
  return "openrouter.ai" in base_url.lower()


async def _call_openai_compatible(
  *,
  api_key: str,
  base_url: str,
  model: str,
  messages: list[dict[str, str]],
  max_tokens: int,
  temperature: float,
  origin: str | None = None,
) -> dict[str, Any]:
  headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
  }

  if _is_openrouter_url(base_url):
    if origin:
      headers["HTTP-Referer"] = origin
    headers["X-Title"] = "Agent Router"

  async with httpx.AsyncClient(timeout=60.0) as client:
    response = await client.post(
      f"{base_url.rstrip('/')}/chat/completions",
      headers=headers,
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
    "content": _get_openai_response_text(payload),
    "model_used": payload.get("model") or model,
    "tokens_used": int(usage.get("total_tokens") or 0),
  }


async def _call_anthropic(
  *,
  api_key: str,
  base_url: str,
  model: str,
  messages: list[dict[str, str]],
  max_tokens: int,
  temperature: float,
) -> dict[str, Any]:
  system_messages = [
    message.get("content", "").strip()
    for message in messages
    if message.get("role") == "system" and message.get("content", "").strip()
  ]
  anthropic_messages = [
    {
      "role": "assistant" if message.get("role") == "assistant" else "user",
      "content": message.get("content", ""),
    }
    for message in messages
    if message.get("role") in {"user", "assistant"} and message.get("content")
  ]

  async with httpx.AsyncClient(timeout=60.0) as client:
    response = await client.post(
      f"{base_url.rstrip('/')}/messages",
      headers={
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      json={
        "model": model,
        "messages": anthropic_messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        **({"system": "\n\n".join(system_messages)} if system_messages else {}),
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
      (error_detail or f"Anthropic request failed with status {response.status_code}.").strip()
    )

  if not isinstance(payload, dict):
    raise RuntimeError("Anthropic returned an unexpected response payload.")

  usage = payload.get("usage") or {}

  return {
    "content": _get_anthropic_response_text(payload),
    "model_used": payload.get("model") or model,
    "tokens_used": int(usage.get("input_tokens") or 0) + int(usage.get("output_tokens") or 0),
  }


async def call_model_api(
  *,
  protocol: str,
  api_key: str,
  base_url: str,
  model: str,
  messages: list[dict[str, str]],
  max_tokens: int,
  temperature: float,
  origin: str | None = None,
) -> dict[str, Any]:
  if protocol == "anthropic":
    return await _call_anthropic(
      api_key=api_key,
      base_url=base_url,
      model=model,
      messages=messages,
      max_tokens=max_tokens,
      temperature=temperature,
    )

  return await _call_openai_compatible(
    api_key=api_key,
    base_url=base_url,
    model=model,
    messages=messages,
    max_tokens=max_tokens,
    temperature=temperature,
    origin=origin,
  )
