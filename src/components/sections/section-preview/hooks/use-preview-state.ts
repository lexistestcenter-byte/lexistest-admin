"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type {
  PreviewQuestion,
  ContentBlockPreview,
  QuestionGroupPreview,
  QuestionItem,
} from "../types";

interface UsePreviewStateArgs {
  open: boolean;
  instructionTitle?: string;
  instructionHtml?: string;
  contentBlocks: ContentBlockPreview[];
  questionGroups: QuestionGroupPreview[];
  questions: PreviewQuestion[];
}

export function usePreviewState({
  open,
  instructionTitle,
  instructionHtml,
  contentBlocks,
  questionGroups,
  questions,
}: UsePreviewStateArgs) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [activeNum, setActiveNum] = useState(1);
  const [activeMatchSlot, setActiveMatchSlot] = useState<number | null>(null);
  const [showInstructionPage, setShowInstructionPage] = useState(false);

  const hasInstructionPage = !!(instructionTitle || instructionHtml);

  useEffect(() => {
    if (open) {
      setAnswers({});
      setActiveNum(1);
      setActiveMatchSlot(null);
      setShowInstructionPage(hasInstructionPage);
    }
  }, [open, hasInstructionPage]);

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

  const setAnswer = useCallback((num: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [num]: value }));
  }, []);

  const toggleMultiAnswer = useCallback((num: number, value: string) => {
    setAnswers((prev) => {
      const current = prev[num] || "";
      const selected = current.split(",").filter(Boolean);
      if (selected.includes(value)) {
        return { ...prev, [num]: selected.filter((v) => v !== value).join(",") };
      }
      return { ...prev, [num]: [...selected, value].join(",") };
    });
  }, []);

  return {
    answers,
    activeNum,
    setActiveNum,
    activeMatchSlot,
    setActiveMatchSlot,
    showInstructionPage,
    setShowInstructionPage,
    hasInstructionPage,
    items,
    totalItems,
    activeItem,
    activeBlock,
    setAnswer,
    toggleMultiAnswer,
  };
}

export type PreviewState = ReturnType<typeof usePreviewState>;
