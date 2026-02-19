"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import type { RendererProps } from "../types";

export function FillBlankTypingRenderer({ item, answers, setAnswer }: RendererProps) {
  const od = item.question.options_data || {};
  const content = String(od.content || item.question.content || "");
  if (!content) return <p className="text-sm text-gray-500">No content available.</p>;

  // table_completion: render HTML as a whole to preserve <table> structure
  if (item.question.question_format === "table_completion") {
    let processed = sanitizeHtmlForDisplay(content);
    processed = processed.replace(/\[(\d+)\]/g, (_, numStr) => {
      const blankNum = parseInt(numStr);
      const num = item.startNum + blankNum - 1;
      return `<input type="text" data-blank-num="${num}" style="width:80px;height:28px;border:none;border-bottom:2px solid #3b82f6;background:transparent;padding:0 4px;font-size:14px;text-align:center;outline:none" placeholder="(${num})" />`;
    });
    return (
      <div
        className="text-sm leading-relaxed [&_table]:border-collapse [&_table]:w-full [&_table]:table-fixed [&_td]:border [&_td]:border-slate-300 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-slate-300 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-slate-100 [&_th]:font-semibold"
        dangerouslySetInnerHTML={{ __html: processed }}
      />
    );
  }

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

  const [draggedWord, setDraggedWord] = useState<string | null>(null);

  // table_completion: render HTML as a whole to preserve <table> structure
  // Click-to-fill for table_completion (drag-drop not possible with dangerouslySetInnerHTML)
  if (item.question.question_format === "table_completion") {
    let processed = sanitizeHtmlForDisplay(content);
    processed = processed.replace(/\[(\d+)\]/g, (_, numStr) => {
      const blankNum = parseInt(numStr);
      const num = item.startNum + blankNum - 1;
      return `<span style="display:inline-block;min-width:80px;border-bottom:2px dashed #d1d5db;padding:0 4px;text-align:center;font-size:14px;color:#9ca3af">(${num})</span>`;
    });
    return (
      <div className="space-y-4">
        <div
          className="text-sm leading-relaxed [&_table]:border-collapse [&_table]:w-full [&_table]:table-fixed [&_td]:border [&_td]:border-slate-300 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-slate-300 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-slate-100 [&_th]:font-semibold"
          dangerouslySetInnerHTML={{ __html: processed }}
        />
        {wordBank.length > 0 && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-xs font-semibold text-slate-600 mb-2">Word Bank</p>
            <div className="flex flex-wrap gap-1.5">
              {wordBank.map((word, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  onClick={() => {
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
      </div>
    );
  }

  const isMulti = (item.question.item_count || 1) > 1;
  const parts = content.split(/\[(\d+)\]/);
  return (
    <div className="space-y-4">
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
                  "inline-block min-w-[80px] border-b border-dashed px-2 py-0.5 text-center text-sm select-none transition-colors",
                  answers[num]
                    ? "border-blue-500 border-solid bg-blue-50 text-blue-700 cursor-pointer"
                    : draggedWord
                      ? "border-primary bg-primary/5"
                      : "border-gray-300"
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedWord) {
                    setAnswer(num, draggedWord);
                    setDraggedWord(null);
                  }
                }}
                onClick={() => answers[num] && setAnswer(num, "")}
              >
                {answers[num] || "\u00A0"}
              </span>
            </span>
          );
        })}
      </div>
      {wordBank.length > 0 && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-xs font-semibold text-slate-600 mb-2">Word Bank</p>
          <div className="flex flex-wrap gap-1.5">
            {wordBank.map((word, i) => (
              <span
                key={i}
                draggable
                onDragStart={() => setDraggedWord(word)}
                onDragEnd={() => setDraggedWord(null)}
                className={cn(
                  "px-2.5 py-1 text-xs bg-white border border-slate-300 rounded cursor-grab hover:bg-slate-100 transition-all select-none",
                  draggedWord === word ? "opacity-50 scale-95" : ""
                )}
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
