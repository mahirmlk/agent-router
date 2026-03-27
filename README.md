# Agent Router

Agent Router is a split-stack local app for routing chat requests through a FastAPI backend and managing them from a Next.js dashboard.

## Stack

- `dashboard/`: Next.js 16, React 19, Tailwind CSS 4
- `backend/`: FastAPI, Uvicorn, LangGraph, HTTPX
- `scripts/`: PowerShell helpers for running the app on Windows

## Architecture

```text
Dashboard (Next.js) -> FastAPI (/api/chat, /api/health) -> LangGraph workflow -> OpenRouter
```

The dashboard stores local UI state such as provider settings and chat history in browser storage.  
The backend handles validation, shared-key limits, workflow orchestration, and upstream model requests.

## Project Structure

```text
agent-router/
|-- backend/              FastAPI app and workflow layer
|-- dashboard/            Next.js dashboard UI
|-- docs/                 Notes and project docs
|-- logs/                 Backend stdout/stderr logs
|-- scripts/              PowerShell run scripts
|-- .env.example          Example environment config
|-- package.json          Root script entrypoints
`-- README.md
```

## Main Routes

- `/`: overview dashboard
- `/chat`: dedicated chat window
- `/models`: model catalog
- `/history`: local request history
- `/providers`: provider configuration

## API

### `GET /api/health`

Used by the frontend or local checks to confirm the backend is reachable.

Example response:

```json
{
  "status": "ok",
  "llm_configured": true,
  "detail": "FastAPI backend is ready to accept chat requests."
}
```

### `POST /api/chat`

Example request:

```json
{
  "message": "Review this rollout plan.",
  "conversation_history": [
    { "role": "user", "content": "We are migrating auth flows." }
  ],
  "selected_model": "openai/gpt-4-turbo",
  "reasoning_effort": "high",
  "selected_provider": {
    "id": "openrouter",
    "label": "OpenRouter",
    "api_key": "",
    "base_url": "https://openrouter.ai/api/v1"
  },
  "attachments": [
    { "name": "plan.md", "content": "# notes", "type": "text/markdown" }
  ]
}
```

Example response:

```json
{
  "response": "Suggested rollout plan...",
  "metadata": {
    "model_used": "openai/gpt-4-turbo",
    "tier_name": "OpenRouter",
    "tokens_used": 1421
  }
}
```

## Setup

1. Install dashboard dependencies.

```bash
npm --prefix dashboard install
```

2. Install backend dependencies.

```bash
python -m pip install -r backend/requirements.txt
```

3. Create a repo-root `.env`.

```env
OPENROUTER_API_KEY=your-openrouter-api-key

# Optional
# OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
# Use the backend origin or /api/chat. Do not point this at /chat.
# NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
# FASTAPI_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://agent-router-rust.vercel.app
```

You can copy from `.env.example`.

## Run

Start the full stack from the repo root:

```bash
npm run dev
```

This starts:

- FastAPI on `http://127.0.0.1:8000`
- Next.js dashboard in development mode

## C4 Architecture

### Level 1: System Context

```text
User
  -> Agent Router
Agent Router
  -> OpenRouter
```

Agent Router is the system under design. Users interact with it through the browser dashboard, and the system sends routed model requests to OpenRouter.

### Level 2: Containers

```text
Browser
  -> Next.js dashboard container
  -> FastAPI backend container
  -> OpenRouter API
```

- The browser runs the dashboard UI and keeps chat history and provider preferences in local storage.
- The Next.js dashboard container renders the interface and issues HTTP requests to the backend.
- The FastAPI backend container exposes `/api/health` and `/api/chat`, validates requests, applies routing settings, and orchestrates model calls.
- OpenRouter is the external LLM gateway used for upstream model inference.

### Level 3: Backend Components

```text
dashboard/src/lib/api/backend.ts
  -> backend/app/main.py
  -> backend/app/services/chat.py
  -> backend/app/graph/workflow.py
  -> backend/app/services/openrouter.py
```

- `dashboard/src/lib/api/backend.ts` builds backend URLs and sends browser requests with the client identifier.
- `backend/app/main.py` defines the FastAPI app, CORS policy, and HTTP endpoints.
- `backend/app/services/chat.py` handles request processing, client extraction, and response shaping.
- `backend/app/graph/workflow.py` prepares conversation state, applies reasoning settings, and runs the LangGraph-or-sequential workflow.
- `backend/app/services/openrouter.py` performs the outbound OpenRouter request and normalizes the model response.

### Level 4: Request Flow

```text
User submits prompt
  -> Next.js dashboard serializes message, history, provider, attachments
  -> FastAPI /api/chat receives request
  -> chat service resolves client context and settings
  -> workflow prepares prompt and generation parameters
  -> OpenRouter is called
  -> response metadata is normalized
  -> dashboard renders the assistant reply
```

## Scripts

- `npm run dev`: run FastAPI in the background and start the dashboard in dev mode
- `npm run start`: run FastAPI in the background and start the production dashboard
- `npm run build`: build the dashboard
- `npm run dashboard:dev`: run the Next.js dashboard only
- `npm run dashboard:build`: build the dashboard only
- `npm run dashboard:start`: start the built dashboard only
- `npm run backend:dev`: run the FastAPI backend with reload
- `npm run backend:start`: run the FastAPI backend without reload

## Environment Notes

- The frontend calls the backend directly from the browser.
- Default backend URL is `http://127.0.0.1:8000`.
- Default allowed frontend origins are `http://localhost:3000` and `http://127.0.0.1:3000`.
- If no shared `OPENROUTER_API_KEY` is configured, users can still provide their own provider key in the dashboard.

## Troubleshooting

### Unable to fetch from localhost

If the dashboard says it cannot fetch from localhost:

1. Make sure the backend dependencies are installed:

```bash
python -m pip install -r backend/requirements.txt
```

2. Start the backend directly:

```bash
npm run backend:dev
```

3. Confirm the health endpoint responds at:

```text
http://127.0.0.1:8000/api/health
```

4. Check backend logs if startup fails:

- `logs/backend.out.log`
- `logs/backend.err.log`

### Missing OpenRouter key

If `/api/chat` returns a configuration error, set `OPENROUTER_API_KEY` in the repo `.env` or add a provider key from the Providers page.
