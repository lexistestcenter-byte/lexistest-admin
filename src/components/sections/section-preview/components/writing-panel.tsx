"use client";

import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import { renderFormattedText, renderBlockHtml } from "../types";
import type { QuestionItem, QuestionGroupPreview } from "../types";

interface WritingPanelProps {
  item: QuestionItem;
  group: QuestionGroupPreview | null;
  answers: Record<number, string>;
  setAnswer: (num: number, value: string) => void;
}

export function WritingPanel({ item, group, answers, setAnswer }: WritingPanelProps) {
  const num = item.startNum;
  const q = item.question;
  const od = q.options_data || {};
  const condition = od.condition ? String(od.condition) : null;
  const titleText = q.title || "";
  const groupInstructions = group?.instructions || null;
  const wordCount = (answers[num] || "").split(/\s+/).filter(Boolean).length;

  // Condition takes priority; show instructions only as fallback
  const subtitle = condition || groupInstructions;
  const isCondition = !!condition;

  // Main title: question title takes priority, group title as fallback
  const mainTitle = titleText || group?.title || null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Top: Title + Condition or Instructions */}
      <div className="bg-sky-50 border-b border-sky-200 px-6 py-4 shrink-0">
        {mainTitle && (
          <div className="text-base font-bold text-gray-900">
            {renderFormattedText(mainTitle)}
          </div>
        )}
        {subtitle && (
          isCondition ? (
            <p className="text-sm font-semibold text-gray-700 mt-2">
              {subtitle}
            </p>
          ) : (
            <div className="text-sm text-gray-700 mt-2 leading-relaxed">
              {renderBlockHtml(subtitle)}
            </div>
          )
        )}
      </div>

      {/* 2-column: Left passage + Right textarea */}
      <div className="flex-1 grid grid-cols-2 overflow-hidden min-h-0">
        {/* Left: Passage content */}
        <div className="col-span-1 border-r border-slate-300 bg-slate-100 overflow-y-auto p-4">
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
            {q.content ? (
              <div
                className="text-sm leading-[1.8] text-gray-700 prose prose-sm max-w-none [&_p]:my-3 [&_p:empty]:min-h-[1em] [&_p:has(br:only-child)]:min-h-[1em] [&_strong]:font-bold"
                dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(q.content) }}
              />
            ) : (
              <p className="text-sm text-gray-400 italic">No passage content.</p>
            )}
          </div>
        </div>

        {/* Right: Textarea + Word Count */}
        <div className="col-span-1 bg-white overflow-y-auto p-4 flex flex-col">
          <textarea
            placeholder="Write your answer here..."
            className="w-full flex-1 min-h-[300px] text-sm border border-slate-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            value={answers[num] || ""}
            onChange={(e) => setAnswer(num, e.target.value)}
          />
          <div className="mt-2 text-right text-xs text-gray-400">
            Word Count: {wordCount}
          </div>
        </div>
      </div>
    </div>
  );
}
