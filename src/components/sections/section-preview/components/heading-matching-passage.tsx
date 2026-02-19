"use client";

import { X } from "lucide-react";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import type { QuestionItem } from "../types";

interface HeadingMatchingPassageProps {
  item: QuestionItem;
  answers: Record<number, string>;
  setAnswer: (num: number, value: string) => void;
}

export function HeadingMatchingPassage({ item, answers, setAnswer }: HeadingMatchingPassageProps) {
  const passageHtml = item.question.content || "";
  const od = item.question.options_data || {};
  const hmOptions = Array.isArray(od.options)
    ? (od.options as { label: string; text: string }[])
    : [];

  const handleHmDrop = (num: number, e: React.DragEvent) => {
    e.preventDefault();
    const label = e.dataTransfer.getData("text/plain");
    if (label && hmOptions.some((o) => o.label === label)) {
      setAnswer(num, label);
    }
  };

  const parts = passageHtml.split(/\[(\d+)\]/);

  return (
    <div className="p-4 min-h-full flex flex-col">
      <div className="bg-white rounded-lg border p-6 flex-1">
        <div className="text-sm leading-[1.8] text-gray-700 prose prose-sm max-w-none [&_p]:my-3 [&_p:empty]:min-h-[1em] [&_p:has(br:only-child)]:min-h-[1em]">
          {parts.map((part, i) => {
            if (i % 2 === 0) {
              return <span key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(part) }} />;
            }
            const blankNum = parseInt(part, 10);
            const num = item.startNum + blankNum - 1;
            const assignedLabel = answers[num] || "";
            const assignedOpt = assignedLabel ? hmOptions.find((o) => o.label === assignedLabel) : null;
            return (
              <span
                key={i}
                className="inline-flex items-center mx-1 align-baseline"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleHmDrop(num, e)}
              >
                <span className="text-xs font-bold text-blue-600 mr-1">{num}</span>
                {assignedOpt ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-300 text-sm text-blue-700 cursor-pointer max-w-[240px]" onClick={() => setAnswer(num, "")}>
                    <span className="font-bold shrink-0">{assignedOpt.label}</span>
                    <span className="truncate">{assignedOpt.text}</span>
                    <X className="h-3 w-3 ml-0.5 shrink-0" />
                  </span>
                ) : (
                  <span className="inline-block min-w-[60px] border-2 border-dashed border-gray-300 rounded px-2 py-0.5 text-center text-sm text-gray-400">
                    ____
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
