from __future__ import annotations

from functools import lru_cache
from typing import TypedDict

from ..config import Settings
from ..schemas import ChatAttachment, ChatRequest
from ..services.openrouter import call_model_api


DEFAULT_SIMPLE_MODEL_MAX_TOKENS = 768


class ChatWorkflowState(TypedDict, total=False):
  request: ChatRequest
  settings: Settings
  client_origin: str | None
  api_key: str
  base_url: str
  provider_protocol: str
  using_custom_key: bool
  selected_model: str
  provider_label: str
  messages: list[dict[str, str]]
  max_tokens: int
  temperature: float
  response_text: str
  model_used: str
  tokens_used: int


class SequentialChatWorkflow:
  async def ainvoke(self, state: ChatWorkflowState) -> ChatWorkflowState:
    prepared_state = {
      **state,
      **_prepare_request(state),
    }
    model_state = {
      **prepared_state,
      **await _invoke_model(prepared_state),
    }

    return {
      **model_state,
      **_finalize_response(model_state),
    }


def _append_attachments_to_message(
  message: str,
  attachments: list[ChatAttachment],
) -> str:
  if not attachments:
    return message

  sections: list[str] = []

  for attachment in attachments:
    name = (attachment.name or "").strip() or "attachment"
    content = (attachment.content or "").strip()
    sections.append(
      f"Attachment: {name}\n{content}" if content else f"Attachment: {name}"
    )

  return f"{message}\n\n" + "\n\n".join(sections)


def _resolve_generation_settings(
  reasoning_effort: str | None,
  selected_model: str,
  using_custom_key: bool,
  default_model: str,
) -> dict[str, float | int]:
  max_tokens = 4096
  temperature = 0.7

  if reasoning_effort == "low":
    max_tokens = 2048
    temperature = 0.4
  elif reasoning_effort == "high":
    max_tokens = 6144

  if not using_custom_key and selected_model == default_model:
    max_tokens = min(max_tokens, DEFAULT_SIMPLE_MODEL_MAX_TOKENS)

  return {
    "max_tokens": max_tokens,
    "temperature": temperature,
  }


def _prepare_request(state: ChatWorkflowState) -> ChatWorkflowState:
  request = state["request"]
  settings = state["settings"]
  provider = request.selected_provider
  custom_api_key = ((provider.api_key if provider else "") or "").strip()
  custom_base_url = ((provider.base_url if provider else "") or "").strip()
  provider_protocol = ((provider.protocol if provider else "") or "openai").strip().lower() or "openai"
  using_custom_key = bool(custom_api_key)
  selected_model = (request.selected_model or settings.default_model).strip() or settings.default_model
  generation_settings = _resolve_generation_settings(
    request.reasoning_effort,
    selected_model,
    using_custom_key,
    settings.default_model,
  )

  return {
    "api_key": custom_api_key or state["api_key"],
    "base_url": custom_base_url or state["base_url"],
    "provider_protocol": provider_protocol,
    "using_custom_key": using_custom_key,
    "selected_model": selected_model,
    "provider_label": ((provider.label if provider else "") or "OpenRouter").strip(),
    "messages": [
      {
        "role": item.role,
        "content": item.content,
      }
      for item in request.conversation_history
    ]
    + [
      {
        "role": "user",
        "content": _append_attachments_to_message(
          request.message.strip(),
          request.attachments,
        ),
      }
    ],
    "max_tokens": int(generation_settings["max_tokens"]),
    "temperature": float(generation_settings["temperature"]),
  }


async def _invoke_model(state: ChatWorkflowState) -> ChatWorkflowState:
  result = await call_model_api(
    protocol=str(state.get("provider_protocol") or "openai"),
    api_key=state["api_key"],
    base_url=state["base_url"],
    model=state["selected_model"],
    messages=state["messages"],
    max_tokens=state["max_tokens"],
    temperature=state["temperature"],
    origin=state.get("client_origin"),
  )

  return {
    "response_text": result["content"],
    "model_used": result["model_used"],
    "tokens_used": result["tokens_used"],
  }


def _finalize_response(state: ChatWorkflowState) -> ChatWorkflowState:
  return {
    "response_text": (state.get("response_text") or "").strip() or "No response",
    "model_used": state.get("model_used") or state["selected_model"],
    "provider_label": state.get("provider_label") or "OpenRouter",
    "tokens_used": int(state.get("tokens_used") or 0),
  }


@lru_cache(maxsize=1)
def get_chat_workflow():
  try:
    from langgraph.graph import END, START, StateGraph
  except ModuleNotFoundError:
    return SequentialChatWorkflow()

  graph = StateGraph(ChatWorkflowState)
  graph.add_node("prepare_request", _prepare_request)
  graph.add_node("invoke_model", _invoke_model)
  graph.add_node("finalize_response", _finalize_response)
  graph.add_edge(START, "prepare_request")
  graph.add_edge("prepare_request", "invoke_model")
  graph.add_edge("invoke_model", "finalize_response")
  graph.add_edge("finalize_response", END)
  return graph.compile()
