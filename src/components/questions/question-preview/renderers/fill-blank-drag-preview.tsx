"use client";

import { useState, useRef, useEffect } from "react";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import { od, getStr, getArr, getBool } from "../helpers";
import type { QuestionPreviewData } from "../types";

export function FillBlankDragPreview({ data }: { data: QuestionPreviewData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [placedWords, setPlacedWords] = useState<Record<number, string>>({});
  const [draggedWord, setDraggedWord] = useState<string | null>(null);
  const placedWordsRef = useRef(placedWords);
  const draggedWordRef = useRef<string | null>(null);

  // Keep refs in sync
  useEffect(() => { placedWordsRef.current = placedWords; }, [placedWords]);
  useEffect(() => { draggedWordRef.current = draggedWord; }, [draggedWord]);

  // Event delegation: dragover, drop, dblclick on slots
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleDragOver = (e: DragEvent) => {
      if ((e.target as HTMLElement).closest("[data-slot]")) e.preventDefault();
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const target = (e.target as HTMLElement).closest("[data-slot]") as HTMLElement | null;
      if (target && draggedWordRef.current) {
        const num = parseInt(target.dataset.slot || "0");
        setPlacedWords((prev) => ({ ...prev, [num]: draggedWordRef.current! }));
        setDraggedWord(null);
      }
    };
    const handleDblClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-slot]") as HTMLElement | null;
      if (target) {
        const num = parseInt(target.dataset.slot || "0");
        if (placedWordsRef.current[num]) {
          setPlacedWords((prev) => {
            const n = { ...prev };
            delete n[num];
            return n;
          });
        }
      }
    };
    container.addEventListener("dragover", handleDragOver);
    container.addEventListener("drop", handleDrop);
    container.addEventListener("dblclick", handleDblClick);
    return () => {
      container.removeEventListener("dragover", handleDragOver);
      container.removeEventListener("drop", handleDrop);
      container.removeEventListener("dblclick", handleDblClick);
    };
  }, []);

  // Sync slot content and styles
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.querySelectorAll<HTMLElement>("[data-slot]").forEach((el) => {
      const num = parseInt(el.dataset.slot || "0");
      const val = placedWords[num] || "";
      el.textContent = val || String(num);
      if (val) {
        el.style.borderBottomColor = "#4ade80";
        el.style.borderBottomStyle = "solid";
        el.style.backgroundColor = "#f0fdf4";
        el.style.color = "#166534";
      } else {
        el.style.borderBottomColor = "#cbd5e1";
        el.style.borderBottomStyle = "dashed";
        el.style.backgroundColor = "";
        el.style.color = "#9ca3af";
      }
    });
  }, [placedWords]);

  const o = od(data);
  const contentTitle = getStr(o, "title", data.title || "");
  const wordBank = getArr(o, "word_bank").map(String);
  const allowDuplicate = getBool(o, "allowDuplicate") || getBool(o, "allow_duplicate");
  const inputStyle = getStr(o, "input_style", "editor");
  const items = getArr(o, "items").map(String);

  const availableWords = allowDuplicate
    ? wordBank.filter((w) => w)
    : wordBank.filter((w) => w && !Object.values(placedWords).includes(w));

  // Replace [N] with <span data-slot> in HTML string
  const replaceWithSlot = (html: string): string => {
    return html.replace(/\[(\d+)\]/g, (_, numStr) => {
      const num = parseInt(numStr);
      return `<span data-slot="${num}" style="display:inline-block;min-width:100px;border-bottom:1px dashed #cbd5e1;padding:0 8px;text-align:center;font-size:14px;cursor:pointer;vertical-align:baseline;color:#9ca3af" title="더블클릭하여 제거">${num}</span>`;
    });
  };

  // Build full HTML preserving structure (ul/ol/li/p)
  let fullHtml: string;
  if (inputStyle === "items" && items.length > 0) {
    const lis = items
      .filter((i) => i.trim())
      .map((i) => `<li>${replaceWithSlot(sanitizeHtmlForDisplay(i))}</li>`)
      .join("");
    fullHtml = `<ul>${lis}</ul>`;
  } else {
    fullHtml = replaceWithSlot(sanitizeHtmlForDisplay(data.content || ""));
  }

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4 flex-1 overflow-y-auto">
      {contentTitle && <h2 className="text-lg font-bold border-b pb-3">{contentTitle}</h2>}
      <div
        ref={containerRef}
        className="text-sm leading-[2] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_p]:my-2 [&_p:first-child]:mt-0"
        dangerouslySetInnerHTML={{ __html: fullHtml }}
      />
      {wordBank.length > 0 && (
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
