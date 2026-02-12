"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import { od, getStr, getArr, getBool, stripBlockTags } from "../helpers";
import type { QuestionPreviewData } from "../types";

export function MatchingPreview({ data }: { data: QuestionPreviewData }) {
  const o = od(data);
  const contentTitle = getStr(o, "title", data.title || "");
  const options = getArr(o, "options") as { id?: string; label?: string; text?: string }[];
  const allowDuplicate = getBool(o, "allowDuplicate");

  const [assignments, setAssignments] = useState<Record<number, string>>({});
  const [draggedOption, setDraggedOption] = useState<string | null>(null);

  const handleDrop = (slotNum: number) => {
    if (draggedOption) {
      setAssignments((prev) => ({ ...prev, [slotNum]: draggedOption }));
      setDraggedOption(null);
    }
  };

  const clearSlot = (slotNum: number) => {
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[slotNum];
      return next;
    });
  };

  const usedOptions = new Set(Object.values(assignments));
  const availableOptions = allowDuplicate
    ? options
    : options.filter((opt) => !usedOptions.has(opt.text || ""));

  const renderContentWithSlots = () => {
    const html = stripBlockTags(sanitizeHtmlForDisplay(data.content || ""));
    const parts = html.split(/(\[\d+\])/g);
    return parts.map((part, index) => {
      const slotMatch = part.match(/^\[(\d+)\]$/);
      if (slotMatch) {
        const num = parseInt(slotMatch[1]);
        const placed = assignments[num];
        return (
          <div
            key={index}
            className={cn(
              "inline-block border-2 rounded px-4 py-1 mx-1 my-1 min-w-[120px] text-center transition-colors",
              placed
                ? "bg-green-50 border-green-400 text-green-800 cursor-pointer"
                : draggedOption
                  ? "border-dashed border-primary bg-primary/5"
                  : "border-slate-300 bg-white"
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(num)}
            onDoubleClick={() => placed && clearSlot(num)}
            title={placed ? "더블클릭하여 제거" : ""}
          >
            {placed || num}
          </div>
        );
      }
      return <span key={index} dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(part) }} />;
    });
  };

  return (
    <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
      <div className="bg-white rounded-lg border p-6 overflow-y-auto">
        {contentTitle && <h2 className="text-lg font-bold mb-4">{contentTitle}</h2>}
        <div className="prose prose-sm max-w-none [&_p]:my-3 [&_p:empty]:min-h-[1em] [&_p:has(br:only-child)]:min-h-[1em] [&_strong]:font-bold leading-relaxed">
          {renderContentWithSlots()}
        </div>
      </div>
      <div className="bg-white rounded-lg border p-4 overflow-y-auto">
        <h3 className="font-semibold mb-1">List of Headings</h3>
        <p className="text-xs text-muted-foreground mb-4">Drag headings to the numbered slots.</p>
        {allowDuplicate && (
          <p className="text-xs text-blue-600 mb-3">* 같은 제목을 여러 번 사용할 수 있습니다</p>
        )}
        <div className="space-y-2">
          {availableOptions.map((option, idx) => (
            <div
              key={option.id || idx}
              draggable
              onDragStart={() => setDraggedOption(option.text || "")}
              onDragEnd={() => setDraggedOption(null)}
              className={cn(
                "px-4 py-2.5 bg-slate-50 rounded-lg border cursor-grab hover:bg-slate-100 select-none transition-opacity",
                draggedOption === (option.text || "") ? "opacity-50 scale-95" : ""
              )}
            >
              <span className="font-semibold mr-2">{option.label || String.fromCharCode(65 + idx)}.</span>
              <span>{option.text || `(제목 입력)`}</span>
            </div>
          ))}
          {availableOptions.length === 0 && options.length > 0 && (
            <p className="text-sm text-muted-foreground">모든 제목이 배치되었습니다</p>
          )}
        </div>
      </div>
    </div>
  );
}
