"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import type { RendererProps } from "../types";
import { isHeadingMatchingQuestion } from "../types";

interface MatchingRendererProps extends RendererProps {
  activeMatchSlot: number | null;
  setActiveMatchSlot: (num: number | null) => void;
}

export function MatchingRenderer({
  item, answers, setAnswer,
  activeMatchSlot, setActiveMatchSlot,
}: MatchingRendererProps) {
  const od = item.question.options_data || {};
  const allowDuplicate = Boolean(od.allowDuplicate);
  const options = Array.isArray(od.options)
    ? (od.options as { label: string; text: string }[])
    : [];
  const matchItems = Array.isArray(od.items)
    ? (od.items as { number: number; statement: string }[])
    : [];

  if (options.length === 0 && matchItems.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-500">No matching data available.</p>
        {item.question.content && (
          <div
            className="text-sm prose prose-sm max-w-none [&_p]:my-3 [&_p:empty]:min-h-[1em] [&_p:has(br:only-child)]:min-h-[1em]"
            dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(item.question.content) }}
          />
        )}
      </div>
    );
  }

  const matchNumPrefix =
    item.startNum === item.endNum
      ? `${item.startNum}`
      : `${item.startNum}–${item.endNum}`;

  // Collect assigned option labels for duplicate prevention
  const assignedLabels = new Set<string>();
  if (!allowDuplicate) {
    matchItems.forEach((_, idx) => {
      const num = item.startNum + idx;
      const val = answers[num];
      if (val) assignedLabels.add(val);
    });
  }

  const handlePillClick = (label: string) => {
    if (activeMatchSlot !== null) {
      setAnswer(activeMatchSlot, label);
      setActiveMatchSlot(null);
    } else {
      for (let idx = 0; idx < matchItems.length; idx++) {
        const num = item.startNum + idx;
        if (!answers[num]) {
          setAnswer(num, label);
          return;
        }
      }
    }
  };

  const handleSlotClick = (num: number) => {
    if (answers[num]) return;
    setActiveMatchSlot(activeMatchSlot === num ? null : num);
  };

  const handleClear = (num: number) => {
    setAnswer(num, "");
    if (activeMatchSlot === num) setActiveMatchSlot(null);
  };

  const isHeadingMatching = isHeadingMatchingQuestion(item.question);

  if (isHeadingMatching) {
    // Right panel only: heading list (draggable) + question number assignments
    // Left panel (passage + drop zones) is rendered by HeadingMatchingPassage
    return (
      <div className="space-y-4">
        {/* Draggable heading list */}
        <div className="bg-slate-50 border rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">List of Headings</p>
          <div className="space-y-1.5">
            {options.map((opt) => {
              const isUsed = !allowDuplicate && assignedLabels.has(opt.label);
              return (
                <div
                  key={opt.label}
                  draggable={!isUsed}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", opt.label);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className={cn(
                    "flex items-start gap-2 px-3 py-2 text-sm rounded transition-colors select-none",
                    isUsed
                      ? "text-gray-400 line-through opacity-50"
                      : "cursor-grab active:cursor-grabbing hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200"
                  )}
                >
                  <span className="font-bold text-gray-500 shrink-0 min-w-[24px]">{opt.label}</span>
                  <span className="font-medium underline decoration-1 underline-offset-2">{String(opt.text)}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    );
  }

  // Default matching layout (pills + match items)
  return (
    <div className="space-y-4">
      {/* Options Pool — clickable pills */}
      {options.length > 0 && (
        <div className="p-3 bg-slate-50 border rounded-lg">
          <p className="text-xs font-semibold text-slate-500 mb-2">Options</p>
          <div className="flex flex-wrap gap-1.5">
            {options.map((opt) => {
              const isUsed = !allowDuplicate && assignedLabels.has(opt.label);
              return (
                <button
                  key={opt.label}
                  type="button"
                  disabled={isUsed}
                  className={cn(
                    "px-3 py-1.5 rounded-full border text-sm font-medium transition-colors select-none",
                    isUsed
                      ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed line-through"
                      : "bg-white border-blue-300 text-blue-700 hover:bg-blue-50 cursor-pointer"
                  )}
                  onClick={() => handlePillClick(opt.label)}
                >
                  <span className="font-bold mr-1">{opt.label}</span>
                  <span className="font-normal">{String(opt.text)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Match Items — click slot then click pill to assign */}
      <div className="space-y-2">
        {matchItems.map((entry, idx) => {
          const num = item.startNum + idx;
          const assignedLabel = answers[num] || "";
          const assignedOpt = assignedLabel
            ? options.find((o) => o.label === assignedLabel)
            : null;
          const isActive = activeMatchSlot === num;

          return (
            <div key={num} className="flex items-start gap-3">
              <span className="font-bold text-sm min-w-[24px] pt-2">{num}</span>
              <div className="flex-1 flex items-start gap-2">
                <div className="text-sm flex-1 pt-2 [&_p]:m-0" dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(String(entry.statement)) }} />
                {assignedOpt ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-300 text-sm text-blue-700 shrink-0">
                    <span className="font-bold">{assignedOpt.label}</span>
                    <button
                      type="button"
                      className="ml-0.5 p-0.5 rounded-full hover:bg-blue-200 transition-colors"
                      onClick={() => handleClear(num)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className={cn(
                      "px-3 py-1.5 rounded-full border text-sm transition-colors shrink-0",
                      isActive
                        ? "border-blue-500 bg-blue-50 text-blue-600 ring-2 ring-blue-200"
                        : "border-gray-300 text-gray-400 hover:border-gray-400 hover:bg-gray-50"
                    )}
                    onClick={() => handleSlotClick(num)}
                  >
                    — Select —
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
