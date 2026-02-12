"use client";

import { cn } from "@/lib/utils";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import type { RendererProps } from "../types";

export function FillBlankTypingRenderer({ item, answers, setAnswer }: RendererProps) {
  const od = item.question.options_data || {};
  const content = String(od.content || item.question.content || "");
  if (!content) return <p className="text-sm text-gray-500">No content available.</p>;

  const isMulti = (item.question.item_count || 1) > 1;
  const parts = content.split(/\[(\d+)\]/);
  return (
    <div className="text-sm leading-relaxed">
      <div>
        {parts.map((part, i) => {
          if (i % 2 === 0) return <span key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(part) }} />;
          const blankNum = parseInt(part, 10);
          const num = item.startNum + blankNum - 1;
          return (
            <span key={i} className="relative inline-flex items-center mx-0.5 align-baseline">
              {isMulti && !answers[num] && (
                <span className="absolute inset-0 flex items-center justify-center text-[11px] text-gray-400 pointer-events-none z-10">
                  {num}
                </span>
              )}
              <input
                type="text"
                className={cn(
                  "border-b border-dashed border-gray-300 bg-transparent px-1 py-0 w-28 text-center text-sm focus:outline-none focus:border-blue-400",
                  answers[num] ? "text-blue-600 border-blue-400 border-solid" : ""
                )}
                value={answers[num] || ""}
                onChange={(e) => setAnswer(num, e.target.value)}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function FillBlankDragRenderer({ item, answers, setAnswer }: RendererProps) {
  const od = item.question.options_data || {};
  const content = String(od.content || item.question.content || "");
  // word_bank (snake_case from DB) or wordBank (camelCase)
  const wordBank = Array.isArray(od.word_bank)
    ? (od.word_bank as string[])
    : Array.isArray(od.wordBank)
      ? (od.wordBank as string[])
      : [];
  if (!content) return <p className="text-sm text-gray-500">No content available.</p>;

  const isMulti = (item.question.item_count || 1) > 1;
  const parts = content.split(/\[(\d+)\]/);
  return (
    <div className="space-y-4">
      {wordBank.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-semibold text-amber-700 mb-2">Word Bank</p>
          <div className="flex flex-wrap gap-1.5">
            {wordBank.map((word, i) => (
              <span
                key={i}
                className="px-2.5 py-1 text-xs bg-white border border-amber-300 rounded cursor-pointer hover:bg-amber-100 transition-colors select-none"
                onClick={() => {
                  // blanks could be in options_data or answer_data
                  const blanks = Array.isArray(od.blanks)
                    ? (od.blanks as { number: number }[])
                    : [];
                  for (const blank of blanks) {
                    const num = item.startNum + blank.number - 1;
                    if (!answers[num]) {
                      setAnswer(num, word);
                      return;
                    }
                  }
                  // If no blanks metadata, find first empty blank by parsing content
                  for (let bi = 0; bi < (item.question.item_count || 1); bi++) {
                    const num = item.startNum + bi;
                    if (!answers[num]) {
                      setAnswer(num, word);
                      return;
                    }
                  }
                }}
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="text-sm leading-relaxed">
        {parts.map((part, i) => {
          if (i % 2 === 0) return <span key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(part) }} />;
          const blankNum = parseInt(part, 10);
          const num = item.startNum + blankNum - 1;
          return (
            <span key={i} className="relative inline-flex items-center mx-0.5 align-baseline">
              {isMulti && !answers[num] && (
                <span className="absolute inset-0 flex items-center justify-center text-[11px] text-gray-400 pointer-events-none z-10">
                  {num}
                </span>
              )}
              <span
                className={cn(
                  "inline-block min-w-[80px] border-b border-dashed border-gray-300 px-2 py-0.5 text-center text-sm cursor-pointer select-none",
                  answers[num]
                    ? "border-blue-500 border-solid bg-blue-50 text-blue-700"
                    : ""
                )}
                onClick={() => answers[num] && setAnswer(num, "")}
              >
                {answers[num] || "\u00A0"}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
