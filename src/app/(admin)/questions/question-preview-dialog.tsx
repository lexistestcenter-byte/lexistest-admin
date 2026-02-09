"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCdnUrl } from "@/lib/cdn";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import { api } from "@/lib/api/client";
import {
  QuestionPreview,
  apiToPreviewData,
  type ApiQuestionData,
} from "@/components/questions/question-preview";

// ─── Types ───────────────────────────────────────────────────────

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

const TYPE_COLORS: Record<string, string> = {
  reading: "bg-emerald-100 text-emerald-700",
  listening: "bg-sky-100 text-sky-700",
  writing: "bg-amber-100 text-amber-700",
  speaking: "bg-violet-100 text-violet-700",
};

export function QuestionPreviewDialog({
  questionId,
  open,
  onOpenChange,
}: QuestionPreviewDialogProps) {
  const [question, setQuestion] = useState<ApiQuestionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !questionId) {
      setQuestion(null);
      return;
    }

    const fetchQuestion = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await api.get<{ question: ApiQuestionData }>(`/api/questions/${questionId}`);
        if (error) throw new Error(error);
        setQuestion(data?.question || null);
      } catch (err) {
        console.error("Failed to load question:", err);
        setQuestion(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestion();
  }, [open, questionId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-none !w-screen !h-screen !rounded-none !p-0 !gap-0 !inset-0 !translate-x-0 !translate-y-0 !top-0 !left-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            미리보기 - 실제 시험 화면
            {question && (
              <>
                <span className={cn("px-2 py-0.5 rounded text-xs font-medium", TYPE_COLORS[question.question_type] || "bg-gray-100")}>
                  {question.question_type}
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  {question.question_code}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {FORMAT_LABELS[question.question_format] || question.question_format}
                </Badge>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : question ? (
            <div className="p-8 bg-slate-100 h-full flex flex-col">
              {/* Audio */}
              {question.audio_url && (
                <audio src={getCdnUrl(question.audio_url)} autoPlay />
              )}

              {/* Instructions */}
              {question.instructions && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg shrink-0">
                  <div
                    className="font-medium text-blue-900 prose prose-sm max-w-none [&_p]:my-3 [&_p:empty]:min-h-[1em] [&_p:has(br:only-child)]:min-h-[1em]"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.instructions) }}
                  />
                </div>
              )}

              {/* Question content */}
              <QuestionPreview data={apiToPreviewData(question)} className="flex-1 min-h-0" />
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
