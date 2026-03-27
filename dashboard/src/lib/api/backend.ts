import type { MessageMetadata } from "@/lib/dashboard-data";

export interface BackendChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface BackendChatAttachment {
  name: string;
  content: string;
  type: string;
}

export interface BackendChatProvider {
  id: string;
  label: string;
  api_key: string;
  base_url: string;
  protocol: "openai" | "anthropic";
}

export interface BackendChatRequest {
  message: string;
  conversation_history: BackendChatHistoryItem[];
  selected_model: string;
  selected_provider: BackendChatProvider;
  reasoning_effort: "low" | "medium" | "high";
  attachments: BackendChatAttachment[];
}

export interface BackendChatResponse {
  response?: string;
  metadata?: Partial<MessageMetadata>;
}

const LOCAL_BACKEND_API_URL = "http://127.0.0.1:8000";
const CHAT_API_PATH = "/api/chat";

function getConfiguredBackendApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    ""
  );
}

function getBackendApiUrl(): string {
  const configuredUrl = getConfiguredBackendApiUrl();

  if (configuredUrl) {
    return configuredUrl;
  }

  if (process.env.NODE_ENV !== "production") {
    return LOCAL_BACKEND_API_URL;
  }

  throw new Error(
    "Backend URL is not configured for this deployment. Set NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_API_URL to your backend URL.",
  );
}

function resolveConfiguredChatUrl(configuredUrl: string): string {
  const normalizedUrl = configuredUrl.trim();

  try {
    const parsedUrl = new URL(normalizedUrl);
    const normalizedPath = parsedUrl.pathname.replace(/\/+$/, "") || "/";

    if (
      normalizedPath === "/" ||
      normalizedPath === "/api" ||
      normalizedPath === "/chat"
    ) {
      parsedUrl.pathname = CHAT_API_PATH;
      return parsedUrl.toString();
    }

    if (normalizedPath === CHAT_API_PATH) {
      parsedUrl.pathname = CHAT_API_PATH;
      return parsedUrl.toString();
    }

    parsedUrl.pathname = `${normalizedPath}${CHAT_API_PATH}`;
    return parsedUrl.toString();
  } catch {
    const baseUrl = normalizedUrl.replace(/\/+$/, "");

    if (
      baseUrl.endsWith(CHAT_API_PATH) ||
      baseUrl.endsWith("/chat") ||
      baseUrl.endsWith("/api")
    ) {
      return `${baseUrl.replace(/(\/chat|\/api|\/api\/chat)$/, "")}${CHAT_API_PATH}`;
    }

    return `${baseUrl}${CHAT_API_PATH}`;
  }
}

function getChatApiUrl(): string {
  return resolveConfiguredChatUrl(getBackendApiUrl());
}

async function parseBackendResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return {
    detail: (await response.text()) || "Unexpected response from the FastAPI backend.",
  };
}

export async function sendChatRequest(
  payload: BackendChatRequest,
  clientId: string,
): Promise<BackendChatResponse> {
  let response: Response;
  const chatApiUrl = getChatApiUrl();

  try {
    response = await fetch(chatApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-agent-router-client": clientId,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      const backendApiUrl = getConfiguredBackendApiUrl() || chatApiUrl;

      throw new Error(
        `Unable to reach the backend at ${backendApiUrl}. The frontend expects the chat endpoint at ${chatApiUrl}.`,
      );
    }

    throw error;
  }

  const data = await parseBackendResponse(response);

  if (!response.ok) {
    const detail =
      typeof data === "object" &&
      data !== null &&
      "detail" in data &&
      typeof (data as { detail?: unknown }).detail === "string" &&
      (data as { detail: string }).detail.trim()
        ? (data as { detail: string }).detail
        : `Request failed with status ${response.status}.`;

    throw new Error(detail);
  }

  return data as BackendChatResponse;
}
