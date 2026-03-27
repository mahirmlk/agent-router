"use client";

export type ProviderId = string;
export type ProviderProtocol = "openai" | "anthropic";

export interface ProviderConfig {
  id: ProviderId;
  label: string;
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
  models: string[];
  protocol: ProviderProtocol;
}

export const PROVIDERS_STORAGE_KEY = "agent-router-providers-v2";
export const CHAT_PROVIDER_SELECTION_KEY = "agent-router-chat-provider-selection-v2";

export interface ChatProviderSelection {
  providerId: ProviderId;
  modelId: string;
  effort: "low" | "medium" | "high";
}

export function providerRequiresApiKey(provider: Pick<ProviderConfig, "id">): boolean {
  return provider.id !== "openrouter";
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
      "openai/gpt-4o-mini",
      "anthropic/claude-3.5-sonnet",
      "qwen/qwen-2.5-72b-instruct",
    ],
  },
  {
    id: "openai",
    label: "OpenAI",
    apiKey: "",
    baseUrl: "https://api.openai.com/v1",
    enabled: false,
    protocol: "openai",
    models: [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4.1",
      "gpt-4.1-mini",
    ],
  },
  {
    id: "anthropic",
    label: "Anthropic",
    apiKey: "",
    baseUrl: "https://api.anthropic.com/v1",
    enabled: false,
    protocol: "anthropic",
    models: [
      "claude-3-5-sonnet-latest",
      "claude-3-5-haiku-latest",
      "claude-3-opus-latest",
    ],
  },
  {
    id: "qwen",
    label: "Qwen",
    apiKey: "",
    baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    enabled: false,
    protocol: "openai",
    models: [
      "qwen-plus",
      "qwen-turbo",
      "qwen-max",
    ],
  },
  {
    id: "groq",
    label: "Groq",
    apiKey: "",
    baseUrl: "https://api.groq.com/openai/v1",
    enabled: false,
    protocol: "openai",
    models: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "mixtral-8x7b-32768",
    ],
  },
  {
    id: "together",
    label: "Together",
    apiKey: "",
    baseUrl: "https://api.together.xyz/v1",
    enabled: false,
    protocol: "openai",
    models: [
      "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      "Qwen/Qwen2.5-72B-Instruct-Turbo",
      "mistralai/Mixtral-8x7B-Instruct-v0.1",
    ],
  },
  {
    id: "fireworks",
    label: "Fireworks",
    apiKey: "",
    baseUrl: "https://api.fireworks.ai/inference/v1",
    enabled: false,
    protocol: "openai",
    models: [
      "accounts/fireworks/models/llama-v3p1-70b-instruct",
      "accounts/fireworks/models/qwen2p5-72b-instruct",
      "accounts/fireworks/models/mixtral-8x7b-instruct",
    ],
  },
  {
    id: "mistral",
    label: "Mistral",
    apiKey: "",
    baseUrl: "https://api.mistral.ai/v1",
    enabled: false,
    protocol: "openai",
    models: [
      "mistral-large-latest",
      "ministral-8b-latest",
      "open-mistral-nemo",
    ],
  },
  {
    id: "xai",
    label: "xAI",
    apiKey: "",
    baseUrl: "https://api.x.ai/v1",
    enabled: false,
    protocol: "openai",
    models: [
      "grok-2",
      "grok-2-mini",
    ],
  },
  {
    id: "custom-openai",
    label: "Custom OpenAI-Compatible",
    apiKey: "",
    baseUrl: "",
    enabled: false,
    protocol: "openai",
    models: [
      "your-model-id",
    ],
  },
  {
    id: "custom-anthropic",
    label: "Custom Anthropic-Compatible",
    apiKey: "",
    baseUrl: "",
    enabled: false,
    protocol: "anthropic",
    models: [
      "your-model-id",
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

    const mergedDefaults = defaultProviderConfigs.map((provider) => {
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
        protocol: saved.protocol === "anthropic" ? "anthropic" : provider.protocol,
      };
    });

    const defaultIds = new Set(defaultProviderConfigs.map((provider) => provider.id));
    const savedExtras = parsed.filter((provider) => !defaultIds.has(provider.id));

    return [...mergedDefaults, ...savedExtras];
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
