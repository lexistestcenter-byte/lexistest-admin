"use client";

import { cn } from "@/lib/utils";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import type { RendererProps } from "../types";

export function FlowchartRenderer({ item, answers, setAnswer }: RendererProps) {
  const od = item.question.options_data || {};
  // flowchart content can be in options_data or question.content (as JSON)
  let parsedOd = od;
  if ((!od.nodes || !Array.isArray(od.nodes)) && item.question.content) {
    try {
      const parsed = JSON.parse(item.question.content);
      if (parsed && Array.isArray(parsed.nodes)) {
        parsedOd = parsed;
      }
    } catch {
      // content is not JSON, ignore
    }
  }
  const flowTitle = String(parsedOd.title || od.title || "");
  const nodes = Array.isArray(parsedOd.nodes)
    ? (parsedOd.nodes as { id: string; type: string; content: string; row: number; col: number; label?: string }[])
    : [];

  if (nodes.length === 0) {
    return <p className="text-sm text-gray-500">No flowchart data available.</p>;
  }

  const isMulti = (item.question.item_count || 1) > 1;

  const rows = new Map<number, typeof nodes>();
  for (const node of nodes) {
    const list = rows.get(node.row) || [];
    list.push(node);
    rows.set(node.row, list);
  }

  const renderContent = (text: string) => {
    // Convert <p> blocks and \n to <br> so line breaks render properly
    const processed = text
      .replace(/<\/p>\s*<p[^>]*>/gi, "<br>")
      .replace(/^<p[^>]*>/i, "")
      .replace(/<\/p>$/i, "")
      .replace(/\n/g, "<br>");
    const parts = processed.split(/\[(\d+)\]/);
    return parts.map((part, i) => {
      if (i % 2 === 0) return <span key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(part) }} />;
      const num = item.startNum + parseInt(part, 10) - 1;
      return (
        <span key={i} className="relative inline-flex items-center mx-0.5">
          {isMulti && !answers[num] && (
            <span className="absolute inset-0 flex items-center justify-center text-[11px] text-gray-400 pointer-events-none z-10">
              {num}
            </span>
          )}
          <input
            type="text"
            className={cn(
              "border-b border-dashed border-gray-300 bg-transparent px-1 w-24 text-center text-sm focus:outline-none focus:border-blue-400",
              answers[num] ? "text-blue-600 border-blue-400 border-solid" : ""
            )}
            value={answers[num] || ""}
            onChange={(e) => setAnswer(num, e.target.value)}
          />
        </span>
      );
    });
  };

  return (
    <div className="space-y-3">
      {flowTitle ? <p className="text-sm font-semibold">{flowTitle}</p> : null}
      <div className="flex flex-col items-center">
        {Array.from(rows.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([rowNum, rowNodes], rowIndex) => {
            const sorted = rowNodes.sort((a, b) => a.col - b.col);
            const isBranch = sorted.length > 1 || sorted[0]?.type === "branch";
            return (
              <div key={rowNum}>
                {rowIndex > 0 && (
                  <div className="flex justify-center py-1">
                    <div className="flex flex-col items-center">
                      <div className="w-px h-3 bg-slate-400" />
                      <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-transparent border-t-slate-400" />
                    </div>
                  </div>
                )}
                {isBranch && sorted.length > 1 && (
                  <div className="flex justify-center mb-1">
                    <div className="flex items-end" style={{ width: `${Math.min(sorted.length * 200, 600)}px` }}>
                      {sorted.map((_, i) => (
                        <div key={i} className="flex-1 border-t-2 border-slate-400 h-0" />
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-stretch justify-center gap-3">
                  {sorted.map((node) => (
                    <div
                      key={node.id}
                      className={cn(
                        "p-3 border rounded text-sm text-center flex-1",
                        node.type === "branch"
                          ? "bg-amber-50 border-amber-300 min-w-[180px] max-w-[260px] min-h-[80px]"
                          : "bg-white border-gray-300 min-w-[200px] max-w-[400px]"
                      )}
                    >
                      {node.label ? (
                        <p className="text-xs font-semibold text-gray-500 mb-1">{node.label}</p>
                      ) : null}
                      <div className="leading-relaxed">{renderContent(node.content)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
