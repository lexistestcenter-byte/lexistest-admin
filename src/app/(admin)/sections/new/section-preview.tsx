"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  X,
  Clock,
  Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCdnUrl } from "@/lib/cdn";
import { formatLabels } from "@/components/sections/constants";
import { sanitizeHtml } from "@/lib/utils/sanitize";


// ─── Types ───────────────────────────────────────────────────────

export interface PreviewQuestion {
  id: string;
  question_code: string;
  question_type: string;
  question_format: string;
  content: string;
  title: string | null;
  instructions: string | null;
  options_data: Record<string, unknown> | null;
  item_count: number;
  image_url?: string | null;
  // Audio fields (Listening 문제에서 사용)
  audio_url?: string | null;
  audio_transcript?: string | null;
  // Speaking fields
  speaking_category?: string | null;
  related_part2_id?: string | null;
  depth_level?: number | null;
  target_band_min?: number | null;
  target_band_max?: number | null;
}

interface ContentBlockPreview {
  id: string;
  content_type: "passage" | "audio";
  passage_title?: string;
  passage_content?: string;
  passage_footnotes?: string;
  audio_url?: string;
  audio_transcript?: string;
}

interface QuestionGroupPreview {
  id: string;
  title: string;
  instructions: string | null;
  contentBlockId: string | null;
  startNum: number;
  endNum: number;
  questionIds: string[];
}

interface QuestionItem {
  question: PreviewQuestion;
  startNum: number;
  endNum: number;
  groupId: string;
  contentBlockId: string | null;
}

interface SectionPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionType: string;
  title: string;
  timeLimit: string;
  isPractice: boolean;
  contentBlocks: ContentBlockPreview[];
  questionGroups: QuestionGroupPreview[];
  questions: PreviewQuestion[];
}

// ─── Main Component ──────────────────────────────────────────────

