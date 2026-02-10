"use client";

import type { ReactNode } from "react";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import { od, getStr, getArr, stripBlockTags } from "../helpers";
import type { QuestionPreviewData } from "../types";

/** [N] → input placeholders for static display */
function renderBlankPlaceholders(text: string): ReactNode {
  if (!text) return null;
  const inlineText = stripBlockTags(text).replace(/\n/g, "<br>");
  const parts = inlineText.split(/\[(\d+)\]/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      const num = parseInt(part);
      return (
        <span key={index} className="inline-flex items-center mx-1">
          <span className="w-28 h-7 border-b-2 border-primary mx-1 text-center text-sm text-muted-foreground">
            ({num})
          </span>
        </span>
      );
    }
    return <span key={index} dangerouslySetInnerHTML={{ __html: sanitizeHtml(part) }} />;
  });
}

export function FlowchartPreview({ data }: { data: QuestionPreviewData }) {
  const o = od(data);
  const contentTitle = getStr(o, "title", data.title || "");
  const nodes = getArr(o, "nodes") as { id?: string; label?: string; content?: string; type?: string; row?: number; col?: number }[];

  const rowMap = new Map<number, typeof nodes>();
  for (const n of nodes) {
    const row = n.row ?? 0;
    if (!rowMap.has(row)) rowMap.set(row, []);
    rowMap.get(row)!.push(n);
  }
  for (const [, group] of rowMap) {
    group.sort((a, b) => (a.col ?? 0) - (b.col ?? 0));
  }
  const sortedRows = [...rowMap.keys()].sort((a, b) => a - b);

  return (
    <div className="bg-white rounded-lg border p-6 flex-1 overflow-y-auto">
      {contentTitle && <h2 className="text-lg font-bold text-center mb-6">{contentTitle}</h2>}
      <div className="flex flex-col items-center">
        {sortedRows.map((row, rowIndex) => {
          const group = rowMap.get(row)!;
          const isBranch = group.length > 1 || group[0]?.type === "branch";
          return (
            <div key={row}>
              {rowIndex > 0 && (
                <div className="flex justify-center py-1">
                  <div className="flex flex-col items-center">
                    <div className="w-px h-3 bg-slate-400" />
                    <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-transparent border-t-slate-400" />
                  </div>
                </div>
              )}
              {isBranch && group.length > 1 && (
                <div className="flex justify-center mb-1">
                  <div className="flex items-end" style={{ width: `${Math.min(group.length * 200, 600)}px` }}>
                    {group.map((_, i) => (
                      <div key={i} className="flex-1 border-t-2 border-slate-400 h-0" />
                    ))}
                  </div>
                </div>
              )}
              {isBranch ? (
                <div className="flex justify-center gap-3">
                  {group.map((node) => (
                    <div key={node.id} className="p-4 rounded-lg border-2 border-blue-300 bg-blue-50 min-w-[180px] max-w-[260px] min-h-[80px] flex-1 text-center">
                      {node.label && <div className="font-semibold text-blue-700 mb-1 text-xs">{node.label}</div>}
                      <div className="text-sm">{renderBlankPlaceholders(node.content || "")}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="p-4 rounded-lg border-2 border-slate-300 bg-slate-50 min-w-[200px] max-w-[400px] text-center">
                    {group[0]?.label && <div className="font-semibold text-slate-600 mb-1 text-xs">{group[0].label}</div>}
                    <div className="text-sm">{renderBlankPlaceholders(group[0]?.content || "")}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
