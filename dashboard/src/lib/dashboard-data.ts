export type Difficulty = "SIMPLE" | "INTERMEDIATE" | "HARD";
export type RoutePresetId = "balanced" | "economy" | "quality";

export interface MessageMetadata {
  difficulty: Difficulty;
  model_used: string;
  tier_name: string;
  tokens_used: number;
}

export interface TierModel {
  id: string;
  name: string;
  provider: string;
  cost: string;
  context: string;
  latency: string;
  reliability: string;
  strength: string;
}

export interface ModelTier {
  name: string;
  difficulty: Difficulty;
  summary: string;
  accent: string;
  badge: string;
  avgLatency: string;
  coverage: string;
  models: TierModel[];
}

export interface RoutePreset {
  id: RoutePresetId;
  label: string;
  description: string;
  focus: string;
}

export interface RoutePrediction {
  difficulty: Difficulty;
  confidence: string;
  rationale: string;
  tier: ModelTier;
  model: TierModel;
}

export interface RouteHistoryItem {
  id: string;
  query: string;
  responsePreview?: string;
  difficulty: Difficulty;
  model: string;
  provider: string;
  tokens: number;
  latency: number;
  cost: number;
  preset: RoutePresetId;
  outcome: string;
  createdAt: string;
  tags: string[];
}

export const routePresets: RoutePreset[] = [
  {
    id: "balanced",
    label: "Balanced",
    description: "Best overall mix of latency, quality, and spend.",
    focus: "Default operating mode for mixed workloads.",
  },
  {
    id: "economy",
    label: "Economy",
    description: "Bias toward low-cost models for everyday requests.",
    focus: "Ideal for high-volume support, ops, and documentation.",
  },
  {
    id: "quality",
    label: "Quality",
    description: "Push harder toward richer reasoning and longer context.",
    focus: "Best for debugging, architecture, and strategic work.",
  },
];

export const modelTiers: ModelTier[] = [
  {
    name: "Simple",
    difficulty: "SIMPLE",
    summary: "Fast responses for facts, summarization, classification, and small rewrites.",
    accent: "from-slate-700 via-slate-800 to-zinc-900",
    badge: "Operational core",
    avgLatency: "0.7s",
    coverage: "62% of daily traffic",
    models: [
      {
        id: "meta-llama/llama-3-70b-instruct",
        name: "Llama 3 70B",
        provider: "Meta",
        cost: "Primary",
        context: "8K",
        latency: "Fast",
        reliability: "High",
        strength: "Short requests, greetings, and direct answers",
      },
    ],
  },
  {
    name: "Intermediate",
    difficulty: "INTERMEDIATE",
    summary: "Reasoning-focused models for coding, analysis, and multi-step composition.",
    accent: "from-zinc-700 via-slate-800 to-slate-900",
    badge: "Reasoning tier",
    avgLatency: "1.6s",
    coverage: "28% of daily traffic",
    models: [
      {
        id: "meta-llama/llama-3-70b-instruct",
        name: "Llama 3 70B",
        provider: "Meta",
        cost: "$0.59/M",
        context: "8K",
        latency: "Moderate",
        reliability: "High",
        strength: "Coding, transformations, and detailed explanations",
      },
      {
        id: "mistralai/mixtral-8x7b-instruct",
        name: "Mixtral 8x7B",
        provider: "Mistral",
        cost: "$0.24/M",
        context: "32K",
        latency: "Moderate",
        reliability: "Stable",
        strength: "Longer context and cost-efficient reasoning",
      },
      {
        id: "google/gemma-2-27b-it",
        name: "Gemma 2 27B",
        provider: "Google",
        cost: "$0.27/M",
        context: "8K",
        latency: "Moderate",
        reliability: "Stable",
        strength: "Controlled tone and consistent logic chains",
      },
    ],
  },
  {
    name: "Hard",
    difficulty: "HARD",
    summary: "Premium models for complex planning, deep debugging, and high-stakes outputs.",
    accent: "from-black via-zinc-900 to-slate-800",
    badge: "Premium tier",
    avgLatency: "3.4s",
    coverage: "10% of daily traffic",
    models: [
      {
        id: "anthropic/claude-3.5-sonnet",
        name: "Claude 3.5 Sonnet",
        provider: "Anthropic",
        cost: "$3.00/M",
        context: "200K",
        latency: "Moderate",
        reliability: "High",
        strength: "Long-form reasoning and product writing",
      },
      {
        id: "openai/gpt-4-turbo",
        name: "GPT-4 Turbo",
        provider: "OpenAI",
        cost: "$10.00/M",
        context: "128K",
        latency: "Measured",
        reliability: "Very high",
        strength: "Complex debugging, tool use, and synthesis",
      },
      {
        id: "google/gemini-pro-1.5",
        name: "Gemini Pro 1.5",
        provider: "Google",
        cost: "$3.50/M",
        context: "1M",
        latency: "Measured",
        reliability: "High",
        strength: "Massive context and research-heavy prompts",
      },
    ],
  },
];