export function SectionPreview({
  open,
  onOpenChange,
  sectionType,
  title,
  timeLimit,
  contentBlocks,
  questionGroups,
  questions,
}: SectionPreviewProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [activeNum, setActiveNum] = useState(1);
  const [activeMatchSlot, setActiveMatchSlot] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setAnswers({});
      setActiveNum(1);
      setActiveMatchSlot(null);
    }
  }, [open]);

  // Build question detail map
  const questionMap = useMemo(
    () => new Map(questions.map((q) => [q.id, q])),
    [questions]
  );

  // Build flat list of question items with group/block info
  const items: QuestionItem[] = useMemo(() => {
    const result: QuestionItem[] = [];
    let num = 1;

    for (const group of questionGroups) {
      for (const qId of group.questionIds) {
        const q = questionMap.get(qId);
        if (!q) continue;
        const start = num;
        const end = num + (q.item_count || 1) - 1;
        result.push({
          question: q,
          startNum: start,
          endNum: end,
          groupId: group.id,
          contentBlockId: group.contentBlockId,
        });
        num = end + 1;
      }
    }

    return result;
  }, [questionGroups, questionMap]);

  const totalItems = items.length > 0 ? items[items.length - 1].endNum : 0;

  // Find active item
  const activeItemIdx = items.findIndex(
    (item) => activeNum >= item.startNum && activeNum <= item.endNum
  );
  const activeItem = activeItemIdx >= 0 ? items[activeItemIdx] : null;

  // Content block map
  const blockMap = useMemo(
    () => new Map(contentBlocks.map((b) => [b.id, b])),
    [contentBlocks]
  );

  // Active content block (based on active question's group)
  const activeBlock = activeItem?.contentBlockId
    ? blockMap.get(activeItem.contentBlockId) || null
    : null;

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

  // ─── Format Renderers ─────────────────────────────────────────

  const renderMCQ = (item: QuestionItem) => {
    const od = item.question.options_data || {};
    const questionText = String(od.question || item.question.content || "");
    const isMultiple = item.question.question_format === 'mcq_multiple' || Boolean(od.isMultiple);
    const options = Array.isArray(od.options)
      ? (od.options as { label: string; text: string }[])
      : [];

    // item_count for mcq_multiple = maxSelections (how many answers to choose)
    const itemCount = item.question.item_count || 1;
    // For multiple choice: each selection maps to a separate question number
    const useSeparateNumbers = isMultiple && itemCount > 1;
    // Max selectable: separate numbers → itemCount, otherwise read from options_data or allow all
    const maxSelectable = useSeparateNumbers
      ? itemCount
      : isMultiple
        ? (Number(od.maxSelections) || (itemCount > 1 ? itemCount : options.length))
        : 1;

    // Get all selected labels across question numbers
    const getSelectedLabels = (): string[] => {
      if (useSeparateNumbers) {
        const labels: string[] = [];
        for (let i = 0; i < itemCount; i++) {
          const val = answers[item.startNum + i];
          if (val) labels.push(val);
        }
        return labels;
      }
      if (isMultiple) {
        return (answers[item.startNum] || "").split(",").filter(Boolean);
      }
      const v = answers[item.startNum];
      return v ? [v] : [];
    };

    const handleOptionClick = (label: string) => {
      if (!isMultiple) {
        // 단일선택: 라디오 버튼 동작
        setAnswer(item.startNum, label);
        return;
      }

      if (useSeparateNumbers) {
        // 복수선택 (별도 번호): 각 번호 슬롯에 매핑
        const selected = getSelectedLabels();
        if (selected.includes(label)) {
          for (let i = 0; i < itemCount; i++) {
            if (answers[item.startNum + i] === label) {
              setAnswer(item.startNum + i, "");
              break;
            }
          }
        } else if (selected.length < itemCount) {
          for (let i = 0; i < itemCount; i++) {
            if (!answers[item.startNum + i]) {
              setAnswer(item.startNum + i, label);
              break;
            }
          }
        }
      } else {
        // 복수선택 (단일 번호): 토글 (최대 갯수 제한)
        const selected = getSelectedLabels();
        if (!selected.includes(label) && selected.length >= maxSelectable) return;
        toggleMultiAnswer(item.startNum, label);
      }
    };

    const selectedLabels = getSelectedLabels();
    const selectionCount = selectedLabels.length;

    const numPrefix = item.startNum === item.endNum
      ? `${item.startNum}`
      : `${item.startNum}–${item.endNum}`;

    // IELTS-style: title in colored sub-header bar, question text below
    const titleText = item.question.title || "";

    return (
      <div className="space-y-3">
        {/* Sub-header with colored background (when question has a title) */}
        {titleText ? (
          <div className="bg-slate-100 border-l-4 border-slate-300 px-4 py-2.5 rounded-r">
            <p className="text-[15px]">
              <span className="font-bold mr-2">{numPrefix}</span>
              {renderFormattedText(titleText)}
            </p>
          </div>
        ) : null}

        {/* Question/instruction text */}
        {questionText ? (
          <p className={cn("text-[15px] leading-relaxed", titleText && "pl-8")}>
            {!titleText && <span className="font-bold mr-1.5">{numPrefix}</span>}
            {renderFormattedText(questionText)}
          </p>
        ) : !titleText ? (
          <p className="text-[15px] leading-relaxed">
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
                {/* 단일선택: 라디오 버튼 / 복수선택: 체크박스 */}
                {isMultiple ? (
                  <span
                    className={cn(
                      "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5",
                      isSelected
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    )}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                ) : (
                  <span
                    className={cn(
                      "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                      isSelected
                        ? "border-blue-500"
                        : "border-gray-300"
                    )}
                  >
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    )}
                  </span>
                )}
                <span>{String(opt.text)}</span>
              </button>
            );
          })}
        </div>

        {/* 복수선택 별도 번호: 각 번호별 선택 현황 */}
        {useSeparateNumbers && (
          <div className="text-xs text-gray-500 space-y-0.5 pt-1 border-t">
            {Array.from({ length: itemCount }, (_, i) => {
              const selectedLabel = answers[item.startNum + i];
              const selectedOpt = selectedLabel ? options.find(o => o.label === selectedLabel) : null;
              return (
                <div key={i} className="flex gap-2">
                  <span className="font-mono font-bold min-w-[32px]">{item.startNum + i}:</span>
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

  const renderTFNG = (item: QuestionItem) => {
    const od = item.question.options_data || {};
    let itemsList: { number: number; statement: string }[] = [];

    if (Array.isArray(od.items) && od.items.length > 0) {
      itemsList = od.items as { number: number; statement: string }[];
    } else if (Array.isArray(od.statements) && (od.statements as unknown[]).length > 0) {
      itemsList = (od.statements as { number: number; statement: string }[]);
    } else {
      // 단일 statement: content 필드를 사용
      const statement = item.question.content || String(od.statement || od.question || "");
      if (statement) {
        const count = item.question.item_count || 1;
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
          {item.question.content && (
            <p className="text-sm">{item.question.content}</p>
          )}
        </div>
      );
    }

    // IELTS-style: title sub-header if question has a title
    const titleText = item.question.title || "";
    const numPrefix =
      item.startNum === item.endNum
        ? `${item.startNum}`
        : `${item.startNum}–${item.endNum}`;

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
          const num = item.startNum + idx;
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
                      <span
                        className={cn(
                          "flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center",
                          isSelected ? "border-blue-500" : "border-gray-300"
                        )}
                      >
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
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

  const renderFillBlankTyping = (item: QuestionItem) => {
    const od = item.question.options_data || {};
    const content = String(od.content || item.question.content || "");
    if (!content) return <p className="text-sm text-gray-500">콘텐츠가 없습니다.</p>;

    const parts = content.split(/\[(\d+)\]/);
    return (
      <div className="text-sm leading-relaxed">
        <div className="whitespace-pre-wrap">
          {parts.map((part, i) => {
            if (i % 2 === 0) return <span key={i}>{part}</span>;
            const blankNum = parseInt(part, 10);
            const num = item.startNum + blankNum - 1;
            return (
              <span key={i} className="inline-flex items-center mx-0.5 align-baseline">
                <span className="text-xs font-bold text-blue-600 mr-0.5">{num}</span>
                <input
                  type="text"
                  className={cn(
                    "border-b-2 bg-transparent px-1 py-0 w-28 text-center text-sm focus:outline-none",
                    answers[num]
                      ? "border-blue-500"
                      : "border-gray-400 focus:border-blue-500"
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

  const renderFillBlankDrag = (item: QuestionItem) => {
    const od = item.question.options_data || {};
    const content = String(od.content || item.question.content || "");
    // word_bank (snake_case from DB) or wordBank (camelCase)
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
                    // blanks could be in options_data or answer_data
                    const blanks = Array.isArray(od.blanks)
                      ? (od.blanks as { number: number }[])
                      : [];
                    for (const blank of blanks) {
                      const num = item.startNum + blank.number - 1;
                      if (!answers[num]) {
                        setAnswer(num, word);
                        return;
                      }
                    }
                    // If no blanks metadata, find first empty blank by parsing content
                    for (let bi = 0; bi < (item.question.item_count || 1); bi++) {
                      const num = item.startNum + bi;
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
            const num = item.startNum + blankNum - 1;
            return (
              <span key={i} className="inline-flex items-center mx-0.5 align-baseline">
                <span className="text-xs font-bold text-blue-600 mr-0.5">{num}</span>
                <span
                  className={cn(
                    "inline-block min-w-[80px] border-b-2 px-2 py-0.5 text-center text-sm cursor-pointer select-none",
                    answers[num]
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-400"
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

  const renderMatching = (item: QuestionItem) => {
    const od = item.question.options_data || {};
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
          {item.question.content && (
            <p className="text-sm whitespace-pre-wrap">{item.question.content}</p>
          )}
        </div>
      );
    }

    const matchTitleText = item.question.title || "";
    const matchNumPrefix =
      item.startNum === item.endNum
        ? `${item.startNum}`
        : `${item.startNum}–${item.endNum}`;

    // Collect assigned option labels for duplicate prevention
    const assignedLabels = new Set<string>();
    if (!allowDuplicate) {
      matchItems.forEach((_, idx) => {
        const num = item.startNum + idx;
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
          const num = item.startNum + idx;
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
        {matchTitleText ? (
          <div className="bg-slate-100 border-l-4 border-slate-300 px-4 py-2.5 rounded-r">
            <p className="text-[15px]">
              <span className="font-bold mr-2">{matchNumPrefix}</span>
              {renderFormattedText(matchTitleText)}
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
            const num = item.startNum + idx;
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

  const renderFlowchart = (item: QuestionItem) => {
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
  };

  const renderMapLabeling = (item: QuestionItem) => {
    const od = item.question.options_data || {};
    const imageUrl = getCdnUrl(String(od.image_url || ""));
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

    const numPrefix = item.startNum === item.endNum
      ? `${item.startNum}`
      : `${item.startNum}–${item.endNum}`;

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
                  const num = item.startNum + idx;
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

  const renderEssay = (item: QuestionItem) => {
    const num = item.startNum;
    const od = item.question.options_data || {};
    const minWords = od.min_words ? Number(od.min_words) : null;
    const wordCount = (answers[num] || "").split(/\s+/).filter(Boolean).length;
    return (
      <div className="space-y-3">
        {od.condition ? (
          <p className="text-sm text-gray-500 italic">{String(od.condition)}</p>
        ) : null}
        {item.question.content ? (
          <div
            className="text-sm leading-relaxed prose prose-sm max-w-none [&_p]:my-2 [&_strong]:font-bold"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.question.content) }}
          />
        ) : null}
        {od.image_url ? (
          <div className="my-3 p-3 bg-white rounded border">
            <img src={getCdnUrl(String(od.image_url))} alt="Task" className="max-w-full h-auto rounded" />
          </div>
        ) : null}
        <textarea
          rows={10}
          placeholder="Write your answer here..."
          className="w-full text-sm border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          value={answers[num] || ""}
          onChange={(e) => setAnswer(num, e.target.value)}
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

  const renderSpeaking = (item: QuestionItem) => {
    const q = item.question;
    const fmt = q.question_format;
    const od = q.options_data || {};

    // Parse Part 2 cue card content
    const parsePart2Content = (content: string) => {
      // Expected format:
      // Topic line
      //
      // You should say:
      // - bullet 1
      // - bullet 2
      // ...
      // and explain...
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
      const imageUrl = getCdnUrl(String(od.image_url || q.image_url || ""));

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
          {q.related_part2_id && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
              연결된 Part 2: <span className="font-mono">{q.related_part2_id}</span>
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

  const renderQuestionContent = (item: QuestionItem) => {
    const fmt = item.question.question_format;
    if (fmt === "mcq_single" || fmt === "mcq_multiple") return renderMCQ(item);
    if (fmt === "true_false_ng") return renderTFNG(item);
    if (fmt === "fill_blank_typing") return renderFillBlankTyping(item);
    if (fmt === "fill_blank_drag") return renderFillBlankDrag(item);
    if (fmt === "table_completion") {
      // table_completion can be typing or drag mode
      const od = item.question.options_data || {};
      const inputMode = String(od.input_mode || "typing");
      if (inputMode === "drag") return renderFillBlankDrag(item);
      return renderFillBlankTyping(item);
    }
    if (fmt === "heading_matching" || fmt === "matching") return renderMatching(item);
    if (fmt === "flowchart") return renderFlowchart(item);
    if (fmt === "map_labeling") return renderMapLabeling(item);
    if (fmt === "essay_task1" || fmt === "essay_task2" || fmt === "essay")
      return renderEssay(item);
    if (fmt.startsWith("speaking_")) return renderSpeaking(item);
    return <p className="text-sm text-gray-500">지원하지 않는 문제 형태: {fmt}</p>;
  };

  // ─── Text Formatting Helper ─────────────────────────────────────

  const renderFormattedText = (text: string) => {
    // Parse **bold** markdown syntax
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  // ─── Collapsed Label Helper ──────────────────────────────────

  const getCollapsedLabel = (item: QuestionItem): string => {
    const q = item.question;
    if (q.title) return q.title;

    const fmt = q.question_format;
    const od = q.options_data || {};

    // Flowchart: extract title from JSON content
    if (fmt === "flowchart") {
      try {
        const parsed = JSON.parse(q.content);
        if (parsed?.title) return parsed.title;
      } catch {
        // not JSON
      }
      return "Flowchart";
    }

    // Fill-blank / table: remove [n] markers, prefer options_data.title
    if (
      ["fill_blank_typing", "fill_blank_drag", "table_completion"].includes(fmt)
    ) {
      const odTitle = String(od.title || "");
      if (odTitle) return odTitle;
      const cleaned = (q.content || "").replace(/\[\d+\]/g, "___");
      return cleaned || "—";
    }

    // Matching: show item count
    if (fmt === "matching" || fmt === "heading_matching") {
      const items = Array.isArray(od.items) ? od.items : [];
      return `매칭 (${items.length}항목)`;
    }

    return q.content || "—";
  };

  // ─── Panels ────────────────────────────────────────────────────

  const renderQuestionPanel = () => {
    if (items.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          선택된 문제가 없습니다.
        </div>
      );
    }

    // Find the active group (the one containing activeNum)
    const activeGroupData = (() => {
      for (const group of questionGroups) {
        const groupItems = items.filter((item) => item.groupId === group.id);
        if (groupItems.some((item) => activeNum >= item.startNum && activeNum <= item.endNum)) {
          return { group, items: groupItems };
        }
      }
      // Fallback: first group
      const firstGroup = questionGroups[0];
      if (firstGroup) {
        return { group: firstGroup, items: items.filter((item) => item.groupId === firstGroup.id) };
      }
      return null;
    })();

    if (!activeGroupData) return null;

    const { group: activeGroup, items: activeGroupItems } = activeGroupData;
    // Auto-generate group title from per-question number ranges
    // e.g. "Questions 5–6 and 7–8"
    const autoGroupTitle = (() => {
      const ranges: string[] = [];
      let totalNums = 0;
      for (const item of activeGroupItems) {
        totalNums += item.endNum - item.startNum + 1;
        ranges.push(
          item.startNum === item.endNum
            ? `${item.startNum}`
            : `${item.startNum}–${item.endNum}`
        );
      }
      if (ranges.length === 0) return "";
      const prefix = totalNums === 1 ? "Question" : "Questions";
      if (ranges.length === 1) return `${prefix} ${ranges[0]}`;
      if (ranges.length === 2) return `${prefix} ${ranges[0]} and ${ranges[1]}`;
      const last = ranges.pop()!;
      return `${prefix} ${ranges.join(", ")} and ${last}`;
    })();
    const groupLabel = activeGroup.title || autoGroupTitle;

    // 그룹 내 문제들 중 audio_url이 있는 첫 번째 문제의 오디오 찾기
    const groupAudioUrl = activeGroupItems.find((item) => item.question.audio_url)?.question.audio_url;

    return (
      <div className="h-full overflow-y-auto flex flex-col bg-white">
        {/* Group header — IELTS style */}
        <div className="bg-slate-200 px-5 py-4 shrink-0 border-b border-slate-300">
          <p className="text-base font-bold text-gray-900">{groupLabel}</p>
          {activeGroup.instructions && (
            <p className="text-sm text-gray-700 mt-2 leading-relaxed">
              {renderFormattedText(activeGroup.instructions)}
            </p>
          )}
        </div>

        {/* 문제 그룹 레벨 오디오 — 자동재생 */}
        {groupAudioUrl && (
          <audio src={getCdnUrl(groupAudioUrl || "")} autoPlay />
        )}

        {/* Questions in this group */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {activeGroupItems.map((item) => {
            const isItemActive =
              activeNum >= item.startNum && activeNum <= item.endNum;
            const numPrefix =
              item.startNum === item.endNum
                ? `${item.startNum}`
                : `${item.startNum}–${item.endNum}`;

            if (!isItemActive) {
              // Collapsed view — click to expand
              return (
                <button
                  key={item.question.id}
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => setActiveNum(item.startNum)}
                >
                  <span className="font-bold text-sm text-gray-500 min-w-[28px]">
                    {numPrefix}
                  </span>
                  <span className="text-sm text-gray-600 flex-1">
                    {getCollapsedLabel(item)}
                  </span>
                </button>
              );
            }

            // Expanded: full question content
            return (
              <div
                key={item.question.id}
                className="bg-white -mx-2 px-4 py-3 rounded-lg border border-blue-200 shadow-sm"
              >
                {renderQuestionContent(item)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderContentPanel = () => {
    if (activeBlock) {
      if (activeBlock.content_type === "passage") {
        return (
          <div className="h-full overflow-y-auto p-4">
            <div className="bg-white rounded-lg border p-6">
              {activeBlock.passage_title ? (
                <h2 className="text-lg font-bold mb-4">{activeBlock.passage_title}</h2>
              ) : null}
              {activeBlock.passage_content ? (
                <div className="text-sm leading-[1.8] whitespace-pre-wrap text-gray-700">
                  {activeBlock.passage_content}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">지문이 입력되지 않았습니다.</p>
              )}
              {activeBlock.passage_footnotes ? (
                <div className="mt-4 pt-3 border-t text-xs text-gray-500 italic whitespace-pre-wrap">
                  {activeBlock.passage_footnotes}
                </div>
              ) : null}
            </div>
          </div>
        );
      }

      if (activeBlock.content_type === "audio" && activeBlock.audio_url) {
        return (
          <audio src={getCdnUrl(activeBlock.audio_url || "")} autoPlay />
        );
      }
    }

    // Fallback: check if any blocks exist
    if (contentBlocks.length > 0) {
      const firstBlock = contentBlocks[0];
      if (firstBlock.content_type === "passage") {
        return (
          <div className="h-full overflow-y-auto p-4">
            <div className="bg-white rounded-lg border p-6">
              {firstBlock.passage_title ? (
                <h2 className="text-lg font-bold mb-4">{firstBlock.passage_title}</h2>
              ) : null}
              {firstBlock.passage_content ? (
                <div className="text-sm leading-[1.8] whitespace-pre-wrap text-gray-700">
                  {firstBlock.passage_content}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">지문이 입력되지 않았습니다.</p>
              )}
            </div>
          </div>
        );
      }
    }

    return null;
  };

  const renderNavigator = () => {
    if (totalItems === 0) return null;

    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 shrink-0">
        <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
          {Array.from({ length: totalItems }, (_, i) => i + 1).map((num) => {
            const isAct = num === activeNum;
            const isAnswered = Boolean(answers[num]);
            return (
              <button
                key={num}
                type="button"
                onClick={() => setActiveNum(num)}
                className={cn(
                  "h-7 min-w-[28px] px-1 rounded text-xs font-mono font-bold border transition-colors",
                  isAct
                    ? "bg-white text-blue-600 border-blue-400 shadow"
                    : isAnswered
                      ? "bg-slate-500 text-white border-slate-500"
                      : "bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600"
                )}
              >
                {num}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-slate-700"
            disabled={activeNum <= 1}
            onClick={() => setActiveNum((p) => Math.max(1, p - 1))}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-slate-700"
            disabled={activeNum >= totalItems}
            onClick={() => setActiveNum((p) => Math.min(totalItems, p + 1))}
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  // ─── Layout ────────────────────────────────────────────────────

  const hasPassageContent =
    activeBlock?.content_type === "passage" ||
    (!activeBlock && contentBlocks.some((b) => b.content_type === "passage"));
  const hasAudioContent =
    activeBlock?.content_type === "audio" ||
    (!activeBlock && contentBlocks.some((b) => b.content_type === "audio"));
  const showLeftPanel = hasPassageContent;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[98vw] sm:!max-w-[98vw] w-full h-[95vh] p-0 flex flex-col overflow-hidden gap-0 [&>button]:hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-700 text-white shrink-0">
          <DialogTitle className="text-sm font-semibold truncate">
            {title || "섹션 미리보기"}
          </DialogTitle>
          <div className="flex items-center gap-3 shrink-0">
            {timeLimit ? (
              <div className="flex items-center gap-1 text-xs text-slate-300">
                <Clock className="h-3.5 w-3.5" />
                <span>{timeLimit}:00</span>
              </div>
            ) : null}
            <Badge
              variant="outline"
              className="text-[10px] border-slate-500 text-slate-300"
            >
              {sectionType?.toUpperCase() || "—"}
            </Badge>
            <button
              type="button"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-200 overflow-hidden flex flex-col min-h-0">
          {hasAudioContent && renderContentPanel()}

          <div
            className={cn(
              "flex-1 overflow-hidden min-h-0",
              showLeftPanel ? "grid grid-cols-2" : "flex"
            )}
          >
            {showLeftPanel && (
              <div className="col-span-1 border-r border-slate-300 bg-slate-100 overflow-hidden">
                {renderContentPanel()}
              </div>
            )}
            <div
              className={cn(
                "overflow-hidden bg-slate-100",
                showLeftPanel ? "col-span-1" : "flex-1"
              )}
            >
              {renderQuestionPanel()}
            </div>
          </div>
        </div>

        {/* Navigator */}
        {renderNavigator()}
      </DialogContent>
    </Dialog>
  );
}
