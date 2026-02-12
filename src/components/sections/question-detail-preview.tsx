"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";

interface QuestionDetailPreviewProps {
  question: {
    question_format: string;
    content: string;
    instructions: string | null;
    options_data: Record<string, unknown> | null;
    answer_data: Record<string, unknown> | null;
  };
}

// Replace [N] markers with styled blank placeholders
function renderBlankPlaceholders(text: string): React.ReactNode {
  // Convert \n to <br> so line breaks render in dangerouslySetInnerHTML
  const processed = text.replace(/\n/g, "<br>");
  const parts = processed.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (match) {
      return (
        <span
          key={i}
          className="inline-flex items-center justify-center min-w-[40px] h-5 px-1 mx-0.5 border border-dashed border-blue-400 rounded bg-blue-50 text-blue-600 text-[10px] font-mono"
        >
          {match[1]}
        </span>
      );
    }
    return <span key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(part) }} />;
  });
}

// Strip wrapping block tags (p, div) but preserve inner HTML
function stripBlockTags(html: string): string {
  return html
    .replace(/^<(p|div)[^>]*>/i, "")
    .replace(/<\/(p|div)>$/i, "");
}

// Render table HTML with [N] replaced by styled blank indicators
function renderTableHtml(html: string): string {
  let processed = stripBlockTags(sanitizeHtmlForDisplay(html));
  processed = processed.replace(
    /\[(\d+)\]/g,
    (_, num) =>
      `<span style="display:inline-flex;align-items:center;justify-content:center;min-width:40px;height:20px;padding:0 4px;margin:0 2px;border:1px dashed #60a5fa;border-radius:3px;background:#eff6ff;color:#2563eb;font-size:10px;font-family:monospace">${num}</span>`
  );
  return processed;
}

