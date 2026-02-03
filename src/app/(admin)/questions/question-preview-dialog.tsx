"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mic, Volume2, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────

interface QuestionData {
  id: string;
  question_code: string;
  question_type: string;
  question_format: string;
  content: string;
  title: string | null;
  instructions: string | null;
  options_data: Record<string, unknown> | null;
  answer_data: Record<string, unknown> | null;
  item_count: number;
  image_url?: string | null;
  is_practice: boolean;
  is_active: boolean;
  difficulty: string | null;
  // Audio fields (Listening 문제)
  audio_url?: string | null;
  audio_transcript?: string | null;
  // Speaking fields
  speaking_category?: string | null;
  related_part2_id?: string | null;
  related_part2_code?: string | null;
  depth_level?: number | null;
  target_band_min?: number | null;
  target_band_max?: number | null;
}

interface QuestionPreviewDialogProps {
  questionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FORMAT_LABELS: Record<string, string> = {
  mcq_multiple: "복수선택",
  mcq_single: "단일선택",
  fill_blank_typing: "빈칸(입력)",
  fill_blank_drag: "빈칸(드래그)",
  true_false_ng: "T/F/NG",
  heading_matching: "제목매칭",
  matching: "매칭",
  flowchart: "플로우차트",
  table_completion: "테이블",
  map_labeling: "지도라벨링",
  essay_task1: "Task 1",
  essay_task2: "Task 2",
  essay: "에세이",
  speaking_part1: "Part 1",
  speaking_part2: "Part 2",
  speaking_part3: "Part 3",
};

export function QuestionPreviewDialog({
  questionId,
  open,
  onOpenChange,
}: QuestionPreviewDialogProps) {
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [activeMatchSlot, setActiveMatchSlot] = useState<number | null>(null);

  // Fetch question data
  useEffect(() => {
    if (!open || !questionId) {
      setQuestion(null);
      setAnswers({});
      setActiveMatchSlot(null);
      return;
    }

    const fetchQuestion = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/questions/${questionId}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setQuestion(data.question || null);
      } catch (err) {
        console.error("Failed to load question:", err);
        setQuestion(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestion();
  }, [open, questionId]);

  const setAnswer = (num: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [num]: value }));
  };

  const toggleMultiAnswer = (num: number, value: string) => {
    setAnswers((prev) => {
      const current = prev[num] || "";
      const selected = current.split(",").filter(Boolean);
      if (selected.includes(value)) {
        return { ...prev, [num]: selected.filter((v) => v !== value).join(",") };
      }
      return { ...prev, [num]: [...selected, value].join(",") };
    });
  };

  // ─── Text Formatting ─────────────────────────────────────────

  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  // ─── Renderers ────────────────────────────────────────────────

  const renderMCQ = (q: QuestionData, startNum: number) => {
    const od = q.options_data || {};
    const questionText = String(od.question || q.content || "");
    const isMultiple = q.question_format === "mcq_multiple" || Boolean(od.isMultiple);
    const options = Array.isArray(od.options)
      ? (od.options as { label: string; text: string }[])
      : [];

    const itemCount = q.item_count || 1;
    const useSeparateNumbers = isMultiple && itemCount > 1;
    const maxSelectable = useSeparateNumbers
      ? itemCount
      : isMultiple
        ? (Number(od.maxSelections) || (itemCount > 1 ? itemCount : options.length))
        : 1;
    const endNum = startNum + itemCount - 1;

    const getSelectedLabels = (): string[] => {
      if (useSeparateNumbers) {
        const labels: string[] = [];
        for (let i = 0; i < itemCount; i++) {
          const val = answers[startNum + i];
          if (val) labels.push(val);
        }
        return labels;
      }
      if (isMultiple) {
        return (answers[startNum] || "").split(",").filter(Boolean);
      }
      const v = answers[startNum];
      return v ? [v] : [];
    };

    const handleOptionClick = (label: string) => {
      if (!isMultiple) {
        setAnswer(startNum, label);
        return;
      }
      if (useSeparateNumbers) {
        const selected = getSelectedLabels();
        if (selected.includes(label)) {
          for (let i = 0; i < itemCount; i++) {
            if (answers[startNum + i] === label) {
              setAnswer(startNum + i, "");
              break;
            }
          }
        } else if (selected.length < itemCount) {
          for (let i = 0; i < itemCount; i++) {
            if (!answers[startNum + i]) {
              setAnswer(startNum + i, label);
              break;
            }
          }
        }
      } else {
        const selected = getSelectedLabels();
        if (!selected.includes(label) && selected.length >= maxSelectable) return;
        toggleMultiAnswer(startNum, label);
      }
    };

    const selectedLabels = getSelectedLabels();
    const selectionCount = selectedLabels.length;
    const numPrefix = startNum === endNum ? `${startNum}` : `${startNum}–${endNum}`;
    const titleText = q.title || "";

    return (
      <div className="space-y-3">
        {titleText ? (
          <div className="bg-slate-100 border-l-4 border-slate-300 px-4 py-2.5 rounded-r">
            <p className="text-[15px]">
              <span className="font-bold mr-2">{numPrefix}</span>
              {renderFormattedText(titleText)}
            </p>
          </div>
        ) : null}
        {questionText ? (
          <p className={cn("text-[15px] leading-relaxed", titleText && "pl-8")}>
            {!titleText && <span className="font-bold mr-1.5">{numPrefix}</span>}
            {renderFormattedText(questionText)}
          </p>
        ) : !titleText ? (
          <p className="text-[15px]">
            <span className="font-bold mr-1.5">{numPrefix}</span>
          </p>
        ) : null}
        <div className="space-y-1.5">
          {options.map((opt) => {
            const isSelected = selectedLabels.includes(opt.label);
            const isDisabled = isMultiple && !isSelected && selectionCount >= maxSelectable;
            return (
              <button
                key={opt.label}
                type="button"
                disabled={isDisabled}
                className={cn(
                  "w-full flex items-start gap-3 p-2.5 rounded-lg border text-left transition-colors text-sm",
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : isDisabled
                      ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                )}
                onClick={() => handleOptionClick(opt.label)}
              >
                {isMultiple ? (
                  <span className={cn(
                    "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5",
                    isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                  )}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                ) : (
                  <span className={cn(
                    "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                    isSelected ? "border-blue-500" : "border-gray-300"
                  )}>
                    {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                  </span>
                )}
                <span>{String(opt.text)}</span>
              </button>
            );
          })}
        </div>
        {useSeparateNumbers && (
          <div className="text-xs text-gray-500 space-y-0.5 pt-1 border-t">
            {Array.from({ length: itemCount }, (_, i) => {
              const selectedLabel = answers[startNum + i];
              const selectedOpt = selectedLabel ? options.find(o => o.label === selectedLabel) : null;
              return (
                <div key={i} className="flex gap-2">
                  <span className="font-mono font-bold min-w-[32px]">{startNum + i}:</span>
                  <span className={selectedOpt ? "text-blue-600 font-medium" : ""}>
                    {selectedOpt ? String(selectedOpt.text) : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderTFNG = (q: QuestionData, startNum: number) => {
    const od = q.options_data || {};
    let itemsList: { number: number; statement: string }[] = [];

    if (Array.isArray(od.items) && od.items.length > 0) {
      itemsList = od.items as { number: number; statement: string }[];
    } else if (Array.isArray(od.statements) && (od.statements as unknown[]).length > 0) {
      itemsList = od.statements as { number: number; statement: string }[];
    } else {
      const statement = q.content || String(od.statement || od.question || "");
      if (statement) {
        const count = q.item_count || 1;
        itemsList = Array.from({ length: count }, (_, idx) => ({
          number: idx + 1,
          statement: idx === 0 ? statement : `Statement ${idx + 1}`,
        }));
      }
    }

    if (itemsList.length === 0) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">T/F/NG 문제 데이터를 불러올 수 없습니다.</p>
          {q.content && <p className="text-sm">{q.content}</p>}
        </div>
      );
    }

    const endNum = startNum + (q.item_count || 1) - 1;
    const titleText = q.title || "";
    const numPrefix = startNum === endNum ? `${startNum}` : `${startNum}–${endNum}`;

    return (
      <div className="space-y-4">
        {titleText ? (
          <div className="bg-slate-100 border-l-4 border-slate-300 px-4 py-2.5 rounded-r">
            <p className="text-[15px]">
              <span className="font-bold mr-2">{numPrefix}</span>
              {renderFormattedText(titleText)}
            </p>
          </div>
        ) : null}
        {itemsList.map((entry, idx) => {
          const num = startNum + idx;
          return (
            <div key={num} className="space-y-2">
              <p className="text-[15px]">
                <span className="font-bold mr-2">{num}</span>
                {String(entry.statement)}
              </p>
              <div className="flex gap-2">
                {[
                  { value: "true", label: "TRUE" },
                  { value: "false", label: "FALSE" },
                  { value: "not_given", label: "NOT GIVEN" },
                ].map((opt) => {
                  const isSelected = answers[num] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors text-sm",
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      )}
                      onClick={() => setAnswer(num, opt.value)}
                    >
                      <span className={cn(
                        "flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center",
                        isSelected ? "border-blue-500" : "border-gray-300"
                      )}>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                      </span>
                      <span className="font-medium text-xs">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderFillBlankTyping = (q: QuestionData, startNum: number) => {
    const od = q.options_data || {};
    const content = String(od.content || q.content || "");
    if (!content) return <p className="text-sm text-gray-500">콘텐츠가 없습니다.</p>;

    const parts = content.split(/\[(\d+)\]/);
    return (
      <div className="text-sm leading-relaxed">
        <div className="whitespace-pre-wrap">
          {parts.map((part, i) => {
            if (i % 2 === 0) return <span key={i}>{part}</span>;
            const blankNum = parseInt(part, 10);
            const num = startNum + blankNum - 1;
            return (
              <span key={i} className="inline-flex items-center mx-0.5 align-baseline">
                <span className="text-xs font-bold text-blue-600 mr-0.5">{num}</span>
                <input
                  type="text"
                  className={cn(
                    "border-b-2 bg-transparent px-1 py-0 w-28 text-center text-sm focus:outline-none",
                    answers[num] ? "border-blue-500" : "border-gray-400 focus:border-blue-500"
                  )}
                  value={answers[num] || ""}
                  onChange={(e) => setAnswer(num, e.target.value)}
                  placeholder="________"
                />
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFillBlankDrag = (q: QuestionData, startNum: number) => {
    const od = q.options_data || {};
    const content = String(od.content || q.content || "");
    const wordBank = Array.isArray(od.word_bank)
      ? (od.word_bank as string[])
      : Array.isArray(od.wordBank)
        ? (od.wordBank as string[])
        : [];
    if (!content) return <p className="text-sm text-gray-500">콘텐츠가 없습니다.</p>;

    const parts = content.split(/\[(\d+)\]/);
    return (
      <div className="space-y-4">
        {wordBank.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs font-semibold text-amber-700 mb-2">Word Bank</p>
            <div className="flex flex-wrap gap-1.5">
              {wordBank.map((word, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-xs bg-white border border-amber-300 rounded cursor-pointer hover:bg-amber-100 transition-colors select-none"
                  onClick={() => {
                    for (let bi = 0; bi < (q.item_count || 1); bi++) {
                      const num = startNum + bi;
                      if (!answers[num]) {
                        setAnswer(num, word);
                        return;
                      }
                    }
                  }}
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {parts.map((part, i) => {
            if (i % 2 === 0) return <span key={i}>{part}</span>;
            const blankNum = parseInt(part, 10);
            const num = startNum + blankNum - 1;
            return (
              <span key={i} className="inline-flex items-center mx-0.5 align-baseline">
                <span className="text-xs font-bold text-blue-600 mr-0.5">{num}</span>
                <span
                  className={cn(
                    "inline-block min-w-[80px] border-b-2 px-2 py-0.5 text-center text-sm cursor-pointer select-none",
                    answers[num] ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-400"
                  )}
                  onClick={() => answers[num] && setAnswer(num, "")}
                >
                  {answers[num] || "________"}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMatching = (q: QuestionData, startNum: number) => {
    const od = q.options_data || {};
    const allowDuplicate = Boolean(od.allowDuplicate);
    const options = Array.isArray(od.options)
      ? (od.options as { label: string; text: string }[])
      : [];
    const matchItems = Array.isArray(od.items)
      ? (od.items as { number: number; statement: string }[])
      : [];

    if (options.length === 0 && matchItems.length === 0) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">매칭 데이터가 없습니다.</p>
          {q.content && <p className="text-sm whitespace-pre-wrap">{q.content}</p>}
        </div>
      );
    }

    const endNum = startNum + (q.item_count || 1) - 1;
    const titleText = q.title || "";
    const numPrefix = startNum === endNum ? `${startNum}` : `${startNum}–${endNum}`;

    // Collect assigned option labels for duplicate prevention
    const assignedLabels = new Set<string>();
    if (!allowDuplicate) {
      matchItems.forEach((_, idx) => {
        const num = startNum + idx;
        const val = answers[num];
        if (val) assignedLabels.add(val);
      });
    }

    const handlePillClick = (label: string) => {
      if (activeMatchSlot !== null) {
        setAnswer(activeMatchSlot, label);
        setActiveMatchSlot(null);
      } else {
        for (let idx = 0; idx < matchItems.length; idx++) {
          const num = startNum + idx;
          if (!answers[num]) {
            setAnswer(num, label);
            return;
          }
        }
      }
    };

    const handleSlotClick = (num: number) => {
      if (answers[num]) return;
      setActiveMatchSlot(activeMatchSlot === num ? null : num);
    };

    const handleClear = (num: number) => {
      setAnswer(num, "");
      if (activeMatchSlot === num) setActiveMatchSlot(null);
    };

    return (
      <div className="space-y-4">
        {titleText ? (
          <div className="bg-slate-100 border-l-4 border-slate-300 px-4 py-2.5 rounded-r">
            <p className="text-[15px]">
              <span className="font-bold mr-2">{numPrefix}</span>
              {renderFormattedText(titleText)}
            </p>
          </div>
        ) : null}

        {/* Options Pool — clickable pills */}
        {options.length > 0 && (
          <div className="p-3 bg-slate-50 border rounded-lg">
            <p className="text-xs font-semibold text-slate-500 mb-2">보기 (Options)</p>
            <div className="flex flex-wrap gap-1.5">
              {options.map((opt) => {
                const isUsed = !allowDuplicate && assignedLabels.has(opt.label);
                return (
                  <button
                    key={opt.label}
                    type="button"
                    disabled={isUsed}
                    className={cn(
                      "px-3 py-1.5 rounded-full border text-sm font-medium transition-colors select-none",
                      isUsed
                        ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed line-through"
                        : "bg-white border-blue-300 text-blue-700 hover:bg-blue-50 cursor-pointer"
                    )}
                    onClick={() => handlePillClick(opt.label)}
                  >
                    <span className="font-bold mr-1">{opt.label}</span>
                    <span className="font-normal">{String(opt.text)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Match Items — click slot then click pill to assign */}
        <div className="space-y-2">
          {matchItems.map((entry, idx) => {
            const num = startNum + idx;
            const assignedLabel = answers[num] || "";
            const assignedOpt = assignedLabel
              ? options.find((o) => o.label === assignedLabel)
              : null;
            const isActive = activeMatchSlot === num;

            return (
              <div key={num} className="flex items-start gap-3">
                <span className="font-bold text-sm min-w-[24px] pt-2">{num}</span>
                <div className="flex-1 flex items-start gap-2">
                  <p className="text-sm flex-1 pt-2">{String(entry.statement)}</p>
                  {assignedOpt ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-300 text-sm text-blue-700 shrink-0">
                      <span className="font-bold">{assignedOpt.label}</span>
                      <button
                        type="button"
                        className="ml-0.5 p-0.5 rounded-full hover:bg-blue-200 transition-colors"
                        onClick={() => handleClear(num)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={cn(
                        "px-3 py-1.5 rounded-full border text-sm transition-colors shrink-0",
                        isActive
                          ? "border-blue-500 bg-blue-50 text-blue-600 ring-2 ring-blue-200"
                          : "border-gray-300 text-gray-400 hover:border-gray-400 hover:bg-gray-50"
                      )}
                      onClick={() => handleSlotClick(num)}
                    >
                      — 선택 —
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFlowchart = (q: QuestionData, startNum: number) => {
    const od = q.options_data || {};
    let parsedOd = od;
    if ((!od.nodes || !Array.isArray(od.nodes)) && q.content) {
      try {
        const parsed = JSON.parse(q.content);
        if (parsed && Array.isArray(parsed.nodes)) {
          parsedOd = parsed;
        }
      } catch {
        // not JSON
      }
    }
    const flowTitle = String(parsedOd.title || od.title || "");
    const nodes = Array.isArray(parsedOd.nodes)
      ? (parsedOd.nodes as { id: string; type: string; content: string; row: number; col: number; label?: string }[])
      : [];

    if (nodes.length === 0) {
      return <p className="text-sm text-gray-500">플로우차트 데이터가 없습니다.</p>;
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
        if (i % 2 === 0) return <span key={i}>{part}</span>;
        const num = startNum + parseInt(part, 10) - 1;
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
                        "p-3 border rounded text-sm text-center min-w-[140px] flex-1 max-w-[300px]",
                        node.type === "branch"
                          ? "bg-amber-50 border-amber-300"
                          : "bg-white border-gray-300"
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
  };

  const renderEssay = (q: QuestionData, startNum: number) => {
    const od = q.options_data || {};
    const minWords = od.min_words ? Number(od.min_words) : null;
    const wordCount = (answers[startNum] || "").split(/\s+/).filter(Boolean).length;
    return (
      <div className="space-y-3">
        {od.condition ? (
          <p className="text-sm text-gray-500 italic">{String(od.condition)}</p>
        ) : null}
        {q.content ? (
          <div
            className="text-sm leading-relaxed prose prose-sm max-w-none [&_p]:my-2 [&_strong]:font-bold"
            dangerouslySetInnerHTML={{ __html: q.content }}
          />
        ) : null}
        {od.image_url ? (
          <div className="my-3 p-3 bg-white rounded border">
            <img src={String(od.image_url)} alt="Task" className="max-w-full h-auto rounded" />
          </div>
        ) : null}
        <textarea
          rows={8}
          placeholder="Write your answer here..."
          className="w-full text-sm border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          value={answers[startNum] || ""}
          onChange={(e) => setAnswer(startNum, e.target.value)}
        />
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Words: {wordCount}</span>
          {minWords && (
            <span className={wordCount < minWords ? "text-red-500" : "text-green-600"}>
              최소 {minWords}단어
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderSpeaking = (q: QuestionData) => {
    const fmt = q.question_format;
    const od = q.options_data || {};

    // Parse Part 2 cue card content
    const parsePart2Content = (content: string) => {
      const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
      let topic = "";
      const bullets: string[] = [];
      let closing = "";
      let inBullets = false;

      for (const line of lines) {
        if (line.toLowerCase().startsWith("you should say")) {
          inBullets = true;
          continue;
        }
        if (line.startsWith("-") || line.startsWith("•") || line.startsWith("*")) {
          bullets.push(line.replace(/^[-•*]\s*/, ""));
          continue;
        }
        if (inBullets && (line.toLowerCase().startsWith("and explain") || line.toLowerCase().startsWith("and say"))) {
          closing = line;
          continue;
        }
        if (!inBullets && !topic) {
          topic = line;
        }
      }

      return { topic, bullets, closing };
    };

    // Band range display
    const bandRange =
      q.target_band_min || q.target_band_max
        ? `Band ${q.target_band_min || "?"}${q.target_band_max ? `-${q.target_band_max}` : ""}`
        : null;

    // Part 1: Simple question with category
    if (fmt === "speaking_part1") {
      return (
        <div className="space-y-4">
          {/* Header with category and band */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
                Part 1
              </Badge>
              {q.speaking_category && (
                <Badge variant="secondary" className="text-xs">
                  {q.speaking_category}
                </Badge>
              )}
            </div>
            {bandRange && (
              <span className="text-xs text-gray-500">{bandRange}</span>
            )}
          </div>

          {/* Question */}
          {q.content && (
            <div className="text-[15px] leading-relaxed">
              {q.content}
            </div>
          )}

          {/* Recording placeholder */}
          <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
            <Mic className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-400 mb-2">녹음 영역 (미리보기)</p>
            <Button variant="outline" size="sm" disabled>
              <Mic className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
          </div>
        </div>
      );
    }

    // Part 2: Cue Card style
    if (fmt === "speaking_part2") {
      const { topic, bullets, closing } = parsePart2Content(q.content || "");
      const imageUrl = String(od.image_url || q.image_url || "");

      return (
        <div className="space-y-4">
          {/* Cue Card */}
          <div className="border-2 border-amber-300 rounded-lg overflow-hidden bg-amber-50/30">
            {/* Card header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-amber-100 border-b border-amber-200">
              <div className="flex items-center gap-2">
                <Badge className="text-xs font-semibold bg-amber-500 hover:bg-amber-500 text-white">
                  Part 2 - Cue Card
                </Badge>
              </div>
              {bandRange && (
                <span className="text-xs font-medium text-amber-700">{bandRange}</span>
              )}
            </div>

            {/* Card body */}
            <div className="p-5 space-y-4">
              {/* Topic */}
              <p className="text-base font-semibold text-gray-900 leading-relaxed">
                {topic || q.content}
              </p>

              {/* Bullets */}
              {bullets.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">You should say:</p>
                  <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700 pl-2">
                    {bullets.map((b, i) => (
                      <li key={i} className="leading-relaxed">{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Closing */}
              {closing && (
                <p className="text-sm text-gray-700 font-medium italic">
                  {closing}
                </p>
              )}

              {/* Image */}
              {imageUrl && (
                <div className="mt-3 p-2 bg-white rounded border">
                  <img
                    src={imageUrl}
                    alt="Cue card visual"
                    className="max-w-full h-auto max-h-[200px] rounded mx-auto"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Card footer - timing info */}
            <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-700">
              준비 시간: 1분 | 발표 시간: 1-2분
            </div>
          </div>

          {/* Recording placeholder */}
          <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
            <Mic className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-400 mb-2">녹음 영역 (미리보기)</p>
            <Button variant="outline" size="sm" disabled>
              <Mic className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
          </div>
        </div>
      );
    }

    // Part 3: Discussion with depth level
    if (fmt === "speaking_part3") {
      const depthLabel = q.depth_level
        ? `Level ${q.depth_level}`
        : null;

      return (
        <div className="space-y-4">
          {/* Header with depth level and band */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-medium bg-violet-50 text-violet-700 border-violet-200">
                Part 3 - Discussion
              </Badge>
              {depthLabel && (
                <Badge variant="secondary" className="text-xs">
                  {depthLabel}
                </Badge>
              )}
            </div>
            {bandRange && (
              <span className="text-xs text-gray-500">{bandRange}</span>
            )}
          </div>

          {/* Related Part 2 reference */}
          {(q.related_part2_id || q.related_part2_code) && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
              연결된 Part 2: <span className="font-mono">{q.related_part2_code || q.related_part2_id}</span>
            </div>
          )}

          {/* Question */}
          {q.content && (
            <div className="text-[15px] leading-relaxed p-4 bg-violet-50/50 border border-violet-100 rounded-lg">
              {q.content}
            </div>
          )}

          {/* Recording placeholder */}
          <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
            <Mic className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-400 mb-2">녹음 영역 (미리보기)</p>
            <Button variant="outline" size="sm" disabled>
              <Mic className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
          </div>
        </div>
      );
    }

    // Fallback for unknown speaking format
    return (
      <div className="space-y-4">
        {q.content && (
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {q.content}
          </div>
        )}
        <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <Mic className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm text-gray-400 mb-3">녹음 영역 (미리보기)</p>
          <Button variant="outline" size="sm" disabled>
            <Mic className="mr-2 h-4 w-4" />
            Start Recording
          </Button>
        </div>
      </div>
    );
  };

  const renderMapLabeling = (q: QuestionData, startNum: number) => {
    const od = q.options_data || {};
    const imageUrl = String(od.image_url || "");
    const labels = Array.isArray(od.labels) ? od.labels as string[] : [];
    const mapItems = Array.isArray(od.items)
      ? (od.items as { number: number; statement: string }[])
      : [];

    if (!imageUrl && mapItems.length === 0) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">지도 라벨링 데이터가 없습니다.</p>
        </div>
      );
    }

    const endNum = startNum + mapItems.length - 1;
    const numPrefix = startNum === endNum ? `${startNum}` : `${startNum}–${endNum}`;

    return (
      <div className="space-y-4">
        {/* Title */}
        <div className="bg-slate-100 border-l-4 border-slate-300 px-4 py-2.5 rounded-r">
          <p className="text-[15px]">
            <span className="font-bold mr-2">{numPrefix}</span>
            The map has {labels.length} labels ({labels.join(", ")}). Choose the correct label.
          </p>
        </div>

        {/* Image + Table Layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left: Map Image */}
          <div className="border rounded-lg p-2 bg-slate-50 flex items-center justify-center min-h-[200px]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Map"
                className="max-w-full h-auto max-h-[300px] rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <p className="text-sm text-gray-400">이미지 없음</p>
            )}
          </div>

          {/* Right: Answer Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-2 py-1.5 text-left font-medium">#</th>
                  <th className="px-2 py-1.5 text-left font-medium">항목</th>
                  {labels.map((label) => (
                    <th key={label} className="px-2 py-1.5 text-center font-medium w-8">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mapItems.map((entry, idx) => {
                  const num = startNum + idx;
                  const selectedLabel = answers[num] || "";
                  return (
                    <tr key={num} className="border-t">
                      <td className="px-2 py-1.5 font-bold">{num}</td>
                      <td className="px-2 py-1.5">{String(entry.statement)}</td>
                      {labels.map((label) => (
                        <td key={label} className="px-1 py-1.5 text-center">
                          <button
                            type="button"
                            className={cn(
                              "w-6 h-6 rounded border-2 flex items-center justify-center transition-colors",
                              selectedLabel === label
                                ? "border-blue-500 bg-blue-500 text-white"
                                : "border-gray-300 hover:border-gray-400"
                            )}
                            onClick={() => setAnswer(num, selectedLabel === label ? "" : label)}
                          >
                            {selectedLabel === label && "✓"}
                          </button>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ─── Main renderer ────────────────────────────────────────────

  const renderQuestion = (q: QuestionData) => {
    const startNum = 1;
    const fmt = q.question_format;

    if (fmt === "mcq_single" || fmt === "mcq_multiple") return renderMCQ(q, startNum);
    if (fmt === "true_false_ng") return renderTFNG(q, startNum);
    if (fmt === "fill_blank_typing") return renderFillBlankTyping(q, startNum);
    if (fmt === "fill_blank_drag") return renderFillBlankDrag(q, startNum);
    if (fmt === "table_completion") {
      const od = q.options_data || {};
      const inputMode = String(od.input_mode || "typing");
      if (inputMode === "drag") return renderFillBlankDrag(q, startNum);
      return renderFillBlankTyping(q, startNum);
    }
    if (fmt === "heading_matching" || fmt === "matching") return renderMatching(q, startNum);
    if (fmt === "flowchart") return renderFlowchart(q, startNum);
    if (fmt === "map_labeling") return renderMapLabeling(q, startNum);
    if (fmt === "essay_task1" || fmt === "essay_task2" || fmt === "essay")
      return renderEssay(q, startNum);
    if (fmt.startsWith("speaking_")) return renderSpeaking(q);

    return <p className="text-sm text-gray-500">지원하지 않는 문제 형태: {fmt}</p>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-50">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-base font-semibold">
              문제 미리보기
            </DialogTitle>
            {question && (
              <>
                <Badge variant="outline" className="font-mono text-xs">
                  {question.question_code}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {FORMAT_LABELS[question.question_format] || question.question_format}
                </Badge>
                {question.item_count > 1 && (
                  <span className="text-xs text-muted-foreground">
                    {question.item_count}문항
                  </span>
                )}
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : question ? (
            <div className="space-y-4">
              {/* Audio (Listening 문제의 경우) */}
              {question.audio_url && (
                <div className="bg-sky-50 border border-sky-100 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-5 w-5 text-sky-600 flex-shrink-0" />
                    <audio controls className="w-full h-8" src={question.audio_url}>
                      오디오를 지원하지 않습니다.
                    </audio>
                  </div>
                </div>
              )}
              {/* Instructions */}
              {question.instructions && (
                <div className="text-sm text-gray-600 bg-blue-50/50 border border-blue-100 rounded-lg px-4 py-3 leading-relaxed">
                  {renderFormattedText(question.instructions)}
                </div>
              )}
              {/* Question content */}
              {renderQuestion(question)}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground text-sm">
              문제를 불러올 수 없습니다.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
