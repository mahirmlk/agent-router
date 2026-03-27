"use client";

import type { ReactNode } from "react";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
  compact?: boolean;
}

type MarkdownBlock =
  | { type: "heading"; depth: number; content: string }
  | { type: "paragraph"; content: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; content: string }
  | { type: "code"; content: string; language: string }
  | { type: "rule" };

const INLINE_PATTERN =
  /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_)/g;

function joinClasses(...values: Array<string | undefined | false>): string {
  return values.filter(Boolean).join(" ");
}

function isHorizontalRule(line: string): boolean {
  return /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line);
}

function isListItem(line: string): boolean {
  return /^ {0,3}(?:[-*+]|\d+\.)\s+/.test(line);
}

function isParagraphBoundary(line: string): boolean {
  const trimmed = line.trim();

  return (
    trimmed.length === 0 ||
    trimmed.startsWith("```") ||
    /^(#{1,6})\s+/.test(trimmed) ||
    trimmed.startsWith(">") ||
    isListItem(trimmed) ||
    isHorizontalRule(trimmed)
  );
}

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const codeFenceMatch = trimmed.match(/^```([\w-]+)?\s*$/);
    if (codeFenceMatch) {
      const language = codeFenceMatch[1] ?? "";
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push({
        type: "code",
        content: codeLines.join("\n").trimEnd(),
        language,
      });
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        depth: headingMatch[1].length,
        content: headingMatch[2].trim(),
      });
      index += 1;
      continue;
    }

    if (isHorizontalRule(trimmed)) {
      blocks.push({ type: "rule" });
      index += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];

      while (index < lines.length) {
        const current = lines[index].trim();
        if (!current) {
          break;
        }
        if (!current.startsWith(">")) {
          break;
        }

        quoteLines.push(current.replace(/^>\s?/, ""));
        index += 1;
      }

      blocks.push({
        type: "quote",
        content: quoteLines.join(" ").trim(),
      });
      continue;
    }

    if (isListItem(trimmed)) {
      const ordered = /^\d+\./.test(trimmed);
      const items: string[] = [];

      while (index < lines.length) {
        const current = lines[index].trim();
        if (!current) {
          break;
        }

        const match = current.match(/^ {0,3}(?:[-*+]|\d+\.)\s+(.+)$/);
        if (!match) {
          break;
        }

        items.push(match[1].trim());
        index += 1;
      }

      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length && !isParagraphBoundary(lines[index])) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    blocks.push({
      type: "paragraph",
      content: paragraphLines.join(" ").trim(),
    });
  }

  return blocks;
}

function renderInlineContent(content: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  INLINE_PATTERN.lastIndex = 0;

  while ((match = INLINE_PATTERN.exec(content)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(content.slice(lastIndex, match.index));
    }

    const key = `${keyPrefix}-${match.index}`;

    if (match[2] && match[3]) {
      nodes.push(
        <a
          key={key}
          href={match[3]}
          target="_blank"
          rel="noreferrer"
          className="text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-white/60"
        >
          {match[2]}
        </a>,
      );
    } else if (match[4]) {
      nodes.push(
        <code
          key={key}
          className="rounded-md bg-black/25 px-1.5 py-0.5 font-mono text-[0.92em] text-white"
        >
          {match[4]}
        </code>,
      );
    } else if (match[5] || match[6]) {
      const value = match[5] ?? match[6] ?? "";
      nodes.push(
        <strong key={key} className="font-semibold text-white">
          {renderInlineContent(value, `${key}-strong`)}
        </strong>,
      );
    } else if (match[7] || match[8]) {
      const value = match[7] ?? match[8] ?? "";
      nodes.push(
        <em key={key} className="italic text-zinc-100">
          {renderInlineContent(value, `${key}-em`)}
        </em>,
      );
    }

    lastIndex = INLINE_PATTERN.lastIndex;
  }

  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex));
  }

  return nodes;
}

export function markdownToPreviewText(content: string, maxLength = 160): string {
  const collapsed = content
    .replace(/\r\n?/g, "\n")
    .replace(/```[\s\S]*?```/g, (block) => {
      const withoutFence = block
        .replace(/^```[\w-]*\s*\n?/, "")
        .replace(/\n?```$/, "")
        .trim();

      return withoutFence ? ` ${withoutFence.split("\n")[0]} ` : " ";
    })
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/\s+/g, " ")
    .trim();

  if (collapsed.length <= maxLength) {
    return collapsed;
  }

  return `${collapsed.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

export default function MarkdownPreview({
  content,
  className,
  compact = false,
}: MarkdownPreviewProps) {
  const blocks = parseMarkdownBlocks(content);
  const gapClass = compact ? "space-y-2 leading-6" : "space-y-3 leading-7";
  const paragraphClass = compact ? "text-sm text-zinc-200" : "text-sm text-zinc-100";
  const listClass = compact ? "ml-5 space-y-1 text-sm text-zinc-200" : "ml-5 space-y-1.5 text-sm text-zinc-100";

  return (
    <div className={joinClasses("min-w-0 break-words", gapClass, className)}>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === "heading") {
          const headingClass =
            block.depth <= 2
              ? "text-base font-semibold text-white"
              : "text-sm font-semibold uppercase tracking-[0.14em] text-zinc-300";

          return (
            <div key={key} className={headingClass}>
              {renderInlineContent(block.content, key)}
            </div>
          );
        }

        if (block.type === "paragraph") {
          return (
            <p key={key} className={paragraphClass}>
              {renderInlineContent(block.content, key)}
            </p>
          );
        }

        if (block.type === "quote") {
          return (
            <blockquote
              key={key}
              className="border-l-2 border-white/18 pl-4 text-sm italic text-zinc-300"
            >
              {renderInlineContent(block.content, key)}
            </blockquote>
          );
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";

          return (
            <ListTag
              key={key}
              className={joinClasses(block.ordered ? "list-decimal" : "list-disc", listClass)}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>{renderInlineContent(item, `${key}-${itemIndex}`)}</li>
              ))}
            </ListTag>
          );
        }

        if (block.type === "code") {
          return (
            <div
              key={key}
              className="overflow-x-auto rounded-2xl border border-white/8 bg-black/28 px-4 py-3"
            >
              {block.language ? (
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {block.language}
                </p>
              ) : null}
              <pre className="whitespace-pre-wrap font-mono text-[13px] leading-6 text-zinc-200">
                {block.content}
              </pre>
            </div>
          );
        }

        return <div key={key} className="h-px bg-white/8" />;
      })}
    </div>
  );
}