export function QuestionDetailPreview({ question }: QuestionDetailPreviewProps) {
  const od = question.options_data || {};
  const ad = question.answer_data || {};
  const fmt = question.question_format;

  const mcqOptions: { label: string; text: string; isCorrect?: boolean }[] =
    Array.isArray(od.options)
      ? (od.options as { label: string; text: string; isCorrect?: boolean }[])
      : [];

  const tfngItems: { number: number; statement: string }[] =
    Array.isArray(od.items)
      ? (od.items as { number: number; statement: string }[])
      : [];

  const matchOptions: { label: string; text: string }[] =
    Array.isArray(od.options)
      ? (od.options as { label: string; text: string }[])
      : [];

  const matchItems: { number: number; statement: string }[] =
    Array.isArray(od.items)
      ? (od.items as { number: number; statement: string }[])
      : [];

  const wordBank: string[] = Array.isArray(od.word_bank)
    ? (od.word_bank as string[])
    : Array.isArray(od.wordBank)
      ? (od.wordBank as string[])
      : [];

  const blanks: { number: number; answer: string }[] = Array.isArray(
    (ad as Record<string, unknown>).blanks
  )
    ? ((ad as Record<string, unknown>).blanks as {
        number: number;
        answer: string;
      }[])
    : [];

  const tfngAnswer = String(
    (ad as Record<string, unknown>)?.answer ?? "\u2014"
  );
  const essayCondition = od.condition ? String(od.condition) : null;

  // ─── Flowchart: parse JSON content ───
  const isFlowchart = fmt === "flowchart";
  let flowchartTitle = "";
  let flowchartNodes: { id: string; type: string; content: string; row: number; col: number; label?: string }[] = [];

  if (isFlowchart && question.content) {
    try {
      const parsed = JSON.parse(question.content);
      flowchartTitle = parsed.title || od.title as string || "";
      flowchartNodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
    } catch {
      // If content is not JSON, check options_data for nodes
      flowchartTitle = (od.title as string) || "";
      flowchartNodes = Array.isArray(od.nodes)
        ? (od.nodes as typeof flowchartNodes)
        : [];
    }
  }

  // ─── Table Completion ───
  const isTableCompletion = fmt === "table_completion";
  const tableTitle = isTableCompletion ? (od.title as string || "") : "";

  // ─── Content rendering logic ───
  // For flowchart: don't render content as HTML (it's JSON)
  // For table_completion: render content as styled HTML table
  const shouldRenderContentAsHtml = !isFlowchart && !isTableCompletion;

  return (
    <div className="mt-2 p-3 bg-white border rounded-lg text-sm space-y-2">
      {question.instructions && (
        <div
          className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded prose prose-xs max-w-none [&_p]:my-2 [&_p:empty]:min-h-[1em] [&_p:has(br:only-child)]:min-h-[1em]"
          dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(question.instructions) }}
        />
      )}

      {shouldRenderContentAsHtml && question.content && (
        <div
          className="text-gray-700 leading-relaxed text-xs prose prose-xs max-w-none [&_p]:my-2 [&_p:empty]:min-h-[1em] [&_p:has(br:only-child)]:min-h-[1em]"
          dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(question.content) }}
        />
      )}

      {/* Flowchart visual */}
      {isFlowchart && (
        <div className="space-y-1">
          {flowchartTitle && (
            <div className="text-xs font-bold text-center text-gray-700 pb-1">{flowchartTitle}</div>
          )}
          <div className="flex flex-col items-center gap-0">
            {(() => {
              const rowMap = new Map<number, typeof flowchartNodes>();
              for (const n of flowchartNodes) {
                const row = n.row ?? 0;
                if (!rowMap.has(row)) rowMap.set(row, []);
                rowMap.get(row)!.push(n);
              }
              for (const [, group] of rowMap) {
                group.sort((a, b) => (a.col ?? 0) - (b.col ?? 0));
              }
              const sortedRows = [...rowMap.keys()].sort((a, b) => a - b);

              return sortedRows.map((row, rowIndex) => {
                const group = rowMap.get(row)!;
                const isBranch = group.length > 1 || group[0]?.type === "branch";
                return (
                  <div key={row} className="w-full">
                    {rowIndex > 0 && (
                      <div className="flex justify-center py-0.5">
                        <div className="flex flex-col items-center">
                          <div className="w-px h-2 bg-slate-400" />
                          <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-transparent border-t-slate-400" />
                        </div>
                      </div>
                    )}
                    {isBranch ? (
                      <div className="flex justify-center gap-1.5">
                        {group.map((node) => (
                          <div
                            key={node.id}
                            className="px-2 py-1.5 rounded border border-blue-300 bg-blue-50 min-w-[80px] max-w-[140px] text-center text-[10px]"
                          >
                            {node.label && (
                              <div className="font-semibold text-blue-700 text-[9px] mb-0.5">{node.label}</div>
                            )}
                            <div className="leading-tight">{renderBlankPlaceholders(node.content || "")}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <div className="px-2 py-1.5 rounded border border-slate-300 bg-slate-50 min-w-[100px] max-w-[200px] text-center text-[10px]">
                          {group[0]?.label && (
                            <div className="font-semibold text-slate-600 text-[9px] mb-0.5">{group[0].label}</div>
                          )}
                          <div className="leading-tight">{renderBlankPlaceholders(group[0]?.content || "")}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Table Completion visual */}
      {isTableCompletion && question.content && (
        <div className="space-y-1">
          {tableTitle && (
            <div className="text-xs font-bold text-gray-700 pb-1">{tableTitle}</div>
          )}
          <div
            className="text-[11px] leading-relaxed [&_table]:border-collapse [&_table]:w-full [&_td]:border [&_td]:border-slate-300 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-slate-300 [&_th]:px-2 [&_th]:py-1 [&_th]:bg-slate-100 [&_th]:font-semibold [&_th]:text-[10px]"
            dangerouslySetInnerHTML={{ __html: renderTableHtml(question.content) }}
          />
        </div>
      )}

      {/* MCQ */}
      {(fmt === "mcq_single" || fmt === "mcq_multiple") &&
        mcqOptions.length > 0 && (
          <div className="space-y-1">
            {mcqOptions.map((opt) => (
              <div
                key={opt.label}
                className={cn(
                  "flex gap-2 text-xs p-1.5 rounded",
                  opt.isCorrect
                    ? "bg-green-50 text-green-700"
                    : "text-gray-600"
                )}
              >
                <span className="font-bold min-w-[20px]">{opt.label}</span>
                <span>{opt.text}</span>
                {opt.isCorrect && (
                  <Badge className="ml-auto text-[9px] bg-green-100 text-green-700 border-green-300">
                    Correct
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

      {/* T/F/NG */}
      {fmt === "true_false_ng" && (
        <div className="space-y-1">
          {tfngItems.length > 0 ? (
            tfngItems.map((item) => (
              <div
                key={item.number}
                className="text-xs text-gray-600 p-1 flex gap-1"
              >
                <span className="font-bold shrink-0">{item.number}.</span>
                <span dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(String(item.statement)) }} />
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500">
              Answer: {tfngAnswer}
            </div>
          )}
        </div>
      )}

      {/* 매칭 */}
      {(fmt === "matching" || fmt === "heading_matching") && (
        <div className="space-y-2">
          {matchOptions.length > 0 && (
            <div className="text-xs space-y-0.5">
              <span className="font-semibold text-gray-500">Options:</span>
              {matchOptions.map((opt) => (
                <div key={opt.label} className="flex gap-1 pl-2">
                  <span className="font-bold text-blue-600">{opt.label}</span>
                  <span className="text-gray-600">{opt.text}</span>
                </div>
              ))}
            </div>
          )}
          {matchItems.length > 0 && (
            <div className="text-xs space-y-0.5">
              <span className="font-semibold text-gray-500">Items:</span>
              {matchItems.map((item) => (
                <div key={item.number} className="pl-2 text-gray-600 flex gap-1">
                  <span className="font-bold shrink-0">{item.number}.</span>
                  <span dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(String(item.statement)) }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 빈칸 - word bank */}
      {(fmt === "fill_blank_drag" || fmt === "table_completion") &&
        wordBank.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-gray-500 mr-1">Word Bank:</span>
            {wordBank.map((w, i) => (
              <span
                key={i}
                className="text-xs px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded"
              >
                {w}
              </span>
            ))}
          </div>
        )}

      {/* 정답 (빈칸 계열) */}
      {(fmt === "fill_blank_typing" ||
        fmt === "fill_blank_drag" ||
        fmt === "flowchart" ||
        fmt === "table_completion") &&
        blanks.length > 0 && (
          <div className="text-xs space-y-0.5">
            <span className="font-semibold text-gray-500">Answers:</span>
            {blanks.map((b) => (
              <div key={b.number} className="pl-2 text-green-700">
                [{b.number}] {b.answer}
              </div>
            ))}
          </div>
        )}

      {/* 에세이 조건 */}
      {fmt === "essay" && essayCondition && (
        <div className="text-xs text-gray-500">Condition: {essayCondition}</div>
      )}
    </div>
  );
}
