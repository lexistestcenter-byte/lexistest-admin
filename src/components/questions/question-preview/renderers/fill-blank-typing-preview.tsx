"use client";

import { useState, type ReactNode } from "react";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import { od, getStr, getArr } from "../helpers";
import type { QuestionPreviewData } from "../types";

export function FillBlankTypingPreview({ data }: { data: QuestionPreviewData }) {
  const o = od(data);
  const contentTitle = getStr(o, "title", data.title || "");
  const inputStyle = getStr(o, "input_style", "editor");
  const items = getArr(o, "items").map(String);

  const allText = inputStyle === "items" && items.length > 0 ? items.join(" ") : (data.content || "");
  const isMulti = ((allText).match(/\[\d+\]/g) || []).length > 1;

  const [answers, setAnswers] = useState<Record<number, string>>({});

  const renderWithInputs = (text: string): ReactNode => {
    if (!text) return null;
    // Strip block-level <p> tags to keep content inline (prevent forced line breaks)
    const inlineText = text
      .replace(/<\/p>\s*<p[^>]*>/gi, "<br>")
      .replace(/^<p[^>]*>/i, "")
      .replace(/<\/p>$/i, "");
    const parts = inlineText.split(/\[(\d+)\]/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        const num = parseInt(part);
        return (
          <span key={index} className="relative inline-flex items-center mx-1 align-middle">
            {isMulti && !answers[num] && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 pointer-events-none z-10">
                {num}
              </span>
            )}
            <input
              type="text"
              value={answers[num] || ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [num]: e.target.value }))}
              className={`w-28 h-7 border-b border-dashed border-gray-300 px-1 text-sm outline-none bg-transparent focus:border-blue-400 ${answers[num] ? "text-blue-600 border-blue-400 border-solid" : ""}`}
            />
          </span>
        );
      }
      return <span key={index} dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(part) }} />;
    });
  };

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4 flex-1 overflow-y-auto">
      {contentTitle && <h2 className="text-lg font-bold border-b pb-3">{contentTitle}</h2>}
      {inputStyle === "items" && items.length > 0 ? (
        <ul className="space-y-2 list-disc pl-5">
          {items.filter((i) => i.trim()).map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderWithInputs(item)}
            </li>
          ))}
        </ul>
      ) : (
        <div className="leading-relaxed prose prose-sm max-w-none [&_p]:my-3 [&_p:empty]:min-h-[1em] [&_p:has(br:only-child)]:min-h-[1em] [&_strong]:font-bold">
          {renderWithInputs(data.content || "")}
        </div>
      )}
    </div>
  );
}
