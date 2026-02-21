"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import type { RendererProps } from "../types";

export function FillBlankTypingRenderer({ item, answers, setAnswer, activeNum, setActiveNum }: RendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const setAnswerRef = useRef(setAnswer);
  const setActiveNumRef = useRef(setActiveNum);
  // Track whether activeNum change originated from user focus (not Navigator)
  const activeNumFromFocusRef = useRef(false);
  useEffect(() => { setAnswerRef.current = setAnswer; }, [setAnswer]);
  useEffect(() => { setActiveNumRef.current = setActiveNum; }, [setActiveNum]);

  // Event delegation: listen for input and focusin events on the container
  // Use stable refs so this effect only runs once (on mount)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleInput = (e: Event) => {
      const input = e.target as HTMLInputElement;
      if (input.tagName === "INPUT" && input.dataset.num) {
        setAnswerRef.current(parseInt(input.dataset.num), input.value);
      }
    };
    const handleFocusIn = (e: FocusEvent) => {
      const input = e.target as HTMLInputElement;
      if (input.tagName === "INPUT" && input.dataset.num && setActiveNumRef.current) {
        // Mark as user-initiated so useEffect([activeNum]) skips re-focusing
        activeNumFromFocusRef.current = true;
        setActiveNumRef.current(parseInt(input.dataset.num));
      }
    };
    container.addEventListener("input", handleInput);
    container.addEventListener("focusin", handleFocusIn);
    return () => {
      container.removeEventListener("input", handleInput);
      container.removeEventListener("focusin", handleFocusIn);
    };
  }, []);

  // Navigator → input focus: scroll to and focus the input matching activeNum
  // Skip when the change came from user clicking/focusing an input directly
  useEffect(() => {
    if (activeNumFromFocusRef.current) {
      activeNumFromFocusRef.current = false;
      return;
    }
    if (activeNum == null) return;
    const container = containerRef.current;
    if (!container) return;
    const input = container.querySelector(`input[data-num="${activeNum}"]`) as HTMLInputElement | null;
    if (input && document.activeElement !== input) {
      input.scrollIntoView({ block: "nearest", behavior: "smooth" });
      input.focus();
    }
  }, [activeNum]);

  // Sync answers to DOM inputs — skip the focused input to prevent
  // overwriting while the user is typing (race: answers state lags behind DOM)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.querySelectorAll<HTMLInputElement>("input[data-num]").forEach((input) => {
      const num = parseInt(input.dataset.num || "0");
      const val = answers[num] || "";
      // Never overwrite the currently focused input — user may have typed
      // ahead and the state hasn't caught up yet
      if (input !== document.activeElement && input.value !== val) {
        input.value = val;
      }
      if (val) {
        input.style.color = "#2563eb";
        input.style.borderBottomColor = "#3b82f6";
        input.style.borderBottomStyle = "solid";
      } else {
        input.style.color = "";
        input.style.borderBottomColor = "#d1d5db";
        input.style.borderBottomStyle = "dashed";
      }
    });
  }, [answers]);

  const od = item.question.options_data || {};
  const content = String(od.content || item.question.content || "");

  // Memoize the processed HTML so it only changes when content/startNum change.
  // innerHTML is set via useEffect below, outside React's render cycle.
  const tableHtml = useMemo(() => {
    if (item.question.question_format !== "table_completion" || !content) return "";
    let html = sanitizeHtmlForDisplay(content);
    html = html.replace(/\[(\d+)\]/g, (_, numStr) => {
      const blankNum = parseInt(numStr);
      const num = item.startNum + blankNum - 1;
      return `<input type="text" data-num="${num}" style="width:80px;height:28px;border:none;border-bottom:2px solid #3b82f6;background:transparent;padding:0 4px;font-size:14px;text-align:center;outline:none" placeholder="(${num})" />`;
    });
    return html;
  }, [content, item.startNum, item.question.question_format]);

  const normalHtml = useMemo(() => {
    if (item.question.question_format === "table_completion" || !content) return "";
    let html = sanitizeHtmlForDisplay(content);
    html = html.replace(/\[(\d+)\]/g, (_, numStr) => {
      const blankNum = parseInt(numStr);
      const num = item.startNum + blankNum - 1;
      return `<input type="text" data-num="${num}" style="display:inline;width:100px;border:none;border-bottom:1px dashed #d1d5db;background:transparent;padding:0 4px;font-size:14px;text-align:center;outline:none;vertical-align:baseline" placeholder="${num}" />`;
    });
    return html;
  }, [content, item.startNum, item.question.question_format]);

  const prevTableHtmlRef = useRef("");
  const prevNormalHtmlRef = useRef("");

  // Set innerHTML outside React render cycle to prevent DOM replacement
  useEffect(() => {
    if (containerRef.current && tableHtml && tableHtml !== prevTableHtmlRef.current) {
      containerRef.current.innerHTML = tableHtml;
      prevTableHtmlRef.current = tableHtml;
    }
  }, [tableHtml]);

  useEffect(() => {
    if (containerRef.current && normalHtml && normalHtml !== prevNormalHtmlRef.current) {
      containerRef.current.innerHTML = normalHtml;
      prevNormalHtmlRef.current = normalHtml;
    }
  }, [normalHtml]);

  if (!content) return <p className="text-sm text-gray-500">No content available.</p>;

  // table_completion
  if (item.question.question_format === "table_completion") {
    return (
      <div
        ref={containerRef}
        className="text-sm leading-relaxed [&_table]:border-collapse [&_table]:w-full [&_table]:table-fixed [&_td]:border [&_td]:border-slate-300 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-slate-300 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-slate-100 [&_th]:font-semibold"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="text-sm leading-[2] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_p]:my-2 [&_p:first-child]:mt-0"
    />
  );
}

