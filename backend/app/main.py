from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .schemas import ChatRequest, ChatResponse, HealthResponse
from .services.chat import extract_client_id, process_chat_request


settings = get_settings()

app = FastAPI(
  title="Agent Router Backend",
  version="1.0.0",
)

app.add_middleware(
  CORSMiddleware,
  allow_origins=settings.cors_origins,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
  configured = bool(settings.openrouter_api_key)

  return HealthResponse(
    status="ok" if configured else "degraded",
    llm_configured=configured,
    detail=(
      "FastAPI backend is ready to accept chat requests."
      if configured
      else "Missing OpenRouter API key. Set OPENROUTER_API_KEY in the repo .env file."
    ),
  )


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, http_request: Request) -> ChatResponse:
  return await process_chat_request(
    request,
    client_id=extract_client_id(http_request.headers),
    origin=http_request.headers.get("origin"),
  )
