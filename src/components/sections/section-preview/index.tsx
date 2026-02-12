"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";

import type { SectionPreviewProps } from "./types";
import { isHeadingMatchingQuestion } from "./types";
import { usePreviewState } from "./hooks/use-preview-state";
import { QuestionPanel } from "./components/question-panel";
import { ContentPanel } from "./components/content-panel";
import { Navigator } from "./components/navigator";
import { HeadingMatchingPassage } from "./components/heading-matching-passage";

export type { PreviewQuestion } from "./types";

export function SectionPreview({
  open,
  onOpenChange,
  sectionType,
  title,
  timeLimit,
  isLoading,
  instructionTitle,
  instructionHtml,
  contentBlocks,
  questionGroups,
  questions,
}: SectionPreviewProps) {
  const state = usePreviewState({
    open,
    instructionTitle,
    instructionHtml,
    contentBlocks,
    questionGroups,
    questions,
  });

  const {
    answers,
    activeNum,
    setActiveNum,
    activeMatchSlot,
    setActiveMatchSlot,
    showInstructionPage,
    setShowInstructionPage,
    items,
    totalItems,
    activeItem,
    activeBlock,
    setAnswer,
    toggleMultiAnswer,
  } = state;

  // ─── Layout ────────────────────────────────────────────────────

  const blockHasPassageData = (b: { passage_title?: string; passage_content?: string }) =>
    !!(b.passage_title || b.passage_content);
  // Check ANY content block for passage data (not just active block)
  const hasPassageContent = contentBlocks.some(blockHasPassageData);
  const hasAudioContent =
    activeBlock?.content_type === "audio" ||
    (!activeBlock && contentBlocks.some((b) => b.content_type === "audio"));
  // Heading matching has its own 2-column layout, so skip section-level left panel
  const activeIsHeadingMatching = activeItem
    ? isHeadingMatchingQuestion(activeItem.question)
    : false;
  const showLeftPanel = true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-none !w-screen !h-screen !rounded-none !p-0 !gap-0 !inset-0 !translate-x-0 !translate-y-0 !top-0 !left-0 flex flex-col overflow-hidden [&>button]:hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-700 text-white shrink-0">
          <DialogTitle className="text-sm font-semibold truncate">
            {title || "Section Preview"}
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
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              <p className="text-sm text-slate-500">Loading preview data...</p>
            </div>
          ) : showInstructionPage ? (
            <div className="flex-1 overflow-y-auto flex items-start justify-center p-8">
              <div className="bg-white rounded-lg border shadow-sm max-w-2xl w-full p-8 space-y-4">
                {instructionTitle && (
                  <h2 className="text-xl font-bold text-center">{instructionTitle}</h2>
                )}
                {instructionHtml && (
                  <div
                    className="prose prose-sm max-w-none [&_p]:my-2 [&_p:empty]:min-h-[1em] [&_p:has(br:only-child)]:min-h-[1em]"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(instructionHtml) }}
                  />
                )}
                <div className="flex justify-center pt-4">
                  <button
                    type="button"
                    className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
                    onClick={() => setShowInstructionPage(false)}
                  >
                    Start
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {hasAudioContent && !showLeftPanel && (
                <ContentPanel activeBlock={activeBlock} contentBlocks={contentBlocks} />
              )}

              <div
                className={cn(
                  "flex-1 overflow-hidden min-h-0",
                  showLeftPanel ? "grid grid-cols-2" : "flex"
                )}
              >
                {showLeftPanel && (
                  <div className="col-span-1 border-r border-slate-300 bg-slate-100 overflow-y-auto">
                    {activeIsHeadingMatching && activeItem
                      ? <HeadingMatchingPassage item={activeItem} answers={answers} setAnswer={setAnswer} />
                      : <ContentPanel activeBlock={activeBlock} contentBlocks={contentBlocks} />}
                  </div>
                )}
                <div
                  className={cn(
                    "overflow-hidden bg-slate-100",
                    showLeftPanel ? "col-span-1" : "flex-1"
                  )}
                >
                  <QuestionPanel
                    items={items}
                    questionGroups={questionGroups}
                    activeNum={activeNum}
                    setActiveNum={setActiveNum}
                    answers={answers}
                    setAnswer={setAnswer}
                    toggleMultiAnswer={toggleMultiAnswer}
                    activeMatchSlot={activeMatchSlot}
                    setActiveMatchSlot={setActiveMatchSlot}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Navigator */}
        {!showInstructionPage && (
          <Navigator
            totalItems={totalItems}
            activeNum={activeNum}
            setActiveNum={setActiveNum}
            answers={answers}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
