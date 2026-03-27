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

function toBackendUrl(pathname: string): string {
  const baseUrl = getBackendApiUrl().replace(/\/$/, "");
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${baseUrl}${path}`;
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

  try {
    response = await fetch(toBackendUrl("/api/chat"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-agent-router-client": clientId,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      const backendApiUrl = getConfiguredBackendApiUrl() || LOCAL_BACKEND_API_URL;

      throw new Error(
        `Unable to reach the backend at ${backendApiUrl}. Start it with "npm run dev" or "npm run backend:dev".`,
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
