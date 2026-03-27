"use client";

import Link from "next/link";
import ChatWindowButton from "@/components/ChatWindowButton";
import BrandMark from "@/components/BrandMark";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ChevronRight,
  Clock,
  LayoutGrid,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  PlugZap,
  Server,
  Shield,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/models", label: "Models", icon: Boxes },
  { href: "/history", label: "History", icon: Clock },
  { href: "/providers", label: "Providers", icon: PlugZap },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export default function Sidebar({
  collapsed,
  onToggleCollapsed,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-[1640px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <BrandMark compact />

          <div className="flex items-center gap-2">
            <Link
              href="/providers"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600"
            >
              <PlugZap className="h-4 w-4" />
              Providers
            </Link>
            <ChatWindowButton
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white"
              aria-label="Open chat in a separate window"
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </ChatWindowButton>
          </div>
        </div>

        <div className="mx-auto grid max-w-[1640px] grid-cols-4 gap-2 px-4 pb-3 sm:px-6">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-2xl px-3 py-3 text-center text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-950 text-white"
                    : "bg-white text-slate-600"
                }`}
              >
                <Icon className="mx-auto mb-2 h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <aside
        className={`fixed left-0 top-0 z-40 hidden h-screen border-r border-slate-200/70 bg-white/82 backdrop-blur-xl transition-[width] duration-200 lg:flex lg:flex-col ${
          collapsed ? "w-[5.5rem]" : "w-[18rem]"
        }`}
      >
        <div className="flex h-full flex-col px-4 py-5">
          <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
            <BrandMark compact={collapsed} />

            {!collapsed ? (
              <button
                type="button"
                onClick={onToggleCollapsed}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-colors hover:text-slate-900"
                aria-label="Hide sidebar details"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {collapsed ? (
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="mt-5 inline-flex h-11 w-11 items-center justify-center self-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-colors hover:text-slate-900"
              aria-label="Show sidebar details"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          ) : (
            <div className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(148,163,184,0.12)]">
              <p className="text-sm leading-7 text-slate-600">
                Route prompts to the right model tier, manage the OpenRouter route, and keep history, cost, and response quality under control from one workspace.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    Router
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">3 tiers</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    Status
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">Healthy</p>
                </div>
              </div>
            </div>
          )}

          <ChatWindowButton
            className={`mt-5 flex items-center rounded-[22px] bg-slate-950 text-white transition-colors hover:bg-slate-900 ${
              collapsed
                ? "justify-center px-0 py-3.5"
                : "justify-between px-4 py-3.5"
            }`}
            aria-label="Open chat in a separate window"
          >
            <span className="flex items-center gap-3">
              <MessageSquare className="h-[18px] w-[18px]" />
              {!collapsed ? <span className="text-sm font-semibold">Chat</span> : null}
            </span>
            {!collapsed ? <ChevronRight className="h-4 w-4 text-white/75" /> : null}
          </ChatWindowButton>

          <nav className="mt-2 space-y-2">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`group flex items-center rounded-[22px] transition-colors ${
                    collapsed
                      ? "justify-center px-0 py-3.5"
                      : "justify-between px-4 py-3.5"
                  } ${
                    isActive
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-[18px] w-[18px]" />
                    {!collapsed ? <span className="text-sm font-semibold">{item.label}</span> : null}
                  </span>
                  {!collapsed ? (
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${
                        isActive
                          ? "translate-x-0 text-white/75"
                          : "text-slate-400 group-hover:translate-x-0.5"
                      }`}
                    />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 space-y-3">
            <div
              className={`rounded-[24px] border border-slate-200 bg-white p-4 ${
                collapsed ? "px-0 py-3" : ""
              }`}
            >
              {collapsed ? (
                <div className="flex justify-center">
                  <Shield className="h-4 w-4 text-slate-500" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-slate-500" />
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      System health
                    </p>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Router API</span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                        <span className="status-dot bg-slate-700" />
                        Online
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Providers</span>
                      <span className="font-semibold text-slate-900">OpenRouter</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-auto">
            <Link
              href="/providers"
              title={collapsed ? "Providers" : undefined}
              className={`flex items-center rounded-[22px] border border-slate-200 bg-white text-slate-600 transition-colors hover:text-slate-900 ${
                collapsed ? "justify-center px-0 py-3.5" : "justify-between px-4 py-3.5"
              }`}
            >
              <span className="flex items-center gap-3">
                <Server className="h-[18px] w-[18px]" />
                {!collapsed ? <span className="text-sm font-semibold">Providers</span> : null}
              </span>
              {!collapsed ? <ChevronRight className="h-4 w-4 text-slate-400" /> : null}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
