"use client";

import Link from "next/link";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  appendHistoryItem,
  loadComposerDraft,
  loadStoredHistory,
  saveComposerDraft,
} from "@/lib/history-storage";
import {
  formatRelativeTime,
  predictRoute,
  type MessageMetadata,
  type RouteHistoryItem,
  type RoutePresetId,
} from "@/lib/dashboard-data";
import {
  loadChatProviderSelection,
  loadProviderConfigs,
  saveChatProviderSelection,
  type ProviderConfig,
  type ProviderId,
} from "@/lib/provider-storage";
import { sendChatRequest } from "@/lib/api/backend";
import {
  Bot,
  Cpu,
  FileText,
  Link2,
  Loader2,
  MessageSquarePlus,
  Paperclip,
  Search,
  Send,
  Settings2,
  Sparkles,
  User,
  X,
} from "lucide-react";
import MarkdownPreview, { markdownToPreviewText } from "@/components/MarkdownPreview";

interface MessageAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface AttachmentDraft extends MessageAttachment {
  content: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: MessageAttachment[];
  metadata?: MessageMetadata;
}

interface LiveReply {
  full: string;
  current: string;
  metadata: MessageMetadata;
}

interface ModelOption {
  providerId: ProviderId;
  providerLabel: string;
  modelId: string;
}

const DEFAULT_MODEL = "meta-llama/llama-3-70b-instruct";
const CLIENT_ID_STORAGE_KEY = "agent-router-client-id-v1";
const TEXT_ATTACHMENT_EXTENSIONS = [
  ".txt",
  ".md",
  ".json",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".py",
  ".css",
  ".html",
  ".xml",
  ".csv",
  ".yaml",
  ".yml",
];
const PREVIEW_CLAMP_STYLE = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical" as const,
  overflow: "hidden",
};

function createId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getClientId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  const existing = window.localStorage.getItem(CLIENT_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const created = createId();
  window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, created);
  return created;
}