export const quickPrompts = [
  "Draft an API integration plan for a multi-tenant SaaS feature.",
  "Summarize the latest sprint blockers into a concise leadership update.",
  "Compare a browser-to-FastAPI call and a server-side proxy for an internal tooling workflow.",
  "Review this incident and suggest a routing strategy that cuts cost without hurting quality.",
];

export const composerAssistChips = [
  "Need citations",
  "Code-first answer",
  "Keep it concise",
  "Risk review",
];

export const featureHighlights = [
  {
    title: "Live route preview",
    detail: "Predicts the likely tier and model before a request is sent.",
  },
  {
    title: "Local session memory",
    detail: "Keeps recent routing history in the browser for quick review.",
  },
  {
    title: "Preset-aware routing",
    detail: "Switch between balanced, economy, and quality operating modes.",
  },
];

const historyBaseTime = "2026-03-26T12:00:00.000Z";

export const sampleHistory: RouteHistoryItem[] = [
  {
    id: "sample-1",
    query: "What is the capital of France?",
    difficulty: "SIMPLE",
    model: "google/gemma-2-9b-it:free",
    provider: "Google",
    tokens: 42,
    latency: 0.8,
    cost: 0,
    preset: "economy",
    outcome: "Delivered a direct factual answer with zero-cost routing.",
    createdAt: new Date(new Date(historyBaseTime).getTime() - 2 * 60_000).toISOString(),
    tags: ["fact lookup", "low latency"],
  },
  {
    id: "sample-2",
    query: "Write a recursive Fibonacci function in Python with memoization.",
    difficulty: "INTERMEDIATE",
    model: "meta-llama/llama-3-70b-instruct",
    provider: "Meta",
    tokens: 287,
    latency: 1.4,
    cost: 0.0002,
    preset: "balanced",
    outcome: "Generated working code with explanation and complexity notes.",
    createdAt: new Date(new Date(historyBaseTime).getTime() - 5 * 60_000).toISOString(),
    tags: ["coding", "reasoning"],
  },
  {
    id: "sample-3",
    query: "Explain the implications of Godel's incompleteness theorems on AI consciousness.",
    difficulty: "HARD",
    model: "anthropic/claude-3.5-sonnet",
    provider: "Anthropic",
    tokens: 1243,
    latency: 3.2,
    cost: 0.004,
    preset: "quality",
    outcome: "Used the premium tier for high-context philosophical analysis.",
    createdAt: new Date(new Date(historyBaseTime).getTime() - 12 * 60_000).toISOString(),
    tags: ["deep analysis", "premium"],
  },
  {
    id: "sample-4",
    query: "Summarize this product feedback thread into launch themes.",
    difficulty: "SIMPLE",
    model: "mistralai/mistral-7b-instruct:free",
    provider: "Mistral",
    tokens: 156,
    latency: 0.9,
    cost: 0,
    preset: "balanced",
    outcome: "Extracted major themes and grouped them by urgency.",
    createdAt: new Date(new Date(historyBaseTime).getTime() - 18 * 60_000).toISOString(),
    tags: ["summarization", "product ops"],
  },
  {
    id: "sample-5",
    query: "Build a FastAPI route with token-based authentication.",
    difficulty: "HARD",
    model: "openai/gpt-4-turbo",
    provider: "OpenAI",
    tokens: 2104,
    latency: 4.1,
    cost: 0.021,
    preset: "quality",
    outcome: "Selected the highest-capability route for architecture and code generation.",
    createdAt: new Date(new Date(historyBaseTime).getTime() - 25 * 60_000).toISOString(),
    tags: ["architecture", "fastapi"],
  },
  {
    id: "sample-6",
    query: "Translate 'hello' to Spanish.",
    difficulty: "SIMPLE",
    model: "google/gemma-2-9b-it:free",
    provider: "Google",
    tokens: 18,
    latency: 0.5,
    cost: 0,
    preset: "economy",
    outcome: "Handled instantly on the free tier.",
    createdAt: new Date(new Date(historyBaseTime).getTime() - 31 * 60_000).toISOString(),
    tags: ["translation", "zero cost"],
  },
];

