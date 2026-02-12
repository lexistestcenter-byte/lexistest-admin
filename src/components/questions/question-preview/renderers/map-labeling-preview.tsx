"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { getCdnUrl } from "@/lib/cdn";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import { od, getStr, getArr } from "../helpers";
import type { QuestionPreviewData } from "../types";

export function MapLabelingPreview({ data }: { data: QuestionPreviewData }) {
  const o = od(data);
  const contentTitle = getStr(o, "title", data.title || "");
  const passage = data.content || "";
  const imageUrl = getCdnUrl(getStr(o, "image_url", ""));
  const items = getArr(o, "items") as { id?: string; number?: number; statement?: string }[];
  const labels = getArr(o, "labels").length > 0
    ? getArr(o, "labels").map(String)
    : ["A", "B", "C", "D", "E", "F"];

  const [selections, setSelections] = useState<Record<number, string>>({});

  const toggleCell = (itemIdx: number, label: string) => {
    setSelections((prev) => ({
      ...prev,
      [itemIdx]: prev[itemIdx] === label ? "" : label,
    }));
  };

  return (
    <div className="space-y-4 flex-1 min-h-0 flex flex-col overflow-y-auto">
      {contentTitle && <h2 className="text-lg font-bold shrink-0">{contentTitle}</h2>}
      {passage && passage.trim() && (
        <div className="text-sm text-muted-foreground leading-relaxed shrink-0" dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(passage) }} />
      )}
      <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
        {/* 왼쪽: 이미지 */}
        <div className="bg-white rounded-lg border p-4 flex items-center justify-center min-h-[300px]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Map"
              className="max-w-full h-auto max-h-[400px] rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <p className="text-sm text-gray-400">이미지 없음</p>
          )}
        </div>
        {/* 오른쪽: 문항 테이블 */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 text-left font-medium"></th>
                {labels.map((label) => (
                  <th key={label} className="px-2 py-2 text-center font-medium w-12">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id || idx} className="border-t">
                  <td className="px-3 py-2">
                    <span className="font-bold mr-2">{item.number ?? idx + 1}</span>
                    {item.statement || ""}
                  </td>
                  {labels.map((label) => {
                    const isSelected = selections[idx] === label;
                    return (
                      <td key={label} className="px-1 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => toggleCell(idx, label)}
                          className={cn(
                            "w-10 h-10 rounded border-2 mx-auto flex items-center justify-center transition-colors cursor-pointer",
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                          )}
                        >
                          {isSelected && (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
