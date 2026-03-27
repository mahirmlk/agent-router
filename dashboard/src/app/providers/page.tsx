"use client";

import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import {
  defaultProviderConfigs,
  loadProviderConfigs,
  saveProviderConfigs,
  type ProviderConfig,
} from "@/lib/provider-storage";
import { KeyRound, RotateCcw, Save, ShieldCheck } from "lucide-react";

function toTextareaValue(models: string[]): string {
  return models.join("\n");
}

function fromTextareaValue(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<ProviderConfig[]>(defaultProviderConfigs);
  const [savedAt, setSavedAt] = useState<string>("");

  useEffect(() => {
    setProviders(loadProviderConfigs());
  }, []);

  const enabledCount = providers.filter((provider) => provider.enabled).length;
  const configuredCount = providers.filter((provider) => provider.apiKey.trim()).length;
  const totalModels = providers.reduce((sum, provider) => sum + provider.models.length, 0);

  const updateProvider = (id: ProviderConfig["id"], updates: Partial<ProviderConfig>) => {
    setProviders((current) =>
      current.map((provider) =>
        provider.id === id
          ? {
              ...provider,
              ...updates,
            }
          : provider,
      ),
    );
  };

  const handleSave = () => {
    saveProviderConfigs(providers);
    setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  };

  const handleReset = () => {
    setProviders(defaultProviderConfigs);
    saveProviderConfigs(defaultProviderConfigs);
    setSavedAt("");
  };

  return (
    <div className="space-y-6">
      <AppHeader
        eyebrow="Providers"
        title="Manage backend provider settings."
        description="Store an optional browser-local OpenRouter key, set the base URL, and control which model ids the Next.js UI sends to FastAPI."
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleReset} className="pill">
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button type="button" onClick={handleSave} className="pill pill-active">
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        }
        stats={[
          {
            label: "Routes",
            value: `${providers.length}`,
            note: "Chat now goes from the browser to FastAPI, which owns model transport.",
          },
          {
            label: "Enabled",
            value: `${enabledCount}`,
            note: "Only enabled provider entries appear in the chat model menu.",
          },
          {
            label: "Configured",
            value: `${configuredCount}`,
            note: "Browser-local keys are forwarded to FastAPI only when you send a chat.",
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="space-y-5">
          {providers.map((provider) => (
            <article key={provider.id} className="glass-panel-strong p-5 sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                      {provider.label}
                    </h2>
                    <span className="rounded-full border border-white/84 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {provider.protocol}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{provider.baseUrl}</p>
                </div>

                <label className="inline-flex items-center gap-3 rounded-full border border-white/84 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={provider.enabled}
                    onChange={(event) =>
                      updateProvider(provider.id, { enabled: event.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-slate-900"
                  />
                  Enabled
                </label>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    API key
                  </span>
                  <input
                    type="password"
                    value={provider.apiKey}
                    onChange={(event) =>
                      updateProvider(provider.id, { apiKey: event.target.value })
                    }
                    placeholder={`Paste ${provider.label} key`}
                    className="w-full rounded-[22px] border border-white/86 bg-white/82 px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Base URL
                  </span>
                  <input
                    type="text"
                    value={provider.baseUrl}
                    onChange={(event) =>
                      updateProvider(provider.id, { baseUrl: event.target.value })
                    }
                    className="w-full rounded-[22px] border border-white/86 bg-white/82 px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                </label>
              </div>

              <label className="mt-4 block space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Models
                </span>
                <textarea
                  value={toTextareaValue(provider.models)}
                  onChange={(event) =>
                    updateProvider(provider.id, {
                      models: fromTextareaValue(event.target.value),
                    })
                  }
                  rows={4}
                  className="w-full rounded-[22px] border border-white/86 bg-white/82 px-4 py-3 text-sm leading-7 text-slate-700 outline-none"
                />
              </label>
            </article>
          ))}
        </section>

        <aside className="space-y-6">
          <div className="glass-panel p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              <p className="section-title">Storage</p>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
              <p>Keys and model lists stay in local browser storage.</p>
              <p>FastAPI uses the repo OpenRouter key by default and falls back to your browser-local key when provided.</p>
              {savedAt ? (
                <p className="rounded-[20px] border border-white/84 bg-white/76 px-4 py-3 font-medium text-slate-700">
                  Saved at {savedAt}
                </p>
              ) : null}
            </div>
          </div>

          <div className="glass-panel p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-slate-500" />
              <p className="section-title">Available models</p>
            </div>
            <div className="mt-4 grid gap-3">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="rounded-[22px] border border-white/82 bg-white/74 px-4 py-4"
                >
                  <p className="text-sm font-semibold text-slate-900">{provider.label}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {provider.models.length} model option{provider.models.length === 1 ? "" : "s"}
                  </p>
                </div>
              ))}
              <div className="rounded-[22px] border border-white/82 bg-white/74 px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">Total models</p>
                <p className="mt-1 text-xs text-slate-500">{totalModels} configured entries</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
