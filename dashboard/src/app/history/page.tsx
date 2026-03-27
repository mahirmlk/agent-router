"use client";

import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import {
  formatCurrency,
  formatLatency,
  formatRelativeTime,
  type Difficulty,
  type RouteHistoryItem,
} from "@/lib/dashboard-data";
import {
  clearStoredHistory,
  deleteHistoryItem,
  loadStoredHistory,
} from "@/lib/history-storage";
import {
  Clock3,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<RouteHistoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<"ALL" | Difficulty>("ALL");

  useEffect(() => {
    const stored = loadStoredHistory().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    setHistoryItems(stored);
  }, []);

  const filteredItems = useMemo(() => {
    return historyItems.filter((item) => {
      const search = query.toLowerCase();
      const matchesQuery =
        query.length === 0 ||
        item.query.toLowerCase().includes(search) ||
        item.responsePreview?.toLowerCase().includes(search) ||
        item.model.toLowerCase().includes(search) ||
        item.provider.toLowerCase().includes(search);
      const matchesDifficulty =
        difficultyFilter === "ALL" || item.difficulty === difficultyFilter;

      return matchesQuery && matchesDifficulty;
    });
  }, [difficultyFilter, historyItems, query]);

  const totalCost = filteredItems.reduce((sum, item) => sum + item.cost, 0);
  const avgLatency =
    filteredItems.length > 0
      ? filteredItems.reduce((sum, item) => sum + item.latency, 0) / filteredItems.length
      : 0;
  const premiumCount = filteredItems.filter((item) => item.difficulty === "HARD").length;
  const simpleCount = filteredItems.filter((item) => item.difficulty === "SIMPLE").length;
  const freeShare =
    filteredItems.length > 0 ? Math.round((simpleCount / filteredItems.length) * 100) : 0;

  const handleDelete = (itemId: string) => {
    deleteHistoryItem(itemId);
    setHistoryItems((current) => current.filter((item) => item.id !== itemId));
  };

  const handleClearAll = () => {
    clearStoredHistory();
    setHistoryItems([]);
  };

  return (
    <div className="space-y-6">
      <AppHeader
        eyebrow="History"
        title="Routing history with real controls."
        description="Search by prompt, provider, or model, filter by difficulty, and remove stored chats when you want to reset the local review trail."
        stats={[
          {
            label: "Stored requests",
            value: `${filteredItems.length}`,
            note: "Counts the current filtered set from local browser history.",
          },
          {
            label: "Total cost",
            value: formatCurrency(totalCost),
            note: "Updated live against the current filtered set.",
          },
          {
            label: "Free-tier share",
            value: `${freeShare}%`,
            note: "Higher numbers mean more traffic is staying on the cheapest path.",
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="space-y-6">
          <div className="glass-panel-strong p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search a prompt, provider, or model id..."
                  className="w-full rounded-[22px] border border-white/88 bg-white/78 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/84 bg-white/75 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filter
                </span>
                {(["ALL", "SIMPLE", "INTERMEDIATE", "HARD"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setDifficultyFilter(item)}
                    className={`pill ${difficultyFilter === item ? "pill-active" : ""}`}
                  >
                    {item}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={historyItems.length === 0}
                  className="pill disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear all
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <article key={item.id} className="glass-soft p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-white/88 bg-white/82 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {item.difficulty}
                          </span>
                          <span className="rounded-full border border-white/88 bg-white/82 px-3 py-1.5 text-xs font-medium text-slate-500">
                            {item.preset}
                          </span>
                          <span className="rounded-full border border-white/88 bg-white/82 px-3 py-1.5 text-xs font-medium text-slate-500">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>

                        <h2 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">
                          {item.query}
                        </h2>
                        <p className="mt-2 text-sm leading-7 text-slate-600">
                          {item.responsePreview ?? item.outcome}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.tags.map((tag) => (
                            <span
                              key={`${item.id}-${tag}`}
                              className="rounded-full border border-slate-200 bg-white/76 px-3 py-1.5 text-xs font-medium text-slate-500"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid min-w-[17rem] grid-cols-2 gap-3 lg:grid-cols-1 xl:grid-cols-2">
                        <div className="rounded-[22px] border border-white/82 bg-white/72 px-3.5 py-3">
                          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                            Model
                          </p>
                          <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                            {item.model}
                          </p>
                        </div>
                        <div className="rounded-[22px] border border-white/82 bg-white/72 px-3.5 py-3">
                          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                            Tokens
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {item.tokens}
                          </p>
                        </div>
                        <div className="rounded-[22px] border border-white/82 bg-white/72 px-3.5 py-3">
                          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                            Latency
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {formatLatency(item.latency)}
                          </p>
                        </div>
                        <div className="rounded-[22px] border border-white/82 bg-white/72 px-3.5 py-3">
                          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                            Cost
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {formatCurrency(item.cost)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/76 px-6 py-12 text-center">
                  <p className="text-lg font-semibold tracking-tight text-slate-900">
                    No stored chat history
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    Send prompts in the chat window and routed conversations will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="glass-panel p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-slate-500" />
              <p className="section-title">Performance snapshot</p>
            </div>

            <div className="mt-4 space-y-4">
              <div className="metric-card">
                <p className="text-sm text-slate-500">Average latency</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                  {formatLatency(avgLatency || 0)}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[24px] border border-white/82 bg-white/72 p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    Premium routes
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                    {premiumCount}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/82 bg-white/72 p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    Simple routes
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                    {simpleCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 sm:p-6">
            <p className="section-title">What changed</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
              <li>History is now based only on real locally stored chat sessions.</li>
              <li>Each stored chat can be deleted individually from the history list.</li>
              <li>You can clear the full local review trail in one action.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
