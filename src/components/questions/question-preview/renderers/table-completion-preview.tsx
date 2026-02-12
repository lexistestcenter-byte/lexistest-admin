"use client";

import { useState } from "react";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import { od, getStr, getArr, stripBlockTags } from "../helpers";
import type { QuestionPreviewData } from "../types";

export function TableCompletionPreview({ data }: { data: QuestionPreviewData }) {
  const o = od(data);
  const contentTitle = getStr(o, "title", data.title || "");
  const inputMode = getStr(o, "input_mode", "typing");
  const wordBank = getArr(o, "word_bank").map(String);
  const isDragMode = inputMode === "drag";

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [draggedWord, setDraggedWord] = useState<string | null>(null);

  const handleDrop = (num: number) => {
    if (draggedWord) {
      setAnswers((prev) => ({ ...prev, [num]: draggedWord }));
      setDraggedWord(null);
    }
  };

  const clearAnswer = (num: number) => {
    setAnswers((prev) => {
      const n = { ...prev };
      delete n[num];
      return n;
    });
  };

  const availableWords = isDragMode
    ? wordBank.filter((w) => w && !Object.values(answers).includes(w))
    : [];

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const getTableHtml = (html: string) => {
    // Sanitize first, then replace [N] with interactive elements (preserving table structure)
    let processed = stripBlockTags(sanitizeHtmlForDisplay(html));

    processed = processed.replace(/\[(\d+)\]/g, (_, numStr) => {
      const num = parseInt(numStr);
      if (isDragMode) {
        const placed = answers[num];
        if (placed) {
          return `<span data-blank="${num}" style="display:inline-flex;align-items:center;justify-content:center;min-width:120px;height:32px;border:2px solid #4ade80;border-radius:4px;padding:0 8px;font-size:14px;background:#f0fdf4;color:#166534;cursor:pointer" title="더블클릭하여 제거">${esc(placed)}</span>`;
        }
        const border = draggedWord ? "2px dashed #3b82f6" : "2px solid #cbd5e1";
        const bg = draggedWord ? "rgba(59,130,246,0.05)" : "white";
        return `<span data-blank="${num}" style="display:inline-flex;align-items:center;justify-content:center;min-width:120px;height:32px;border:${border};border-radius:4px;padding:0 8px;font-size:14px;background:${bg};color:#94a3b8">${num}</span>`;
      }
      // Typing mode: uncontrolled input
      return `<input type="text" data-blank="${num}" style="width:80px;height:28px;border:none;border-bottom:2px solid #3b82f6;background:transparent;padding:0 4px;font-size:14px;text-align:center;outline:none" placeholder="(${num})" />`;
    });

    return processed;
  };

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4 flex-1 overflow-y-auto">
      {contentTitle && <h2 className="text-lg font-bold border-b pb-3">{contentTitle}</h2>}
      <div
        className="leading-relaxed [&_table]:border-collapse [&_table]:w-full [&_table]:table-fixed [&_td]:border [&_td]:border-slate-300 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-slate-300 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-slate-100 [&_th]:font-semibold"
        dangerouslySetInnerHTML={{ __html: getTableHtml(data.content || "") }}
        onDragOver={(e) => {
          const target = (e.target as HTMLElement).closest("[data-blank]");
          if (target && !target.getAttribute("title")) e.preventDefault();
        }}
        onDrop={(e) => {
          const target = (e.target as HTMLElement).closest("[data-blank]");
          if (target && draggedWord) {
            const num = parseInt(target.getAttribute("data-blank")!);
            handleDrop(num);
          }
        }}
        onDoubleClick={(e) => {
          const target = (e.target as HTMLElement).closest("[data-blank]");
          if (target) {
            const num = parseInt(target.getAttribute("data-blank")!);
            if (answers[num]) clearAnswer(num);
          }
        }}
      />
      {isDragMode && wordBank.length > 0 && (
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-2">Word Bank</p>
          <div className="flex flex-wrap gap-2">
            {availableWords.map((word, i) => (
              <span
                key={`${word}-${i}`}
                draggable
                onDragStart={() => setDraggedWord(word)}
                onDragEnd={() => setDraggedWord(null)}
                className={`px-4 py-1.5 bg-white rounded border border-slate-300 text-sm cursor-grab hover:bg-slate-50 select-none transition-all ${
                  draggedWord === word ? "opacity-50 scale-95" : ""
                }`}
              >
                {word}
              </span>
            ))}
            {availableWords.length === 0 && wordBank.length > 0 && (
              <span className="text-sm text-muted-foreground">모든 단어가 사용되었습니다</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
