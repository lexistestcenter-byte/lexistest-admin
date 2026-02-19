"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import { od, getStr, getArr, getBool } from "../helpers";
import type { QuestionPreviewData } from "../types";

export function MCQPreview({ data }: { data: QuestionPreviewData }) {
  const o = od(data);
  const isMultiple = data.question_format === "mcq_multiple" || getBool(o, "isMultiple");
  const maxSelections = Number(o.maxSelections || 1);
  const displayAlphabet = o.displayMode === "alphabet";
  const options = getArr(o, "options") as { id?: string; label?: string; text?: string }[];
  const question = getStr(o, "question", data.content);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleOption = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (isMultiple) {
          if (next.size < maxSelections) next.add(id);
        } else {
          next.clear();
          next.add(id);
        }
      }
      return next;
    });
  };

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4 flex-1 overflow-y-auto">
      <p className="text-lg" dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(question || "(문제 입력)") }} />
      {isMultiple && (
        <p className="text-sm text-blue-600">Choose {maxSelections} answers.</p>
      )}
      {displayAlphabet ? (
        <div className="space-y-1.5 mt-4">
          {options.map((option, idx) => {
            const optId = option.id || String(idx);
            const isSelected = selected.has(optId);
            const label = option.label || String.fromCharCode(65 + idx);
            return (
              <button
                key={optId}
                type="button"
                onClick={() => toggleOption(optId)}
                className={cn(
                  "flex items-center gap-3 p-3 border rounded-lg cursor-pointer w-full text-left transition-colors",
                  isSelected ? "bg-primary/10 border-primary" : "hover:bg-slate-50"
                )}
              >
                <span
                  className={cn(
                    "w-8 h-8 rounded-full border-2 font-bold text-sm flex items-center justify-center shrink-0 transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300"
                  )}
                >
                  {label}
                </span>
                <span>{option.text || `(선택지 ${label})`}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {options.map((option, idx) => {
            const optId = option.id || String(idx);
            const isSelected = selected.has(optId);
            const label = option.label || String.fromCharCode(65 + idx);
            return (
              <button
                key={optId}
                type="button"
                onClick={() => toggleOption(optId)}
                className={cn(
                  "flex items-center gap-3 p-3 border rounded-lg cursor-pointer w-full text-left transition-colors",
                  isSelected ? "bg-primary/10 border-primary" : "hover:bg-slate-50"
                )}
              >
                {isMultiple ? (
                  <div
                    className={cn(
                      "w-5 h-5 border-2 rounded flex items-center justify-center shrink-0 transition-colors",
                      isSelected ? "border-primary bg-primary text-white" : "border-gray-300"
                    )}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                ) : (
                  <div
                    className={cn(
                      "w-5 h-5 border-2 rounded-full flex items-center justify-center shrink-0 transition-colors",
                      isSelected ? "border-primary" : "border-gray-300"
                    )}
                  >
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                )}
                <span>{option.text || `(선택지 ${label})`}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
