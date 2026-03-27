from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
import os


DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "meta-llama/llama-3-70b-instruct"
DEFAULT_CORS_ORIGINS = (
  "http://localhost:3000",
  "http://127.0.0.1:3000",
)


@dataclass(frozen=True)
class Settings:
  openrouter_api_key: str
  openrouter_base_url: str
  default_model: str
  cors_origins: tuple[str, ...]


def _parse_env_file(file_path: Path) -> dict[str, str]:
  if not file_path.exists():
    return {}

  values: dict[str, str] = {}

  for raw_line in file_path.read_text(encoding="utf-8").splitlines():
    line = raw_line.strip()

    if not line or line.startswith("#") or "=" not in line:
      continue

    key, value = line.split("=", 1)
    key = key.strip()
    value = value.strip().strip("\"'")

    if key:
      values[key] = value

  return values


def _load_repo_env() -> dict[str, str]:
  root = Path(__file__).resolve().parents[2]
  candidates = (
    root / ".env.local",
    root / ".env",
    root.parent / ".env.local",
    root.parent / ".env",
  )

  values: dict[str, str] = {}

  for file_path in candidates:
    values.update(_parse_env_file(file_path))

  return values


def _get_env_value(name: str, fallback_name: str | None = None) -> str:
  direct_value = os.getenv(name, "").strip()

  if direct_value:
    return direct_value

  if fallback_name:
    fallback_value = os.getenv(fallback_name, "").strip()

    if fallback_value:
      return fallback_value

  repo_env = _load_repo_env()
  repo_value = repo_env.get(name, "").strip()

  if repo_value:
    return repo_value

  if fallback_name:
    repo_fallback = repo_env.get(fallback_name, "").strip()

    if repo_fallback:
      return repo_fallback

  return ""


def _parse_origins(raw_value: str) -> tuple[str, ...]:
  origins = tuple(
    item.strip()
    for item in raw_value.split(",")
    if item.strip()
  )

  return origins or DEFAULT_CORS_ORIGINS


@lru_cache(maxsize=1)
def get_settings() -> Settings:
  return Settings(
    openrouter_api_key=_get_env_value("OPENROUTER_API_KEY", "LLM_API_KEY"),
    openrouter_base_url=(
      _get_env_value("OPENROUTER_BASE_URL", "LLM_BASE_URL")
      or DEFAULT_OPENROUTER_BASE_URL
    ),
    default_model=_get_env_value("DEFAULT_MODEL") or DEFAULT_MODEL,
    cors_origins=_parse_origins(
      _get_env_value("FASTAPI_CORS_ORIGINS")
      or ",".join(DEFAULT_CORS_ORIGINS)
    ),
  )