function humanizeModelId(modelId: string): string {
  const tail = modelId.includes("/") ? modelId.split("/").at(-1) ?? modelId : modelId;

  return tail
    .replace(/claude/gi, "Claude")
    .replace(/gpt/gi, "GPT")
    .replace(/llama/gi, "Llama")
    .replace(/gemma/gi, "Gemma")
    .replace(/mixtral/gi, "Mixtral")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

function getPresetFromEffort(effort: "low" | "medium" | "high"): RoutePresetId {
  if (effort === "low") {
    return "economy";
  }

  if (effort === "high") {
    return "quality";
  }

  return "balanced";
}

function canInlineAttachment(file: File): boolean {
  if (file.type.startsWith("text/")) {
    return true;
  }

  const lowerName = file.name.toLowerCase();
  return TEXT_ATTACHMENT_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

function getAvailableProviders(configs: ProviderConfig[]): ProviderConfig[] {
  const enabled = configs.filter((provider) => provider.enabled);

  if (enabled.length > 0) {
    return enabled;
  }

  return configs.filter((provider) => provider.id === "openrouter").slice(0, 1);
}

function getModelOptions(configs: ProviderConfig[]): ModelOption[] {
  return configs.flatMap((provider) =>
    provider.models.map((modelId) => ({
      providerId: provider.id,
      providerLabel: provider.label,
      modelId,
    })),
  );
}

export default function ChatWorkspace() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<RouteHistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [liveReply, setLiveReply] = useState<LiveReply | null>(null);
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<ProviderId>("openrouter");
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL);
  const [effort, setEffort] = useState<"low" | "medium" | "high">("medium");
  const deferredSearch = useDeferredValue(search);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInput(loadComposerDraft());
    setHistoryItems(loadStoredHistory());

    const storedProviders = loadProviderConfigs();
    const availableProviders = getAvailableProviders(storedProviders);
    const storedSelection = loadChatProviderSelection();
    const availableModels = getModelOptions(availableProviders);
    const selectedOption =
      availableModels.find(
        (option) =>
          option.providerId === storedSelection.providerId &&
          option.modelId === storedSelection.modelId,
      ) ?? availableModels[0];

    setProviders(storedProviders);

    if (selectedOption) {
      setSelectedProviderId(selectedOption.providerId);
      setSelectedModelId(selectedOption.modelId);
    }

    setEffort(storedSelection.effort);
  }, []);

  const availableProviders = useMemo(() => getAvailableProviders(providers), [providers]);
  const availableModels = useMemo(
    () => getModelOptions(availableProviders),
    [availableProviders],
  );

  useEffect(() => {
    if (availableProviders.length === 0) {
      return;
    }

    const providerExists = availableProviders.some(
      (provider) => provider.id === selectedProviderId,
    );

    if (!providerExists) {
      const fallbackProvider = availableProviders[0];
      setSelectedProviderId(fallbackProvider.id);
      setSelectedModelId(fallbackProvider.models[0] ?? DEFAULT_MODEL);
      return;
    }

    const providerModels =
      availableProviders.find((provider) => provider.id === selectedProviderId)?.models ?? [];

    if (!providerModels.includes(selectedModelId)) {
      setSelectedModelId(providerModels[0] ?? DEFAULT_MODEL);
    }
  }, [availableProviders, selectedModelId, selectedProviderId]);

  useEffect(() => {
    saveComposerDraft(input);
  }, [input]);

  useEffect(() => {
    saveChatProviderSelection({
      providerId: selectedProviderId,
      modelId: selectedModelId,
      effort,
    });
  }, [effort, selectedModelId, selectedProviderId]);

  useEffect(() => {
    if (!inputRef.current) {
      return;
    }

    inputRef.current.style.height = "0px";
    inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 220)}px`;
  }, [input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [loading, messages, liveReply?.current]);

  useEffect(() => {
    if (!liveReply) {
      return;
    }

    if (liveReply.current.length >= liveReply.full.length) {
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content: liveReply.full,
          metadata: liveReply.metadata,
        },
      ]);
      setLiveReply(null);
      return;
    }

    const step = Math.max(18, Math.ceil(liveReply.full.length / 28));
    const timer = window.setTimeout(() => {
      setLiveReply((current) => {
        if (!current) {
          return null;
        }

        return {
          ...current,
          current: current.full.slice(
            0,
            Math.min(current.full.length, current.current.length + step),
          ),
        };
      });
    }, 28);

    return () => window.clearTimeout(timer);
  }, [liveReply]);

  const activeProvider =
    availableProviders.find((provider) => provider.id === selectedProviderId) ??
    availableProviders[0];

  const activeProviderModels = activeProvider?.models ?? [DEFAULT_MODEL];
  const activeModelOption =
    availableModels.find(
      (option) =>
        option.providerId === selectedProviderId && option.modelId === selectedModelId,
    ) ?? availableModels[0];

  const selectedProviderReady = Boolean(activeProvider);

  const previewPreset = getPresetFromEffort(effort);
  const routePreview = predictRoute(input || "Route this prompt", previewPreset);

  const visibleHistory = useMemo(() => {
    const value = deferredSearch.toLowerCase();

    return historyItems.filter((item) => {
      if (!value) {
        return true;
      }

      return (
        item.query.toLowerCase().includes(value) ||
        item.responsePreview?.toLowerCase().includes(value) ||
        item.model.toLowerCase().includes(value) ||
        item.provider.toLowerCase().includes(value)
      );
    });
  }, [deferredSearch, historyItems]);

  const resetChat = () => {
    setMessages([]);
    setLiveReply(null);
    setInput("");
    setAttachments([]);
    inputRef.current?.focus();
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId));
  };

  const handleAttachmentPick = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const files = Array.from(fileList).slice(0, 4);
    const nextAttachments = await Promise.all(
      files.map(async (file) => {
        let content = "";

        if (canInlineAttachment(file)) {
          try {
            const raw = await file.text();
            content = raw.slice(0, 12000);
          } catch {
            content = "";
          }
        }

        return {
          id: createId(),
          name: file.name,
          size: file.size,
          type: file.type || "file",
          content,
        } satisfies AttachmentDraft;
      }),
    );

    setAttachments((current) => [...current, ...nextAttachments].slice(0, 6));
  };

  const submitCurrentMessage = async () => {
    if (!input.trim() || loading || liveReply || !activeProvider) {
      return;
    }

    if (!selectedProviderReady) {
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content: `Add an API key for ${activeProvider.label} in Providers before using this model.`,
        },
      ]);
      return;
    }

    const userMessage = input.trim();
    const startedAt = performance.now();
    const historyPreset = getPresetFromEffort(effort);
    const fallbackPreview = predictRoute(userMessage, historyPreset);
    const sentAttachments = attachments.map(({ id, name, size, type }) => ({
      id,
      name,
      size,
      type,
    }));

    setInput("");
    setAttachments([]);
    setMessages((prev) => [
      ...prev,
      {
        id: createId(),
        role: "user",
        content: userMessage,
        attachments: sentAttachments,
      },
    ]);
    setLoading(true);

    try {
      const history = messages.map((message) => ({
        role: message.role,
        content: message.content,
      }));

      const responsePayload = await sendChatRequest(
        {
          message: userMessage,
          conversation_history: history,
          selected_model: selectedModelId,
          selected_provider: {
            id: activeProvider.id,
            label: activeProvider.label,
            api_key: activeProvider.apiKey,
            base_url: activeProvider.baseUrl,
            protocol: activeProvider.protocol,
          },
          reasoning_effort: effort,
          attachments: attachments.map((attachment) => ({
            name: attachment.name,
            content: attachment.content,
            type: attachment.type,
          })),
        },
        getClientId(),
      );
      const content =
        typeof responsePayload.response === "string" && responsePayload.response.trim().length > 0
          ? responsePayload.response
          : "No response";

      const metadata: MessageMetadata = {
        difficulty: responsePayload.metadata?.difficulty ?? fallbackPreview.difficulty,
        model_used: responsePayload.metadata?.model_used ?? selectedModelId,
        tier_name: responsePayload.metadata?.tier_name ?? activeProvider.label,
        tokens_used:
          typeof responsePayload.metadata?.tokens_used === "number"
            ? responsePayload.metadata.tokens_used
            : Math.max(48, Math.round(content.length / 4)),
      };

      setLiveReply({
        full: content,
        current: "",
        metadata,
      });

      appendHistoryItem({
        id: createId(),
        query: userMessage,
        responsePreview: markdownToPreviewText(content, 180),
        difficulty: metadata.difficulty,
        model: metadata.model_used,
        provider: activeProvider.label,
        tokens: metadata.tokens_used,
        latency: Number(((performance.now() - startedAt) / 1000).toFixed(1)),
        cost:
          metadata.difficulty === "HARD"
            ? 0.006
            : metadata.difficulty === "INTERMEDIATE"
              ? 0.0009
              : 0,
        preset: historyPreset,
        outcome: metadata.tier_name,
        createdAt: new Date().toISOString(),
        tags: [activeProvider.label.toLowerCase(), humanizeModelId(metadata.model_used)],
      });

      startTransition(() => {
        setHistoryItems(loadStoredHistory());
      });
    } catch (error) {
      const detail =
        error instanceof Error && error.message
          ? error.message
          : "Chat request failed before reaching the FastAPI backend.";

      setLiveReply({
        full: detail,
        current: "",
        metadata: {
          difficulty: fallbackPreview.difficulty,
          model_used: selectedModelId,
          tier_name: activeProvider.label,
          tokens_used: 0,
        },
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="overflow-hidden rounded-[32px] border border-white/8 bg-[#171717] text-white shadow-[0_30px_120px_rgba(15,23,42,0.3)]">
      <div className="flex min-h-[calc(100vh-1rem)]">
        <aside className="hidden w-[320px] shrink-0 border-r border-white/8 bg-[#141414] lg:flex lg:flex-col">
          <div className="border-b border-white/8 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[22px] bg-white/10">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">Agent Router</p>
                <p className="truncate text-xs text-zinc-500">
                  {activeProvider?.label ?? "OpenRouter"} • {humanizeModelId(selectedModelId)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={resetChat}
                className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <MessageSquarePlus className="h-4 w-4" />
                New chat
              </button>
              <Link
                href="/providers"
                target="_blank"
                rel="noreferrer"
                className="flex h-[50px] w-[50px] items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                <Settings2 className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="px-4 pt-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search chats"
                className="w-full rounded-2xl border border-white/8 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-zinc-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 pt-5">
            <p className="px-2 text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
              Recent chats
            </p>
            <div className="mt-3 space-y-2">
              {visibleHistory.length > 0 ? (
                visibleHistory.slice(0, 16).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setInput(item.query)}
                    className="w-full rounded-2xl px-3 py-3 text-left transition hover:bg-white/6"
                  >
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {item.query}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500" style={PREVIEW_CLAMP_STYLE}>
                      {item.responsePreview ?? item.outcome}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-zinc-500">No chats</p>
              )}
            </div>
          </div>

          <div className="border-t border-white/8 px-4 py-4">
            <div className="rounded-[24px] border border-white/10 bg-white/4 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Active provider
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {activeProvider?.label ?? "OpenRouter"}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                {selectedProviderReady ? "Ready" : "API key required"}
              </p>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-[#1b1b1b]">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <div>
              <p className="text-lg font-semibold text-white">Chat</p>
              <p className="text-sm text-zinc-500">
                {activeProvider?.label ?? "OpenRouter"} • {humanizeModelId(selectedModelId)}
              </p>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-2 text-xs text-zinc-400 sm:flex">
              <Cpu className="h-3.5 w-3.5" />
              {effort === "high" ? "High effort" : effort === "low" ? "Low effort" : "Standard effort"}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
            {messages.length === 0 && !liveReply ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <h1 className="font-display text-5xl text-white">Ask anything</h1>
                <p className="mt-3 text-sm text-zinc-500">
                  {activeProvider?.label ?? "OpenRouter"} • {humanizeModelId(selectedModelId)}
                </p>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
                {messages.map((message) => {
                  const isUser = message.role === "user";

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser ? (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      ) : null}

                      <div
                        className={`max-w-[85%] rounded-[28px] px-5 py-4 text-sm leading-8 ${
                          isUser ? "bg-white text-black" : "bg-white/6 text-zinc-100"
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        ) : (
                          <MarkdownPreview content={message.content} />
                        )}
                        {message.attachments && message.attachments.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.attachments.map((attachment) => (
                              <span
                                key={attachment.id}
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ${
                                  isUser
                                    ? "bg-slate-100 text-slate-700"
                                    : "bg-white/8 text-zinc-300"
                                }`}
                              >
                                <FileText className="h-3.5 w-3.5" />
                                {attachment.name}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      {isUser ? (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                {liveReply ? (
                  <div className="flex gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="max-w-[85%] rounded-[28px] bg-white/6 px-5 py-4 text-sm leading-8 text-zinc-100">
                      <MarkdownPreview content={liveReply.current} />
                    </div>
                  </div>
                ) : null}

                {loading && !liveReply ? (
                  <div className="flex gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="rounded-[28px] bg-white/6 px-5 py-4 text-sm text-zinc-400">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Thinking
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-white/8 px-5 py-5 sm:px-8">
            <div className="mx-auto w-full max-w-4xl">
              {providers.length > 0 && !selectedProviderReady ? (
                <div className="mb-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  Add an API key for {activeProvider?.label ?? "this provider"} in Providers.
                </div>
              ) : null}

              {attachments.length > 0 ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachments.map((attachment) => (
                    <span
                      key={attachment.id}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs text-zinc-300"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {attachment.name}
                      <button
                        type="button"
                        onClick={() => removeAttachment(attachment.id)}
                        className="rounded-full bg-white/10 p-1 text-zinc-300 transition hover:bg-white/15 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitCurrentMessage();
                }}
                className="rounded-[30px] border border-white/10 bg-[#252525] p-3"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void submitCurrentMessage();
                    }
                  }}
                  placeholder="Ask anything"
                  rows={1}
                  className="max-h-[220px] min-h-[84px] w-full resize-none bg-transparent px-3 py-2 text-[15px] text-white outline-none placeholder:text-zinc-500"
                />

                <div className="mt-2 flex flex-col gap-3 border-t border-white/8 px-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/6 text-zinc-300 transition hover:bg-white/10 hover:text-white"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>

                    <label className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-sm text-zinc-300">
                      <select
                        value={selectedProviderId}
                        onChange={(event) => setSelectedProviderId(event.target.value as ProviderId)}
                        className="bg-transparent outline-none"
                      >
                        {availableProviders.map((provider) => (
                          <option key={provider.id} value={provider.id} className="bg-[#1f1f1f]">
                            {provider.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-sm text-zinc-300">
                      <select
                        value={selectedModelId}
                        onChange={(event) => setSelectedModelId(event.target.value)}
                        className="max-w-[220px] bg-transparent outline-none"
                      >
                        {activeProviderModels.map((model) => (
                          <option key={model} value={model} className="bg-[#1f1f1f]">
                            {humanizeModelId(model)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-sm text-zinc-300">
                      <select
                        value={effort}
                        onChange={(event) =>
                          setEffort(event.target.value as "low" | "medium" | "high")
                        }
                        className="bg-transparent outline-none"
                      >
                        <option value="low" className="bg-[#1f1f1f]">
                          Low
                        </option>
                        <option value="medium" className="bg-[#1f1f1f]">
                          Standard
                        </option>
                        <option value="high" className="bg-[#1f1f1f]">
                          High
                        </option>
                      </select>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !input.trim() ||
                      Boolean(liveReply) ||
                      !selectedProviderReady
                    }
                    className="flex h-11 w-11 items-center justify-center self-end rounded-full bg-white text-black transition disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-zinc-500"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5">
                  <Link2 className="h-3.5 w-3.5" />
                  {activeProvider?.label ?? "OpenRouter"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5">
                  <Cpu className="h-3.5 w-3.5" />
                  {activeModelOption ? humanizeModelId(activeModelOption.modelId) : humanizeModelId(DEFAULT_MODEL)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5">
                  {routePreview.tier.name}
                </span>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(event) => {
                void handleAttachmentPick(event.target.files);
                event.target.value = "";
              }}
              className="hidden"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
