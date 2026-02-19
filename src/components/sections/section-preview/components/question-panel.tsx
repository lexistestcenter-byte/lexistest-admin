"use client";

import { getCdnUrl } from "@/lib/cdn";
import type { QuestionItem, QuestionGroupPreview } from "../types";
import { renderFormattedText, renderBlockHtml, getCollapsedLabel } from "../types";
import { QuestionRouter } from "../renderers/question-router";

interface QuestionPanelProps {
  items: QuestionItem[];
  questionGroups: QuestionGroupPreview[];
  activeNum: number;
  setActiveNum: (num: number) => void;
  answers: Record<number, string>;
  setAnswer: (num: number, value: string) => void;
  toggleMultiAnswer: (num: number, value: string) => void;
  activeMatchSlot: number | null;
  setActiveMatchSlot: (num: number | null) => void;
  contentAudioPlaying?: boolean;
}

export function QuestionPanel({
  items,
  questionGroups,
  activeNum,
  setActiveNum,
  answers,
  setAnswer,
  toggleMultiAnswer,
  activeMatchSlot,
  setActiveMatchSlot,
  contentAudioPlaying,
}: QuestionPanelProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No questions selected.
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
    <div className="h-full overflow-hidden flex flex-col bg-white">
      {/* Group header — IELTS style */}
      <div className="bg-slate-200 px-5 py-4 shrink-0 border-b border-slate-300">
        <p className="text-base font-bold text-gray-900">{groupLabel}</p>
        {activeGroup.instructions && (
          <div className="text-sm text-gray-700 mt-2 leading-relaxed">
            {renderBlockHtml(activeGroup.instructions)}
          </div>
        )}
      </div>

      {/* 문제 그룹 레벨 오디오 — 자동재생 */}
      {groupAudioUrl && (
        <audio src={getCdnUrl(groupAudioUrl || "")} autoPlay />
      )}

      {/* Questions in this group */}
      {(() => {
        // Speaking Part 1/3 master-detail: render full-height without scroll wrapper
        const activeSpeakingItem = activeGroupItems.find((it) => {
          const isActive = activeNum >= it.startNum && activeNum <= it.endNum;
          const fmt = it.question.question_format;
          return isActive && (fmt === "speaking_part1" || fmt === "speaking_part3");
        });

        if (activeSpeakingItem) {
          return (
            <div className="flex-1 overflow-hidden min-h-0">
              <QuestionRouter
                item={activeSpeakingItem}
                answers={answers}
                setAnswer={setAnswer}
                toggleMultiAnswer={toggleMultiAnswer}
                activeMatchSlot={activeMatchSlot}
                setActiveMatchSlot={setActiveMatchSlot}
                contentAudioPlaying={contentAudioPlaying}
              />
            </div>
          );
        }

        return (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
            {activeGroup.subInstructions && (
              <div className="bg-white border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-800 leading-relaxed">
                {renderBlockHtml(activeGroup.subInstructions)}
              </div>
            )}
            {activeGroupItems.map((item) => {
              const isItemActive =
                activeNum >= item.startNum && activeNum <= item.endNum;
              const numPrefix =
                item.startNum === item.endNum
                  ? `${item.startNum}`
                  : `${item.startNum}–${item.endNum}`;

              if (!isItemActive) {
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

              return (
                <div
                  key={item.question.id}
                  className="bg-white -mx-2 px-4 py-3 rounded-lg border border-blue-200 shadow-sm"
                >
                  <QuestionRouter
                    item={item}
                    answers={answers}
                    setAnswer={setAnswer}
                    toggleMultiAnswer={toggleMultiAnswer}
                    activeMatchSlot={activeMatchSlot}
                    setActiveMatchSlot={setActiveMatchSlot}
                    contentAudioPlaying={contentAudioPlaying}
                  />
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
