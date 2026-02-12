"use client";

import type { RendererProps } from "../types";

export function EssayRenderer({ item, answers, setAnswer }: RendererProps) {
  const num = item.startNum;
  const od = item.question.options_data || {};
  const wordCount = (answers[num] || "").split(/\s+/).filter(Boolean).length;
  return (
    <div className="space-y-3">
      {od.condition ? (
        <p className="text-sm text-gray-500 italic">{String(od.condition)}</p>
      ) : null}
      <textarea
        rows={10}
        placeholder="Write your answer here..."
        className="w-full text-sm border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        value={answers[num] || ""}
        onChange={(e) => setAnswer(num, e.target.value)}
      />
      <div className="text-xs text-gray-400">
        <span>Words: {wordCount}</span>
      </div>
    </div>
  );
}
