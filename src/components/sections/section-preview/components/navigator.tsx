"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { QuestionGroupPreview, QuestionItem } from "../types";

interface NavigatorProps {
  totalItems: number;
  activeNum: number;
  setActiveNum: (num: number | ((prev: number) => number)) => void;
  answers: Record<number, string>;
  isSpeaking?: boolean;
  completedSpeakingItems?: Set<string>;
  questionGroups?: QuestionGroupPreview[];
  items?: QuestionItem[];
}

export function Navigator({
  totalItems, activeNum, setActiveNum, answers,
  isSpeaking, completedSpeakingItems, questionGroups, items,
}: NavigatorProps) {
  if (totalItems === 0) return null;

  const findGroupForNum = (num: number) => {
    if (!items || !questionGroups) return null;
    const item = items.find(it => num >= it.startNum && num <= it.endNum);
    if (!item) return null;
    return questionGroups.find(g => g.id === item.groupId) || null;
  };

  const canNavigate = (targetNum: number): boolean => {
    if (!isSpeaking || !questionGroups || !items || !completedSpeakingItems) return true;

    const currentGroup = findGroupForNum(activeNum);
    const targetGroup = findGroupForNum(targetNum);

    if (!currentGroup || !targetGroup || currentGroup.id === targetGroup.id) return true;

    // Find group indices
    const currentIdx = questionGroups.findIndex(g => g.id === currentGroup.id);
    const targetIdx = questionGroups.findIndex(g => g.id === targetGroup.id);

    // Block going back to a completed section
    if (targetIdx < currentIdx) return false;

    // Going forward: check all groups up to and including current are complete
    for (let i = 0; i <= currentIdx; i++) {
      const group = questionGroups[i];
      const groupQuestionIds = group.questionIds;
      for (const qId of groupQuestionIds) {
        if (!completedSpeakingItems.has(qId)) return false;
      }
    }
    return true;
  };

  const handleNavigate = (num: number) => {
    if (!canNavigate(num)) {
      const currentGroup = findGroupForNum(activeNum);
      const targetGroup = findGroupForNum(num);
      const currentIdx = questionGroups?.findIndex(g => g.id === currentGroup?.id) ?? -1;
      const targetIdx = questionGroups?.findIndex(g => g.id === targetGroup?.id) ?? -1;

      if (targetIdx < currentIdx) {
        toast.warning("You cannot return to a completed section.");
      } else {
        toast.warning("Please complete or skip all questions in the current section before moving on.");
      }
      return;
    }
    setActiveNum(num);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 shrink-0">
      <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
        {Array.from({ length: totalItems }, (_, i) => i + 1).map((num) => {
          const isAct = num === activeNum;
          const isAnswered = Boolean(answers[num]);
          const isSpeakingCompleted = isSpeaking && (() => {
            const item = items?.find(it => num >= it.startNum && num <= it.endNum);
            return item ? completedSpeakingItems?.has(item.question.id) : false;
          })();
          return (
            <button
              key={num}
              type="button"
              onClick={() => handleNavigate(num)}
              className={cn(
                "h-7 min-w-[28px] px-1 rounded text-xs font-mono font-bold border transition-colors",
                isAct
                  ? "bg-white text-blue-600 border-blue-400 shadow"
                  : isSpeakingCompleted
                    ? "bg-green-600 text-white border-green-600"
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
          onClick={() => { const prev = Math.max(1, activeNum - 1); handleNavigate(prev); }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-white hover:bg-slate-700"
          disabled={activeNum >= totalItems}
          onClick={() => { const next = Math.min(totalItems, activeNum + 1); handleNavigate(next); }}
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
