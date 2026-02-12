"use client";

import { useState, type ReactNode } from "react";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import { od, getStr, getArr, getBool, stripBlockTags } from "../helpers";
import type { QuestionPreviewData } from "../types";

export function FillBlankDragPreview({ data }: { data: QuestionPreviewData }) {
  const o = od(data);
  const contentTitle = getStr(o, "title", data.title || "");
  const wordBank = getArr(o, "word_bank").map(String);
  const allowDuplicate = getBool(o, "allowDuplicate") || getBool(o, "allow_duplicate");
  const blankMode = getStr(o, "blank_mode", "word");
  const isSentenceMode = blankMode === "sentence";
  const inputStyle = getStr(o, "input_style", "editor");
  const items = getArr(o, "items").map(String);

  const allText = inputStyle === "items" && items.length > 0 ? items.join(" ") : (data.content || "");
  const isMulti = ((allText).match(/\[\d+\]/g) || []).length > 1;

  const [placedWords, setPlacedWords] = useState<Record<number, string>>({});
  const [draggedWord, setDraggedWord] = useState<string | null>(null);

  const availableWords = allowDuplicate
    ? wordBank.filter((w) => w)
    : wordBank.filter((w) => w && !Object.values(placedWords).includes(w));

  const handleDrop = (num: number) => {
    if (draggedWord) {
      setPlacedWords((prev) => ({ ...prev, [num]: draggedWord }));
      setDraggedWord(null);
    }
  };

  const clearWord = (num: number) => {
    setPlacedWords((prev) => {
      const n = { ...prev };
      delete n[num];
      return n;
    });
  };

  const renderSlotContent = (text: string): ReactNode => {
    const inlineText = stripBlockTags(text);
    const parts = inlineText.split(/\[(\d+)\]/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        const num = parseInt(part);
        const placed = placedWords[num];
        return (
          <span key={index} className="relative inline-flex items-center mx-0.5 align-middle">
            {isMulti && !placed && (
              <span className="absolute inset-0 flex items-center justify-center text-[11px] text-gray-400 pointer-events-none z-10">
                {num}
              </span>
            )}
            <span
              className={`inline-flex items-center justify-center min-w-[120px] h-8 border-b border-dashed px-2 text-sm transition-colors ${
                placed
                  ? "bg-green-50 border-green-400 border-solid text-green-800 cursor-pointer"
                  : draggedWord
                    ? "border-primary bg-primary/5"
                    : "border-slate-300 bg-white"
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(num)}
              onDoubleClick={() => placed && clearWord(num)}
              title={placed ? "더블클릭하여 제거" : ""}
            >
              {placed || "\u00A0"}
            </span>
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
            <li key={idx} className="leading-[2] text-sm">
              {renderSlotContent(item)}
            </li>
          ))}
        </ul>
      ) : (
        <div className="leading-[2] text-sm">{renderSlotContent(data.content || "")}</div>
      )}
      {wordBank.length > 0 && (
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-2">Word Bank</p>
          <div className={isSentenceMode ? "flex flex-col gap-2" : "flex flex-wrap gap-2"}>
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
