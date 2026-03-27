"use client";

export type ProviderId = "openrouter";

export interface ProviderConfig {
  id: ProviderId;
  label: string;
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
  models: string[];
  protocol: "openai" | "anthropic";
}

export const PROVIDERS_STORAGE_KEY = "agent-router-providers-v2";
export const CHAT_PROVIDER_SELECTION_KEY = "agent-router-chat-provider-selection-v2";

export interface ChatProviderSelection {
  providerId: ProviderId;
  modelId: string;
  effort: "low" | "medium" | "high";
}

export const defaultProviderConfigs: ProviderConfig[] = [
  {
    id: "openrouter",
    label: "OpenRouter",
    apiKey: "",
    baseUrl: "https://openrouter.ai/api/v1",
    enabled: true,
    protocol: "openai",
    models: [
      "meta-llama/llama-3-70b-instruct",
      "openai/gpt-4-turbo",
      "anthropic/claude-3.5-sonnet",
    ],
  },
];

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadProviderConfigs(): ProviderConfig[] {
  if (!canUseStorage()) {
    return defaultProviderConfigs;
  }

  try {
    const raw = window.localStorage.getItem(PROVIDERS_STORAGE_KEY);

    if (!raw) {
      return defaultProviderConfigs;
    }

    const parsed = JSON.parse(raw) as ProviderConfig[];

    return defaultProviderConfigs.map((provider) => {
      const saved = parsed.find((item) => item.id === provider.id);

      if (!saved) {
        return provider;
      }

      return {
        ...provider,
        ...saved,
        models: Array.isArray(saved.models) && saved.models.length > 0
          ? saved.models
          : provider.models,
      };
    });
  } catch {
    return defaultProviderConfigs;
  }
}

export function saveProviderConfigs(configs: ProviderConfig[]): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(PROVIDERS_STORAGE_KEY, JSON.stringify(configs));
}

export function loadChatProviderSelection(): ChatProviderSelection {
  if (!canUseStorage()) {
    return {
      providerId: "openrouter",
      modelId: "meta-llama/llama-3-70b-instruct",
      effort: "medium",
    };
  }

  try {
    const raw = window.localStorage.getItem(CHAT_PROVIDER_SELECTION_KEY);

    if (!raw) {
      return {
        providerId: "openrouter",
        modelId: "meta-llama/llama-3-70b-instruct",
        effort: "medium",
      };
    }

    const parsed = JSON.parse(raw) as Partial<ChatProviderSelection>;

    return {
      providerId: parsed.providerId ?? "openrouter",
      modelId: parsed.modelId ?? "meta-llama/llama-3-70b-instruct",
      effort: parsed.effort ?? "medium",
    };
  } catch {
    return {
      providerId: "openrouter",
      modelId: "meta-llama/llama-3-70b-instruct",
      effort: "medium",
    };
  }
}

export function saveChatProviderSelection(selection: ChatProviderSelection): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    CHAT_PROVIDER_SELECTION_KEY,
    JSON.stringify(selection),
  );
}
