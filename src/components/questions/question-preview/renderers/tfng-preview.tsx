"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import { od, getArr } from "../helpers";
import type { QuestionPreviewData } from "../types";

export function TFNGPreview({ data }: { data: QuestionPreviewData }) {
  const o = od(data);
  const items = getArr(o, "items") as { id?: string; statement?: string }[];
  const isYesNo = data.question_format === "yes_no_ng";
  const optionLabels = isYesNo ? ["YES", "NO", "NOT GIVEN"] : ["TRUE", "FALSE", "NOT GIVEN"];

  const [answers, setAnswers] = useState<Record<number, string>>({});

  const toggleAnswer = (idx: number, label: string) => {
    setAnswers((prev) => ({
      ...prev,
      [idx]: prev[idx] === label ? "" : label,
    }));
  };

  // Single-item mode (legacy: content holds the statement)
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6 space-y-4 flex-1 overflow-y-auto">
        <div className="p-4 border rounded-lg">
          <p className="mb-4" dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(data.content || "(진술문 입력)") }} />
          <div className="flex gap-4">
            {optionLabels.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleAnswer(0, label)}
                className="flex items-center gap-2 cursor-pointer text-sm"
              >
                <div
                  className={cn(
                    "w-5 h-5 border-2 rounded-full flex items-center justify-center shrink-0 transition-colors",
                    answers[0] === label ? "border-primary" : "border-gray-300"
                  )}
                >
                  {answers[0] === label && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6 space-y-3 flex-1 overflow-y-auto">
      {items.map((item, idx) => (
        <div key={item.id || idx} className="p-4 border rounded-lg">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
              {idx + 1}
            </span>
            <p className="flex-1" dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(item.statement || "(진술문)") }} />
          </div>
          <div className="flex gap-4 mt-3 ml-9">
            {optionLabels.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleAnswer(idx, label)}
                className="flex items-center gap-2 cursor-pointer text-sm"
              >
                <div
                  className={cn(
                    "w-5 h-5 border-2 rounded-full flex items-center justify-center shrink-0 transition-colors",
                    answers[idx] === label ? "border-primary" : "border-gray-300"
                  )}
                >
                  {answers[idx] === label && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
