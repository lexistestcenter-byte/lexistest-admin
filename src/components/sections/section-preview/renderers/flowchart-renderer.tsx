"use client";

import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/utils/sanitize";
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

  const rows = new Map<number, typeof nodes>();
  for (const node of nodes) {
    const list = rows.get(node.row) || [];
    list.push(node);
    rows.set(node.row, list);
  }

  const renderContent = (text: string) => {
    const parts = text.split(/\[(\d+)\]/);
    return parts.map((part, i) => {
      if (i % 2 === 0) return <span key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtml(part) }} />;
      const num = item.startNum + parseInt(part, 10) - 1;
      return (
        <input
          key={i}
          type="text"
          className="border-b-2 border-gray-400 focus:border-blue-500 bg-transparent px-1 w-24 text-center text-sm mx-0.5 focus:outline-none"
          value={answers[num] || ""}
          onChange={(e) => setAnswer(num, e.target.value)}
          placeholder={`(${num})`}
        />
      );
    });
  };

  return (
    <div className="space-y-3">
      {flowTitle ? <p className="text-sm font-semibold">{flowTitle}</p> : null}
      <div className="space-y-1">
        {Array.from(rows.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([rowNum, rowNodes]) => (
            <div key={rowNum} className="flex items-stretch justify-center gap-3">
              {rowNodes
                .sort((a, b) => a.col - b.col)
                .map((node) => (
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
          ))}
      </div>
    </div>
  );
}
