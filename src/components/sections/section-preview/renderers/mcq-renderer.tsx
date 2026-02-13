"use client";

import { cn } from "@/lib/utils";
import type { RendererProps } from "../types";
import { renderFormattedText } from "../types";

interface MCQRendererProps extends RendererProps {
  toggleMultiAnswer: (num: number, value: string) => void;
}

export function MCQRenderer({ item, answers, setAnswer, toggleMultiAnswer }: MCQRendererProps) {
  const od = item.question.options_data || {};
  const questionText = String(od.question || item.question.content || "");
  const isMultiple = item.question.question_format === 'mcq_multiple' || Boolean(od.isMultiple);
  const displayAlphabet = od.displayMode === "alphabet";
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

  return (
    <div className="space-y-3">
      {/* Question/instruction text */}
      {questionText ? (
        <p className="text-[15px] leading-relaxed">
          <span className="font-bold mr-1.5">{numPrefix}</span>
          {renderFormattedText(questionText)}
        </p>
      ) : (
        <p className="text-[15px] leading-relaxed">
          <span className="font-bold mr-1.5">{numPrefix}</span>
        </p>
      )}

      {displayAlphabet ? (
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => {
            const isSelected = selectedLabels.includes(opt.label);
            const isDisabled = isMultiple && !isSelected && selectionCount >= maxSelectable;
            return (
              <button
                key={opt.label}
                type="button"
                disabled={isDisabled}
                className={cn(
                  "w-10 h-10 rounded-full border-2 font-bold text-sm transition-colors",
                  isSelected
                    ? "border-blue-500 bg-blue-500 text-white"
                    : isDisabled
                      ? "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
                      : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                )}
                onClick={() => handleOptionClick(opt.label)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      ) : (
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
      )}

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
}