export function FillBlankDragRenderer({ item, answers, setAnswer, activeNum, setActiveNum }: RendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const answersRef = useRef(answers);
  const draggedWordRef = useRef<string | null>(null);
  const setActiveNumRef = useRef(setActiveNum);
  const [draggedWord, setDraggedWord] = useState<string | null>(null);

  // Keep refs in sync
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { draggedWordRef.current = draggedWord; }, [draggedWord]);
  useEffect(() => { setActiveNumRef.current = setActiveNum; }, [setActiveNum]);

  // Event delegation: dragover, drop, click on slots
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleDragOver = (e: DragEvent) => {
      if ((e.target as HTMLElement).closest("[data-slot]")) e.preventDefault();
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const target = (e.target as HTMLElement).closest("[data-slot]") as HTMLElement | null;
      if (target && draggedWordRef.current) {
        const num = parseInt(target.dataset.slot || "0");
        setAnswer(num, draggedWordRef.current);
        setDraggedWord(null);
        setActiveNumRef.current?.(num);
      }
    };
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-slot]") as HTMLElement | null;
      if (target) {
        const num = parseInt(target.dataset.slot || "0");
        setActiveNumRef.current?.(num);
        if (answersRef.current[num]) setAnswer(num, "");
      }
    };
    container.addEventListener("dragover", handleDragOver);
    container.addEventListener("drop", handleDrop);
    container.addEventListener("click", handleClick);
    return () => {
      container.removeEventListener("dragover", handleDragOver);
      container.removeEventListener("drop", handleDrop);
      container.removeEventListener("click", handleClick);
    };
  }, [setAnswer]);

  // Navigator → slot scroll: scroll to the slot matching activeNum
  useEffect(() => {
    if (activeNum == null) return;
    const container = containerRef.current;
    if (!container) return;
    const slot = container.querySelector(`[data-slot="${activeNum}"]`) as HTMLElement | null;
    if (slot) {
      slot.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeNum]);

  // Sync slot content and styles
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.querySelectorAll<HTMLElement>("[data-slot]").forEach((el) => {
      const num = parseInt(el.dataset.slot || "0");
      const val = answers[num] || "";
      el.textContent = val || String(num);
      if (val) {
        el.style.borderBottomColor = "#3b82f6";
        el.style.borderBottomStyle = "solid";
        el.style.backgroundColor = "#eff6ff";
        el.style.color = "#1d4ed8";
      } else {
        el.style.borderBottomColor = "#d1d5db";
        el.style.borderBottomStyle = "dashed";
        el.style.backgroundColor = "";
        el.style.color = "#9ca3af";
      }
    });
  }, [answers]);

  const od = item.question.options_data || {};
  const content = String(od.content || item.question.content || "");
  // word_bank (snake_case from DB) or wordBank (camelCase)
  const wordBank = Array.isArray(od.word_bank)
    ? (od.word_bank as string[])
    : Array.isArray(od.wordBank)
      ? (od.wordBank as string[])
      : [];
  const allowDuplicate = Boolean(od.allow_duplicate || od.allowDuplicate);
  const rawBankLabel = od.bank_label !== undefined ? String(od.bank_label) : od.bankLabel !== undefined ? String(od.bankLabel) : undefined;
  const bankLabelText = rawBankLabel !== undefined ? rawBankLabel : "Word Bank";
  const bankLayout = (String(od.bank_layout || od.bankLayout || "row")) as "row" | "column";
  if (!content) return <p className="text-sm text-gray-500">No content available.</p>;

  const usedWords = Object.values(answers).filter(Boolean);
  const availableWords = allowDuplicate
    ? wordBank.filter((w) => w)
    : wordBank.filter((w) => w && !usedWords.includes(w));

  // table_completion: existing approach (click-to-fill)
  if (item.question.question_format === "table_completion") {
    let processed = sanitizeHtmlForDisplay(content);
    processed = processed.replace(/\[(\d+)\]/g, (_, numStr) => {
      const blankNum = parseInt(numStr);
      const num = item.startNum + blankNum - 1;
      return `<span style="display:inline-block;min-width:80px;border-bottom:2px dashed #d1d5db;padding:0 4px;text-align:center;font-size:14px;color:#9ca3af">(${num})</span>`;
    });
    return (
      <div className="space-y-4">
        <div
          className="text-sm leading-relaxed [&_table]:border-collapse [&_table]:w-full [&_table]:table-fixed [&_td]:border [&_td]:border-slate-300 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-slate-300 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-slate-100 [&_th]:font-semibold"
          dangerouslySetInnerHTML={{ __html: processed }}
        />
        {wordBank.length > 0 && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-xs font-semibold text-slate-600 mb-2">Word Bank</p>
            <div className="flex flex-wrap gap-1.5">
              {availableWords.map((word, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  onClick={() => {
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
              {availableWords.length === 0 && wordBank.length > 0 && (
                <span className="text-xs text-muted-foreground">모든 단어가 사용되었습니다</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Memoize the processed HTML so draggedWord state changes don't cause
  // React to replace the DOM (which would wipe slot content set by useEffect).
  const processed = useMemo(() => {
    let html = sanitizeHtmlForDisplay(content);
    html = html.replace(/\[(\d+)\]/g, (_, numStr) => {
      const blankNum = parseInt(numStr);
      const num = item.startNum + blankNum - 1;
      return `<span data-slot="${num}" style="display:inline-block;min-width:80px;border-bottom:1px dashed #d1d5db;padding:0 4px;text-align:center;font-size:14px;cursor:pointer;vertical-align:baseline;color:#9ca3af">${num}</span>`;
    });
    return html;
  }, [content, item.startNum]);

  const prevProcessedRef = useRef("");
  useEffect(() => {
    if (containerRef.current && processed && processed !== prevProcessedRef.current) {
      containerRef.current.innerHTML = processed;
      prevProcessedRef.current = processed;
    }
  }, [processed]);

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="text-sm leading-[2] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_p]:my-2 [&_p:first-child]:mt-0"
      />
      {wordBank.length > 0 && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          {bankLabelText && <p className="text-xs font-semibold text-slate-600 mb-2">{bankLabelText}</p>}
          <div className={bankLayout === "column" ? "flex flex-col gap-1.5" : "flex flex-wrap gap-1.5"}>
            {availableWords.map((word, i) => (
              <span
                key={i}
                draggable
                onDragStart={() => setDraggedWord(word)}
                onDragEnd={() => setDraggedWord(null)}
                className={cn(
                  "px-2.5 py-1 text-xs bg-white border border-slate-300 rounded cursor-grab hover:bg-slate-100 transition-all select-none",
                  draggedWord === word ? "opacity-50 scale-95" : ""
                )}
              >
                {word}
              </span>
            ))}
            {availableWords.length === 0 && wordBank.length > 0 && (
              <span className="text-xs text-muted-foreground">모든 단어가 사용되었습니다</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
