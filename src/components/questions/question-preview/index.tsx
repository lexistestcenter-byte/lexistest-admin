"use client";

import { cn } from "@/lib/utils";
import type { QuestionPreviewData } from "./types";
import { MCQPreview } from "./renderers/mcq-preview";
import { TFNGPreview } from "./renderers/tfng-preview";
import { FillBlankTypingPreview } from "./renderers/fill-blank-typing-preview";
import { FillBlankDragPreview } from "./renderers/fill-blank-drag-preview";
import { TableCompletionPreview } from "./renderers/table-completion-preview";
import { MatchingPreview } from "./renderers/matching-preview";
import { FlowchartPreview } from "./renderers/flowchart-preview";
import { MapLabelingPreview } from "./renderers/map-labeling-preview";
import { ShortAnswerPreview } from "./renderers/short-answer-preview";
import { EssayPreview } from "./renderers/essay-preview";
import { SpeakingPreview } from "./renderers/speaking-preview";

// Re-export all types and conversion functions
export type { QuestionPreviewData, QuestionTabLike, ApiQuestionData } from "./types";
export { tabToPreviewData, apiToPreviewData } from "./types";

export function QuestionPreview({
  data,
  className,
}: {
  data: QuestionPreviewData;
  className?: string;
}) {
  const fmt = data.question_format;

  return (
    <div className={cn("flex flex-col", className)}>
      {fmt === "mcq_single" || fmt === "mcq_multiple" || fmt === "mcq" ? (
        <MCQPreview data={data} />
      ) : fmt === "true_false_ng" || fmt === "yes_no_ng" ? (
        <TFNGPreview data={data} />
      ) : fmt === "matching" || fmt === "heading_matching" ? (
        <MatchingPreview data={data} />
      ) : fmt === "fill_blank_typing" ? (
        <FillBlankTypingPreview data={data} />
      ) : fmt === "fill_blank_drag" ? (
        <FillBlankDragPreview data={data} />
      ) : fmt === "flowchart" ? (
        <FlowchartPreview data={data} />
      ) : fmt === "table_completion" ? (
        <TableCompletionPreview data={data} />
      ) : fmt === "short_answer" ? (
        <ShortAnswerPreview data={data} />
      ) : fmt === "map_labeling" ? (
        <MapLabelingPreview data={data} />
      ) : fmt === "essay" || fmt === "essay_task1" || fmt === "essay_task2" ? (
        <EssayPreview data={data} />
      ) : fmt.startsWith("speaking_") ? (
        <SpeakingPreview data={data} />
      ) : (
        <div className="bg-white rounded-lg border p-6 flex-1 overflow-y-auto">
          <p className="text-sm text-gray-500">지원하지 않는 문제 유형: {fmt}</p>
        </div>
      )}
    </div>
  );
}
