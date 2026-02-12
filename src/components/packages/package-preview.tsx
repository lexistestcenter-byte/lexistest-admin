"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Clock, Loader2, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

import type {
  PreviewQuestion,
  ContentBlockPreview,
  QuestionGroupPreview,
  QuestionItem,
} from "@/components/sections/section-preview/types";
import { isHeadingMatchingQuestion } from "@/components/sections/section-preview/types";
import { QuestionPanel } from "@/components/sections/section-preview/components/question-panel";
import { ContentPanel } from "@/components/sections/section-preview/components/content-panel";
import { HeadingMatchingPassage } from "@/components/sections/section-preview/components/heading-matching-passage";

/* ─── Types ─── */

interface SectionInfo {
  id: string;
  title: string;
  section_type: string;
  time_limit_minutes: number | null;
}

interface LoadedSectionData {
  instructionTitle: string;
  instructionHtml: string;
  contentBlocks: ContentBlockPreview[];
  questionGroups: QuestionGroupPreview[];
  questions: PreviewQuestion[];
}

interface PackagePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageTitle: string;
  sectionIds: string[];
  allSections: SectionInfo[];
  instructionTitle?: string;
  instructionContent?: string;
}

/* ─── Timer Hook ─── */

function useTimer(initialMinutes: number | null, running: boolean) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    setRemainingSeconds(initialMinutes ? initialMinutes * 60 : 0);
  }, [initialMinutes]);

  useEffect(() => {
    if (!running || remainingSeconds <= 0) return;
    const id = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [running, remainingSeconds]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return { remainingSeconds, display };
}

/* ─── Component ─── */

export function PackagePreview({
  open,
  onOpenChange,
  packageTitle,
  sectionIds,
  allSections,
  instructionTitle: pkgInstructionTitle,
  instructionContent: pkgInstructionContent,
}: PackagePreviewProps) {
  // Package-level instruction page (shown before any section)
  const hasPkgInstruction = !!(pkgInstructionTitle || pkgInstructionContent);
  const [showPkgInstructionPage, setShowPkgInstructionPage] = useState(false);

  // Section navigation (forward-only)
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Section data cache
  const cacheRef = useRef<Map<string, LoadedSectionData>>(new Map());
  const [currentData, setCurrentData] = useState<LoadedSectionData | null>(null);
  const [loadingSection, setLoadingSection] = useState(false);

  // Per-section preview state
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [activeNum, setActiveNum] = useState(1);
  const [activeMatchSlot, setActiveMatchSlot] = useState<number | null>(null);
  const [showInstructionPage, setShowInstructionPage] = useState(false);

  // Confirm dialog for unanswered questions
  const [showConfirmNext, setShowConfirmNext] = useState(false);

  // Ordered sections
  const orderedSections = useMemo(
    () => sectionIds.map((id) => allSections.find((s) => s.id === id)).filter((s): s is SectionInfo => !!s),
    [sectionIds, allSections]
  );

  const activeSection = orderedSections[activeSectionIdx] || null;
  const isLastSection = activeSectionIdx >= orderedSections.length - 1;

  // Timer
  const timerRunning = !loadingSection && !showInstructionPage && !showPkgInstructionPage && !completed && !!currentData;
  const { display: timerDisplay, remainingSeconds } = useTimer(
    activeSection?.time_limit_minutes ?? null,
    timerRunning
  );

  // Reset everything on dialog open
  useEffect(() => {
    if (open) {
      setShowPkgInstructionPage(hasPkgInstruction);
      setActiveSectionIdx(0);
      setCurrentData(null);
      setAnswers({});
      setActiveNum(1);
      setActiveMatchSlot(null);
      setShowInstructionPage(false);
      setCompleted(false);
      setShowConfirmNext(false);
      cacheRef.current.clear();
    }
  }, [open, hasPkgInstruction]);

  // Load section data
  const loadSectionData = useCallback(async (sectionId: string) => {
    const cached = cacheRef.current.get(sectionId);
    if (cached) {
      setCurrentData(cached);
      setShowInstructionPage(!!(cached.instructionTitle || cached.instructionHtml));
      setLoadingSection(false);
      return;
    }

    setLoadingSection(true);
    try {
      const [sectionDetailRes, structRes] = await Promise.all([
        api.get<{ instruction_title?: string; instruction_html?: string }>(`/api/sections/${sectionId}`),
        api.get<{
          content_blocks: Record<string, unknown>[];
          question_groups: {
            id: string;
            title?: string;
            instructions?: string;
            content_block_id?: string;
            items?: { question_id: string }[];
          }[];
        }>(`/api/sections/${sectionId}/structure`),
      ]);

      const sectionDetail = sectionDetailRes.data;
      const instructionTitle = sectionDetail?.instruction_title || "";
      const instructionHtml = sectionDetail?.instruction_html || "";

      const structData = structRes.data;
      if (structRes.error || !structData) throw new Error(structRes.error || "Failed to load structure");

      const blocks: ContentBlockPreview[] = (structData.content_blocks || []).map((b: Record<string, unknown>) => ({
        id: b.id as string,
        content_type: b.content_type as "passage" | "audio",
        passage_title: (b.passage_title as string) || undefined,
        passage_content: (b.passage_content as string) || undefined,
        passage_footnotes: (b.passage_footnotes as string) || undefined,
        audio_url: (b.audio_url as string) || undefined,
        audio_transcript: (b.audio_transcript as string) || undefined,
      }));

      const groups = structData.question_groups || [];
      const allQuestionIds: string[] = groups.flatMap(
        (g) => (g.items || []).map((i) => i.question_id)
      );

      let questions: PreviewQuestion[] = [];
      if (allQuestionIds.length > 0) {
        const uniqueIds = [...new Set(allQuestionIds)];
        const details = await Promise.all(
          uniqueIds.map(async (qId) => {
            const { data, error } = await api.get<{ question: PreviewQuestion }>(`/api/questions/${qId}`);
            if (error || !data) return null;
            return data.question;
          })
        );
        const detailMap = new Map(
          details.filter((d): d is PreviewQuestion => d !== null).map((d) => [d.id, d])
        );
        questions = allQuestionIds
          .map((qId) => detailMap.get(qId))
          .filter((q): q is PreviewQuestion => q !== undefined);
      }

      let num = 1;
      const questionMap = new Map(questions.map((q) => [q.id, q]));
      const numberedGroups: QuestionGroupPreview[] = groups.map((g) => {
        const qIds = (g.items || []).map((i) => i.question_id);
        const startNum = num;
        for (const qId of qIds) {
          const q = questionMap.get(qId);
          num += q ? q.item_count || 1 : 1;
        }
        return {
          id: g.id,
          title: g.title || "",
          instructions: g.instructions || null,
          contentBlockId: g.content_block_id || null,
          startNum,
          endNum: num - 1,
          questionIds: qIds,
        };
      });

      const loaded: LoadedSectionData = {
        instructionTitle,
        instructionHtml,
        contentBlocks: blocks,
        questionGroups: numberedGroups,
        questions,
      };

      cacheRef.current.set(sectionId, loaded);
      setCurrentData(loaded);
      setShowInstructionPage(!!(instructionTitle || instructionHtml));
    } catch (error) {
      console.error("Error loading section preview:", error);
      toast.error("Failed to load preview data.");
      setCurrentData(null);
    } finally {
      setLoadingSection(false);
    }
  }, []);

  // Load data when active section changes
  useEffect(() => {
    if (!open || !activeSection || completed || showPkgInstructionPage) return;
    setAnswers({});
    setActiveNum(1);
    setActiveMatchSlot(null);
    loadSectionData(activeSection.id);
  }, [open, activeSection?.id, loadSectionData, completed, showPkgInstructionPage]);

  // Build items from current data
  const { items, totalItems } = useMemo(() => {
    if (!currentData) return { items: [] as QuestionItem[], totalItems: 0 };

    const questionMap = new Map(currentData.questions.map((q) => [q.id, q]));
    const result: QuestionItem[] = [];
    let num = 1;

    for (const group of currentData.questionGroups) {
      for (const qId of group.questionIds) {
        const q = questionMap.get(qId);
        if (!q) continue;
        const start = num;
        const end = num + (q.item_count || 1) - 1;
        result.push({ question: q, startNum: start, endNum: end, groupId: group.id, contentBlockId: group.contentBlockId });
        num = end + 1;
      }
    }

    const total = result.length > 0 ? result[result.length - 1].endNum : 0;
    return { items: result, totalItems: total };
  }, [currentData]);

  // Derived: active item & block (depends on activeNum which changes frequently)
  const activeItem = useMemo(() => {
    const idx = items.findIndex((item) => activeNum >= item.startNum && activeNum <= item.endNum);
    return idx >= 0 ? items[idx] : null;
  }, [items, activeNum]);

  const activeBlock = useMemo(() => {
    if (!currentData || !activeItem?.contentBlockId) return null;
    const blockMap = new Map(currentData.contentBlocks.map((b) => [b.id, b]));
    return blockMap.get(activeItem.contentBlockId) || null;
  }, [currentData, activeItem]);

  // Count unanswered questions
  const unansweredCount = useMemo(() => {
    if (totalItems === 0) return 0;
    let count = 0;
    for (let i = 1; i <= totalItems; i++) {
      if (!answers[i]) count++;
    }
    return count;
  }, [answers, totalItems]);

  // Handlers
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

  // Move to next section (forward only)
  const proceedToNextSection = useCallback(() => {
    setShowConfirmNext(false);
    if (isLastSection) {
      setCompleted(true);
    } else {
      setActiveSectionIdx((prev) => prev + 1);
    }
  }, [isLastSection]);

  const handleNextSection = useCallback(() => {
    setShowConfirmNext(true);
  }, []);

  // Layout helpers
  const isWritingQuestion = activeItem
    ? ["essay_task1", "essay_task2", "essay"].includes(activeItem.question.question_format)
    : false;
  const writingContent = isWritingQuestion ? activeItem?.question.content : null;
  const writingImageUrl = isWritingQuestion
    ? String(activeItem?.question.options_data?.image_url || "") || null
    : null;
  const activeIsHeadingMatching = activeItem ? isHeadingMatchingQuestion(activeItem.question) : false;

  if (orderedSections.length === 0) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-none !w-screen !h-screen !rounded-none !p-0 !gap-0 !inset-0 !translate-x-0 !translate-y-0 !top-0 !left-0 flex flex-col overflow-hidden [&>button]:hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-700 text-white shrink-0">
            <DialogTitle className="text-sm font-semibold truncate">
              {showPkgInstructionPage || completed ? packageTitle : (activeSection?.title || "Section Preview")}
            </DialogTitle>
            <div className="flex items-center gap-3 shrink-0">
              {!completed && !showPkgInstructionPage && activeSection?.time_limit_minutes && timerRunning ? (
                <div className={cn(
                  "flex items-center gap-1 text-xs font-mono",
                  remainingSeconds <= 60 ? "text-red-400" : remainingSeconds <= 300 ? "text-amber-300" : "text-slate-300"
                )}>
                  <Clock className="h-3.5 w-3.5" />
                  <span>{timerDisplay}</span>
                </div>
              ) : null}
              {!completed && !showPkgInstructionPage && activeSection && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-slate-500 text-slate-300"
                >
                  {activeSection.section_type?.toUpperCase()} ({activeSectionIdx + 1}/{orderedSections.length})
                </Badge>
              )}
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
            {showPkgInstructionPage ? (
              /* ─── Package Instruction Page ─── */
              <div className="flex-1 overflow-y-auto flex items-start justify-center p-8">
                <div className="bg-white rounded-lg border shadow-sm max-w-2xl w-full p-8 space-y-4">
                  {pkgInstructionTitle && (
                    <h2 className="text-xl font-bold text-center">{pkgInstructionTitle}</h2>
                  )}
                  {pkgInstructionContent && (
                    <div
                      className="prose prose-sm max-w-none [&_p]:my-2 [&_p:empty]:min-h-[1em] [&_p:has(br:only-child)]:min-h-[1em]"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(pkgInstructionContent) }}
                    />
                  )}
                  <div className="flex justify-center pt-4">
                    <button
                      type="button"
                      className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
                      onClick={() => setShowPkgInstructionPage(false)}
                    >
                      Start
                    </button>
                  </div>
                </div>
              </div>
            ) : completed ? (
              /* ─── Completion Screen ─── */
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-white rounded-lg border shadow-sm max-w-md w-full p-8 text-center space-y-4">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                  <h2 className="text-xl font-bold">Test Complete</h2>
                  <p className="text-sm text-muted-foreground">
                    You have completed all {orderedSections.length} tests in the {packageTitle} package.
                  </p>
                  <Button onClick={() => onOpenChange(false)} className="mt-4">
                    Close Preview
                  </Button>
                </div>
              </div>
            ) : loadingSection ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                <p className="text-sm text-slate-500">Loading exam data...</p>
              </div>
            ) : !currentData ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-slate-500">Failed to load data.</p>
              </div>
            ) : showInstructionPage ? (
              <div className="flex-1 overflow-y-auto flex items-start justify-center p-8">
                <div className="bg-white rounded-lg border shadow-sm max-w-2xl w-full p-8 space-y-4">
                  {currentData.instructionTitle && (
                    <h2 className="text-xl font-bold text-center">{currentData.instructionTitle}</h2>
                  )}
                  {currentData.instructionHtml && (
                    <div
                      className="prose prose-sm max-w-none [&_p]:my-2 [&_p:empty]:min-h-[1em] [&_p:has(br:only-child)]:min-h-[1em]"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(currentData.instructionHtml) }}
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
                <div className="flex-1 overflow-hidden min-h-0 grid grid-cols-2">
                  <div className="col-span-1 border-r border-slate-300 bg-slate-100 overflow-y-auto">
                    {activeIsHeadingMatching && activeItem ? (
                      <HeadingMatchingPassage item={activeItem} answers={answers} setAnswer={setAnswer} />
                    ) : (
                      <ContentPanel
                        activeBlock={activeBlock}
                        contentBlocks={currentData.contentBlocks}
                        writingContent={writingContent}
                        writingImageUrl={writingImageUrl}
                      />
                    )}
                  </div>
                  <div className="col-span-1 overflow-hidden bg-slate-100">
                    <QuestionPanel
                      items={items}
                      questionGroups={currentData.questionGroups}
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

          {/* Bottom: Custom Navigator with section boundary handling */}
          {!showPkgInstructionPage && !showInstructionPage && !completed && currentData && totalItems > 0 && (
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
                  onClick={() => {
                    if (activeNum >= totalItems) {
                      // At last question: trigger section transition
                      handleNextSection();
                    } else {
                      setActiveNum((p) => p + 1);
                    }
                  }}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm dialog for section transition */}
      <AlertDialog open={showConfirmNext} onOpenChange={setShowConfirmNext}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isLastSection ? "Complete the test?" : "Proceed to the next test?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {unansweredCount > 0 && (
                  <p>
                    You have <strong className="text-foreground">{unansweredCount}</strong> unanswered question{unansweredCount > 1 ? "s" : ""}.
                  </p>
                )}
                {!isLastSection && (
                  <p className="text-amber-600">You cannot return to the previous test.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue</AlertDialogCancel>
            <AlertDialogAction onClick={proceedToNextSection}>
              {isLastSection ? "Complete" : "Next Test"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
