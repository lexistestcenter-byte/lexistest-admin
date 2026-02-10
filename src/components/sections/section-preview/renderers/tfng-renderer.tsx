"use client";

import { cn } from "@/lib/utils";
import type { RendererProps } from "../types";
import { renderFormattedText } from "../types";

export function TFNGRenderer({ item, answers, setAnswer }: RendererProps) {
  const od = item.question.options_data || {};
  let itemsList: { number: number; statement: string }[] = [];

  if (Array.isArray(od.items) && od.items.length > 0) {
    itemsList = od.items as { number: number; statement: string }[];
  } else if (Array.isArray(od.statements) && (od.statements as unknown[]).length > 0) {
    itemsList = (od.statements as { number: number; statement: string }[]);
  } else {
    // 단일 statement: content 필드를 사용
    const statement = item.question.content || String(od.statement || od.question || "");
    if (statement) {
      const count = item.question.item_count || 1;
      itemsList = Array.from({ length: count }, (_, idx) => ({
        number: idx + 1,
        statement: idx === 0 ? statement : `Statement ${idx + 1}`,
      }));
    }
  }

  if (itemsList.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-500">No T/F/NG data available.</p>
        {item.question.content && (
          <p className="text-sm">{item.question.content}</p>
        )}
      </div>
    );
  }

  // IELTS-style: title sub-header if question has a title
  const titleText = item.question.title || "";
  const numPrefix =
    item.startNum === item.endNum
      ? `${item.startNum}`
      : `${item.startNum}–${item.endNum}`;

  return (
    <div className="space-y-4">
      {titleText ? (
        <div className="bg-slate-100 border-l-4 border-slate-300 px-4 py-2.5 rounded-r">
          <p className="text-[15px]">
            <span className="font-bold mr-2">{numPrefix}</span>
            {renderFormattedText(titleText)}
          </p>
        </div>
      ) : null}
      {itemsList.map((entry, idx) => {
        const num = item.startNum + idx;
        return (
          <div key={num} className="space-y-2">
            <p className="text-[15px]">
              <span className="font-bold mr-2">{num}</span>
              {renderFormattedText(String(entry.statement))}
            </p>
            <div className="flex gap-2">
              {[
                { value: "true", label: "TRUE" },
                { value: "false", label: "FALSE" },
                { value: "not_given", label: "NOT GIVEN" },
              ].map((opt) => {
                const isSelected = answers[num] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors text-sm",
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                    onClick={() => setAnswer(num, opt.value)}
                  >
                    <span
                      className={cn(
                        "flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center",
                        isSelected ? "border-blue-500" : "border-gray-300"
                      )}
                    >
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </span>
                    <span className="font-medium text-xs">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
