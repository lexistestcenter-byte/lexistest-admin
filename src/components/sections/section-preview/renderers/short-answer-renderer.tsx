"use client";

import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import type { RendererProps } from "../types";

export function ShortAnswerRenderer({ item, answers, setAnswer, setActiveNum }: RendererProps) {
  const question = item.question.content || "";
  const num = item.startNum;

  return (
    <div className="space-y-2">
      <div className="flex gap-2 text-sm">
        <span className="font-bold text-primary shrink-0">{num}.</span>
        <span dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(question) }} />
      </div>
      <input
        type="text"
        value={answers[num] || ""}
        onChange={(e) => setAnswer(num, e.target.value)}
        onFocus={() => setActiveNum?.(num)}
        className="w-full border-b border-dashed border-gray-300 bg-transparent px-1 py-1 text-sm outline-none focus:border-blue-500 focus:border-solid"
        placeholder={`Answer ${num}`}
      />
    </div>
  );
}
