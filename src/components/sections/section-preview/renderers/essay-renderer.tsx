"use client";

import { getCdnUrl } from "@/lib/cdn";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import type { RendererProps } from "../types";

export function EssayRenderer({ item, answers, setAnswer }: RendererProps) {
  const num = item.startNum;
  const od = item.question.options_data || {};
  const minWords = od.min_words ? Number(od.min_words) : null;
  const wordCount = (answers[num] || "").split(/\s+/).filter(Boolean).length;
  return (
    <div className="space-y-3">
      {od.condition ? (
        <p className="text-sm text-gray-500 italic">{String(od.condition)}</p>
      ) : null}
      {item.question.content ? (
        <div
          className="text-sm leading-relaxed prose prose-sm max-w-none [&_p]:my-3 [&_p:empty]:min-h-[1em] [&_p:has(br:only-child)]:min-h-[1em] [&_strong]:font-bold"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.question.content) }}
        />
      ) : null}
      {od.image_url ? (
        <div className="my-3 p-3 bg-white rounded border">
          <img src={getCdnUrl(String(od.image_url))} alt="Task" className="max-w-full h-auto rounded" />
        </div>
      ) : null}
      <textarea
        rows={10}
        placeholder="Write your answer here..."
        className="w-full text-sm border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        value={answers[num] || ""}
        onChange={(e) => setAnswer(num, e.target.value)}
      />
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Words: {wordCount}</span>
        {minWords && (
          <span className={wordCount < minWords ? "text-red-500" : "text-green-600"}>
            Min. {minWords} words
          </span>
        )}
      </div>
    </div>
  );
}
