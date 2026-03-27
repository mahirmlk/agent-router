"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ChatWindowButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  href?: string;
};

export default function ChatWindowButton({
  children,
  href = "/chat",
  onClick,
  ...props
}: ChatWindowButtonProps) {
  return (
    <button
      type="button"
      {...props}
      onClick={(event) => {
        onClick?.(event);

        if (event.defaultPrevented || typeof window === "undefined") {
          return;
        }

        const chatWindow = window.open(
          href,
          "agent-router-chat",
          "popup=yes,width=1320,height=920,left=120,top=80,resizable=yes,scrollbars=yes",
        );

        if (chatWindow) {
          chatWindow.focus();
          return;
        }

        window.location.assign(href);
      }}
    >
      {children}
    </button>
  );
}
