"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getCdnUrl } from "@/lib/cdn";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic } from "lucide-react";

// =============================================================================
// 통합 데이터 인터페이스
// =============================================================================
export interface QuestionPreviewData {
  question_type: string;
  question_format: string;
  content: string;
  title?: string;
  instructions?: string;
  audioUrl?: string;

  // options_data (normalized)
  options_data: Record<string, unknown>;

  // speaking specific
  speakingCategory?: string;
  relatedPart2Code?: string;
  relatedPart2Id?: string;
  depthLevel?: number;
  targetBandMin?: number;
  targetBandMax?: number;
}

// =============================================================================
// QuestionPreview 메인 컴포넌트
// =============================================================================
export function QuestionPreview({
  data,
  className,
}: {
  data: QuestionPreviewData;
  className?: string;
}) {
  const fmt = data.question_format;

  return (
    <div className={cn("flex flex-col", className)}>
      {fmt === "mcq_single" || fmt === "mcq_multiple" || fmt === "mcq" ? (
        <MCQPreview data={data} />
      ) : fmt === "true_false_ng" ? (
        <TFNGPreview data={data} />
      ) : fmt === "matching" || fmt === "heading_matching" ? (
        <MatchingPreview data={data} />
      ) : fmt === "fill_blank_typing" ? (
        <FillBlankTypingPreview data={data} />
      ) : fmt === "fill_blank_drag" ? (
        <FillBlankDragPreview data={data} />
      ) : fmt === "flowchart" ? (
        <FlowchartPreview data={data} />
      ) : fmt === "table_completion" ? (
        <TableCompletionPreview data={data} />
      ) : fmt === "map_labeling" ? (
        <MapLabelingPreview data={data} />
      ) : fmt === "essay" || fmt === "essay_task1" || fmt === "essay_task2" ? (
        <EssayPreview data={data} />
      ) : fmt.startsWith("speaking_") ? (
        <SpeakingPreview data={data} />
      ) : (
        <div className="bg-white rounded-lg border p-6 flex-1 overflow-y-auto">
          <p className="text-sm text-gray-500">지원하지 않는 문제 형태: {fmt}</p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// helpers
// =============================================================================
function od(data: QuestionPreviewData) {
  return data.options_data || {};
}

function getStr(obj: Record<string, unknown>, key: string, fallback = ""): string {
  return String(obj[key] || fallback);
}

function getArr(obj: Record<string, unknown>, key: string): unknown[] {
  return Array.isArray(obj[key]) ? (obj[key] as unknown[]) : [];
}

function getBool(obj: Record<string, unknown>, key: string): boolean {
  return Boolean(obj[key]);
}

/** Strip block-level <p> tags so content stays inline when split by [N] */
function stripBlockTags(text: string): string {
  return text
    .replace(/<\/p>\s*<p[^>]*>/gi, "<br>")
    .replace(/^<p[^>]*>/i, "")
    .replace(/<\/p>$/i, "");
}

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

// =============================================================================
// MCQ
// =============================================================================
function MCQPreview({ data }: { data: QuestionPreviewData }) {
  const o = od(data);
  const isMultiple = data.question_format === "mcq_multiple" || getBool(o, "isMultiple");
  const maxSelections = Number(o.maxSelections || 1);
  const options = getArr(o, "options") as { id?: string; label?: string; text?: string }[];
  const question = getStr(o, "question", data.content);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleOption = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (isMultiple) {
          if (next.size < maxSelections) next.add(id);
        } else {
          next.clear();
          next.add(id);
        }
      }
      return next;
    });
  };

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4 flex-1 overflow-y-auto">
      <p className="text-lg" dangerouslySetInnerHTML={{ __html: sanitizeHtml(question || "(문제 입력)") }} />
      {isMultiple && (
        <p className="text-sm text-blue-600">Choose {maxSelections} answers.</p>
      )}
      <div className="space-y-3 mt-4">
        {options.map((option, idx) => {
          const optId = option.id || String(idx);
          const isSelected = selected.has(optId);
          const label = option.label || String.fromCharCode(65 + idx);
          return (
            <button
              key={optId}
              type="button"
              onClick={() => toggleOption(optId)}
              className={cn(
                "flex items-center gap-3 p-3 border rounded-lg cursor-pointer w-full text-left transition-colors",
                isSelected ? "bg-primary/10 border-primary" : "hover:bg-slate-50"
              )}
            >
              {isMultiple ? (
                <div
                  className={cn(
                    "w-5 h-5 border-2 rounded flex items-center justify-center shrink-0 transition-colors",
                    isSelected ? "border-primary bg-primary text-white" : "border-gray-300"
                  )}
                >
                  {isSelected && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              ) : (
                <div
                  className={cn(
                    "w-5 h-5 border-2 rounded-full flex items-center justify-center shrink-0 transition-colors",
                    isSelected ? "border-primary" : "border-gray-300"
                  )}
                >
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
              )}
              <span>{option.text || `(선택지 ${label})`}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// TFNG
// =============================================================================
function TFNGPreview({ data }: { data: QuestionPreviewData }) {
  const o = od(data);
  const items = getArr(o, "items") as { id?: string; statement?: string }[];

  const [answers, setAnswers] = useState<Record<number, string>>({});

  const toggleAnswer = (idx: number, label: string) => {
    setAnswers((prev) => ({
      ...prev,
      [idx]: prev[idx] === label ? "" : label,
    }));
  };

  // Single-item mode (legacy: content holds the statement)
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6 space-y-4 flex-1 overflow-y-auto">
        <div className="p-4 border rounded-lg">
          <p className="mb-4" dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.content || "(진술문 입력)") }} />
          <div className="flex gap-4">
            {["TRUE", "FALSE", "NOT GIVEN"].map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleAnswer(0, label)}
                className="flex items-center gap-2 cursor-pointer text-sm"
              >
                <div
                  className={cn(
                    "w-5 h-5 border-2 rounded-full flex items-center justify-center shrink-0 transition-colors",
                    answers[0] === label ? "border-primary" : "border-gray-300"
                  )}
                >
                  {answers[0] === label && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6 space-y-3 flex-1 overflow-y-auto">
      {items.map((item, idx) => (
        <div key={item.id || idx} className="p-4 border rounded-lg">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
              {idx + 1}
            </span>
            <p className="flex-1" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.statement || "(진술문)") }} />
          </div>
          <div className="flex gap-4 mt-3 ml-9">
            {["TRUE", "FALSE", "NOT GIVEN"].map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleAnswer(idx, label)}
                className="flex items-center gap-2 cursor-pointer text-sm"
              >
                <div
                  className={cn(
                    "w-5 h-5 border-2 rounded-full flex items-center justify-center shrink-0 transition-colors",
                    answers[idx] === label ? "border-primary" : "border-gray-300"
                  )}
                >
                  {answers[idx] === label && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Fill Blank Typing
// =============================================================================
function FillBlankTypingPreview({ data }: { data: QuestionPreviewData }) {
  const o = od(data);
  const contentTitle = getStr(o, "title", data.title || "");
  const inputStyle = getStr(o, "input_style", "editor");
  const items = getArr(o, "items").map(String);

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
          <span key={index} className="inline-flex items-center mx-1 align-middle">
            <input
              type="text"
              value={answers[num] || ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [num]: e.target.value }))}
              className="w-28 h-7 border-b-2 border-primary px-1 text-sm outline-none bg-transparent"
              placeholder={`(${num})`}
            />
          </span>
        );
      }
      return <span key={index} dangerouslySetInnerHTML={{ __html: sanitizeHtml(part) }} />;
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

// =============================================================================
// Fill Blank Drag
// =============================================================================
function FillBlankDragPreview({ data }: { data: QuestionPreviewData }) {
  const o = od(data);
  const contentTitle = getStr(o, "title", data.title || "");
  const wordBank = getArr(o, "word_bank").map(String);
  const allowDuplicate = getBool(o, "allowDuplicate") || getBool(o, "allow_duplicate");
  const blankMode = getStr(o, "blank_mode", "word");
  const isSentenceMode = blankMode === "sentence";
  const inputStyle = getStr(o, "input_style", "editor");
  const items = getArr(o, "items").map(String);

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
          <span key={index} className="inline-flex items-center mx-0.5 align-middle">
            <span
              className={`inline-flex items-center justify-center min-w-[120px] h-8 border-2 rounded px-2 text-sm transition-colors ${
                placed
                  ? "bg-green-50 border-green-400 text-green-800 cursor-pointer"
                  : draggedWord
                    ? "border-dashed border-primary bg-primary/5"
                    : "border-slate-300 bg-white text-slate-400"
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(num)}
              onDoubleClick={() => placed && clearWord(num)}
              title={placed ? "더블클릭하여 제거" : ""}
            >
              {placed || num}
            </span>
          </span>
        );
      }
      return <span key={index} dangerouslySetInnerHTML={{ __html: sanitizeHtml(part) }} />;
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

// =============================================================================
// Table Completion
// =============================================================================
function TableCompletionPreview({ data }: { data: QuestionPreviewData }) {
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
    let processed = stripBlockTags(sanitizeHtml(html));

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

// =============================================================================
// Matching
// =============================================================================
function MatchingPreview({ data }: { data: QuestionPreviewData }) {
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
    const html = stripBlockTags(sanitizeHtml(data.content || ""));
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
      return <span key={index} dangerouslySetInnerHTML={{ __html: sanitizeHtml(part) }} />;
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

// =============================================================================
// Flowchart
// =============================================================================
function FlowchartPreview({ data }: { data: QuestionPreviewData }) {
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

// =============================================================================
// Map Labeling
// =============================================================================
function MapLabelingPreview({ data }: { data: QuestionPreviewData }) {
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
        <div className="text-sm text-muted-foreground leading-relaxed shrink-0" dangerouslySetInnerHTML={{ __html: sanitizeHtml(passage) }} />
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

// =============================================================================
// Essay (Writing)
// =============================================================================
function EssayPreview({ data }: { data: QuestionPreviewData }) {
  const o = od(data);
  const contentTitle = getStr(o, "title", data.title || "Writing Task");
  const condition = getStr(o, "condition");
  const imageUrl = getCdnUrl(getStr(o, "image_url", ""));
  const minWords = Number(o.min_words || 0);

  const [text, setText] = useState("");
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const meetsMinimum = minWords > 0 ? wordCount >= minWords : true;

  return (
    <div className="bg-white rounded-lg overflow-hidden border flex flex-col flex-1 min-h-0">
      <div className="px-4 py-3 border-b bg-slate-50 shrink-0">
        <h2 className="font-bold text-lg">{contentTitle}</h2>
        {condition && <p className="text-sm text-muted-foreground mt-1">{condition}</p>}
      </div>
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 p-4 bg-[#d8dce8] overflow-y-auto">
          {data.content ? (
            <div
              className="prose prose-sm max-w-none text-sm [&_p]:my-3 [&_p:empty]:min-h-[1em] [&_p:has(br:only-child)]:min-h-[1em] [&_strong]:font-bold"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.content) }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">(작문 주제 입력)</p>
          )}
          {imageUrl && (
            <div className="mt-4 p-3 bg-white rounded border">
              <img src={imageUrl} alt="Task" className="max-w-full h-auto rounded" />
            </div>
          )}
        </div>
        <div className="flex-1 p-4 flex flex-col">
          <textarea
            spellCheck={false}
            className="flex-1 w-full border border-blue-400 rounded p-3 text-sm resize-none bg-white"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="mt-2 text-sm text-right shrink-0">
            <span className="text-foreground">
              Word Count: {wordCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Speaking
// =============================================================================
function SpeakingPreview({ data }: { data: QuestionPreviewData }) {
  const fmt = data.question_format;
  const o = od(data);

  const bandRange =
    data.targetBandMin || data.targetBandMax
      ? `Band ${data.targetBandMin || "?"}${data.targetBandMax ? `-${data.targetBandMax}` : ""}`
      : null;

  // Part 1
  if (fmt === "speaking_part1") {
    return (
      <div className="space-y-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
              Part 1
            </Badge>
            {data.speakingCategory && (
              <Badge variant="secondary" className="text-xs">{data.speakingCategory}</Badge>
            )}
          </div>
          {bandRange && <span className="text-xs text-gray-500">{bandRange}</span>}
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-lg" dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.content || "(질문 입력)") }} />
        </div>
        <RecordingArea />
      </div>
    );
  }

  // Part 2 - Cue Card
  if (fmt === "speaking_part2") {
    const topic = getStr(o, "topic", data.content);
    const points = getArr(o, "points").map(String);
    const imageUrl = getCdnUrl(getStr(o, "image_url", ""));

    return (
      <div className="space-y-4 flex-1 overflow-y-auto">
        <div className="border-2 border-amber-300 rounded-lg overflow-hidden bg-amber-50/30">
          <div className="flex items-center justify-between px-4 py-2.5 bg-amber-100 border-b border-amber-200">
            <Badge className="text-xs font-semibold bg-amber-500 hover:bg-amber-500 text-white">
              Part 2 - Cue Card
            </Badge>
            {bandRange && <span className="text-xs font-medium text-amber-700">{bandRange}</span>}
          </div>
          <div className="p-5 space-y-4">
            <p className="text-base font-semibold text-gray-900">{topic || "(주제 입력)"}</p>
            {points.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">You should say:</p>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700 pl-2">
                  {points.map((point, i) => (
                    <li key={i} className="leading-relaxed">{point || `(포인트 ${i + 1})`}</li>
                  ))}
                </ul>
              </div>
            )}
            {imageUrl && (
              <div className="mt-3 p-2 bg-white rounded border">
                <img src={imageUrl} alt="Cue card visual" className="max-w-full h-auto max-h-[200px] rounded mx-auto" />
              </div>
            )}
          </div>
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-700">
            준비 시간: 1분 | 발표 시간: 1-2분
          </div>
        </div>
        <RecordingArea />
      </div>
    );
  }

  // Part 3
  if (fmt === "speaking_part3") {
    const depthLabel = data.depthLevel ? `Level ${data.depthLevel}` : null;

    return (
      <div className="space-y-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-medium bg-violet-50 text-violet-700 border-violet-200">
              Part 3 - Discussion
            </Badge>
            {depthLabel && <Badge variant="secondary" className="text-xs">{depthLabel}</Badge>}
          </div>
          {bandRange && <span className="text-xs text-gray-500">{bandRange}</span>}
        </div>
        {(data.relatedPart2Id || data.relatedPart2Code) && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
            연결된 Part 2: <span className="font-mono">{data.relatedPart2Code || data.relatedPart2Id}</span>
          </div>
        )}
        <div className="bg-white rounded-lg border p-6">
          <p className="text-lg" dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.content || "(질문 입력)") }} />
        </div>
        <RecordingArea />
      </div>
    );
  }

  // Fallback
  return (
    <div className="bg-white rounded-lg border p-6 flex-1 overflow-y-auto">
      <p dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.content || "") }} />
    </div>
  );
}

function RecordingArea() {
  return (
    <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
      <Mic className="h-8 w-8 text-gray-300 mb-2" />
      <p className="text-sm text-gray-400 mb-2">녹음 영역 (미리보기)</p>
      <Button variant="outline" size="sm" disabled>
        <Mic className="mr-2 h-4 w-4" />
        Start Recording
      </Button>
    </div>
  );
}

// =============================================================================
// 변환 함수: QuestionTab → QuestionPreviewData
// =============================================================================
export interface QuestionTabLike {
  format: string | null;
  // MCQ
  mcqQuestion: string;
  mcqOptions: { id: string; label: string; text: string; isCorrect: boolean }[];
  mcqIsMultiple: boolean;
  mcqMaxSelections: number;
  // TFNG
  tfngStatement: string;
  // Matching
  matchingTitle: string;
  matchingAllowDuplicate: boolean;
  matchingOptions: { id: string; label: string; text: string }[];
  // Fill blank
  contentTitle: string;
  contentHtml: string;
  blanks: { id: string; number: number; answer: string; alternatives: string[] }[];
  wordBank: string[];
  blankMode: "word" | "sentence";
  fillBlankDragAllowDuplicate: boolean;
  // Table
  tableInputMode: "typing" | "drag";
  // Flowchart
  flowchartTitle: string;
  flowchartNodes: { id: string; type: string; content: string; row: number; col: number; label?: string }[];
  // Writing
  writingTitle: string;
  writingCondition: string;
  writingPrompt: string;
  writingImageUrl: string;
  writingMinWords: string;
  // Speaking
  speakingQuestion: string;
  cueCardTopic: string;
  cueCardPoints: string[];
  cueCardImageUrl: string;
  speakingCategory: string;
  relatedPart2Id: string;
  depthLevel: number;
  targetBandMin: string;
  targetBandMax: string;
  // Audio
  audioUrl: string;
  // Map labeling
  mapLabelingTitle: string;
  mapLabelingPassage: string;
  mapLabelingImageUrl: string;
  mapLabelingLabels: string[];
  mapLabelingItems: { id: string; number: number; statement: string; correctLabel: string }[];
  // Common
  instructions: string;
}

export function tabToPreviewData(
  tab: QuestionTabLike,
  questionType: string,
): QuestionPreviewData {
  const fmt = tab.format || "";
  let content = "";
  const options_data: Record<string, unknown> = {};

  if (fmt === "mcq" || fmt === "mcq_single" || fmt === "mcq_multiple") {
    content = tab.mcqQuestion;
    options_data.question = tab.mcqQuestion;
    options_data.isMultiple = tab.mcqIsMultiple;
    options_data.maxSelections = tab.mcqMaxSelections;
    options_data.options = tab.mcqOptions.map((o) => ({
      id: o.id,
      label: o.label,
      text: o.text,
    }));
  } else if (fmt === "true_false_ng") {
    content = tab.tfngStatement;
  } else if (fmt === "matching") {
    content = tab.contentHtml;
    options_data.title = tab.matchingTitle;
    options_data.allowDuplicate = tab.matchingAllowDuplicate;
    options_data.options = tab.matchingOptions.map((o) => ({
      id: o.id,
      label: o.label,
      text: o.text,
    }));
  } else if (fmt === "fill_blank_typing") {
    content = tab.contentHtml;
    options_data.title = tab.contentTitle;
  } else if (fmt === "fill_blank_drag") {
    content = tab.contentHtml;
    options_data.title = tab.contentTitle;
    options_data.word_bank = tab.wordBank;
    options_data.blank_mode = tab.blankMode;
    options_data.allowDuplicate = tab.fillBlankDragAllowDuplicate;
  } else if (fmt === "table_completion") {
    content = tab.contentHtml;
    options_data.title = tab.contentTitle;
    options_data.input_mode = tab.tableInputMode;
    options_data.word_bank = tab.wordBank;
  } else if (fmt === "flowchart") {
    options_data.title = tab.flowchartTitle;
    options_data.nodes = tab.flowchartNodes;
  } else if (fmt === "map_labeling") {
    content = tab.mapLabelingPassage;
    options_data.title = tab.mapLabelingTitle;
    options_data.image_url = tab.mapLabelingImageUrl;
    options_data.labels = tab.mapLabelingLabels;
    options_data.items = tab.mapLabelingItems.map((i) => ({
      id: i.id,
      number: i.number,
      statement: i.statement,
    }));
  } else if (fmt === "essay") {
    content = tab.writingPrompt;
    options_data.title = tab.writingTitle;
    options_data.condition = tab.writingCondition;
    options_data.image_url = tab.writingImageUrl;
    options_data.min_words = tab.writingMinWords ? parseInt(tab.writingMinWords) : 0;
  } else if (fmt === "speaking_part1" || fmt === "speaking_part3") {
    content = tab.speakingQuestion;
  } else if (fmt === "speaking_part2") {
    content = tab.cueCardTopic;
    options_data.topic = tab.cueCardTopic;
    options_data.points = tab.cueCardPoints;
    options_data.image_url = tab.cueCardImageUrl;
  }

  return {
    question_type: questionType,
    question_format: fmt,
    content,
    title: tab.contentTitle || tab.writingTitle || tab.flowchartTitle || tab.mapLabelingTitle || undefined,
    instructions: tab.instructions || undefined,
    audioUrl: tab.audioUrl || undefined,
    options_data,
    speakingCategory: tab.speakingCategory || undefined,
    relatedPart2Id: tab.relatedPart2Id || undefined,
    depthLevel: tab.depthLevel || undefined,
    targetBandMin: tab.targetBandMin ? parseFloat(tab.targetBandMin) : undefined,
    targetBandMax: tab.targetBandMax ? parseFloat(tab.targetBandMax) : undefined,
  };
}

// =============================================================================
// 변환 함수: API QuestionData → QuestionPreviewData
// =============================================================================
export interface ApiQuestionData {
  id: string;
  question_code: string;
  question_type: string;
  question_format: string;
  content: string;
  title: string | null;
  instructions: string | null;
  options_data: Record<string, unknown> | null;
  answer_data: Record<string, unknown> | null;
  image_url?: string | null;
  audio_url?: string | null;
  speaking_category?: string | null;
  related_part2_id?: string | null;
  related_part2_code?: string | null;
  depth_level?: number | null;
  target_band_min?: number | null;
  target_band_max?: number | null;
}

export function apiToPreviewData(q: ApiQuestionData): QuestionPreviewData {
  return {
    question_type: q.question_type,
    question_format: q.question_format,
    content: q.content || "",
    title: q.title || undefined,
    instructions: q.instructions || undefined,
    audioUrl: q.audio_url || undefined,
    options_data: q.options_data || {},
    speakingCategory: q.speaking_category || undefined,
    relatedPart2Id: q.related_part2_id || undefined,
    relatedPart2Code: q.related_part2_code || undefined,
    depthLevel: q.depth_level || undefined,
    targetBandMin: q.target_band_min || undefined,
    targetBandMax: q.target_band_max || undefined,
  };
}
