"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

const SIDEBAR_COLLAPSED_KEY = "agent-router-sidebar-collapsed-v1";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isChatWindow = pathname === "/chat" || pathname.startsWith("/chat/");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      setCollapsed(stored === "true");
    } catch {
      setCollapsed(false);
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;

      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        return next;
      }

      return next;
    });
  };

  if (isChatWindow) {
    return (
      <div className="app-shell min-h-screen">
        <main className="relative min-h-screen px-4 pb-6 pt-3 sm:px-6 sm:pb-8 sm:pt-4">
          <div className="mx-auto flex min-h-[calc(100vh-1rem)] w-full max-w-[1680px] flex-col gap-6">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen">
      <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      <main
        className={`relative min-h-screen flex-1 px-4 pb-6 pt-3 transition-[padding] duration-200 sm:px-6 sm:pb-8 sm:pt-4 ${
          collapsed ? "lg:pl-[7rem] lg:pr-8" : "lg:pl-[19.5rem] lg:pr-8"
        }`}
      >
        <div className="mx-auto flex min-h-[calc(100vh-1rem)] w-full max-w-[1640px] flex-col gap-6">
          {children}
        </div>
      </main>
    </div>
  );
}