function difficultyWeight(difficulty: Difficulty): number {
  if (difficulty === "HARD") {
    return 3;
  }

  if (difficulty === "INTERMEDIATE") {
    return 2;
  }

  return 1;
}

export function predictDifficulty(input: string): Difficulty {
  const trimmed = input.trim().toLowerCase();
  const words = trimmed.split(/\s+/).filter(Boolean);

  if (!trimmed) {
    return "SIMPLE";
  }

  let score = 0;

  const hardSignals = [
    "architecture",
    "strategy",
    "debug",
    "debugging",
    "system design",
    "roadmap",
    "theorem",
    "philosophy",
    "research",
    "multi-step",
    "production",
    "incident",
  ];

  const intermediateSignals = [
    "build",
    "write",
    "compare",
    "implement",
    "explain",
    "analyze",
    "review",
    "generate",
    "function",
    "api",
    "database",
    "refactor",
    "summarize",
  ];

  for (const signal of hardSignals) {
    if (trimmed.includes(signal)) {
      score += 3;
    }
  }

  for (const signal of intermediateSignals) {
    if (trimmed.includes(signal)) {
      score += 1.5;
    }
  }

  if (words.length > 30) {
    score += 2;
  } else if (words.length > 14) {
    score += 1;
  }

  if (trimmed.includes("?")) {
    score += 0.5;
  }

  if (score >= 5) {
    return "HARD";
  }

  if (score >= 2) {
    return "INTERMEDIATE";
  }

  return "SIMPLE";
}

export function getTierByDifficulty(difficulty: Difficulty): ModelTier {
  return modelTiers.find((tier) => tier.difficulty === difficulty) ?? modelTiers[0];
}

export function getPresetById(id: RoutePresetId): RoutePreset {
  return routePresets.find((preset) => preset.id === id) ?? routePresets[0];
}

export function predictRoute(
  input: string,
  presetId: RoutePresetId,
): RoutePrediction {
  const difficulty = predictDifficulty(input);
  const tier = getTierByDifficulty(difficulty);
  const preset = getPresetById(presetId);
  const models = tier.models;

  let model = models[0];

  if (preset.id === "balanced") {
    model = models[Math.min(1, models.length - 1)];
  }

  if (preset.id === "quality") {
    model = models[models.length - 1];
  }

  const confidenceBase = 95 - difficultyWeight(difficulty) * 6;

  return {
    difficulty,
    confidence: `${confidenceBase}%`,
    rationale:
      preset.id === "quality"
        ? "Preset pushes the router toward stronger reasoning and longer context."
        : preset.id === "economy"
          ? "Preset prefers efficient models unless the prompt strongly signals complexity."
          : "Preset keeps cost, quality, and response time in balance.",
    tier,
    model,
  };
}

export function formatCurrency(value: number): string {
  return value === 0 ? "$0.000" : `$${value.toFixed(value < 0.01 ? 4 : 3)}`;
}

export function formatLatency(value: number): string {
  return `${value.toFixed(1)}s`;
}

export function formatRelativeTime(isoDate: string): string {
  const deltaMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.max(1, Math.round(deltaMs / 60_000));

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.round(hours / 24);
  return `${days} day ago`;
}
