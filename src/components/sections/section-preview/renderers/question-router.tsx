"use client";

import type { QuestionItem } from "../types";
import { MCQRenderer } from "./mcq-renderer";
import { TFNGRenderer } from "./tfng-renderer";
import { FillBlankTypingRenderer, FillBlankDragRenderer } from "./fill-blank-renderer";
import { MatchingRenderer } from "./matching-renderer";
import { FlowchartRenderer } from "./flowchart-renderer";
import { MapLabelingRenderer } from "./map-labeling-renderer";
import { EssayRenderer } from "./essay-renderer";
import { SpeakingRenderer } from "./speaking-renderer";

interface QuestionRouterProps {
  item: QuestionItem;
  answers: Record<number, string>;
  setAnswer: (num: number, value: string) => void;
  toggleMultiAnswer: (num: number, value: string) => void;
  activeMatchSlot: number | null;
  setActiveMatchSlot: (num: number | null) => void;
}

export function QuestionRouter({
  item, answers, setAnswer,
  toggleMultiAnswer,
  activeMatchSlot, setActiveMatchSlot,
}: QuestionRouterProps) {
  const fmt = item.question.question_format;

  if (fmt === "mcq_single" || fmt === "mcq_multiple")
    return <MCQRenderer item={item} answers={answers} setAnswer={setAnswer} toggleMultiAnswer={toggleMultiAnswer} />;

  if (fmt === "true_false_ng")
    return <TFNGRenderer item={item} answers={answers} setAnswer={setAnswer} />;

  if (fmt === "fill_blank_typing")
    return <FillBlankTypingRenderer item={item} answers={answers} setAnswer={setAnswer} />;

  if (fmt === "fill_blank_drag")
    return <FillBlankDragRenderer item={item} answers={answers} setAnswer={setAnswer} />;

  if (fmt === "table_completion") {
    // table_completion can be typing or drag mode
    const od = item.question.options_data || {};
    const inputMode = String(od.input_mode || "typing");
    if (inputMode === "drag")
      return <FillBlankDragRenderer item={item} answers={answers} setAnswer={setAnswer} />;
    return <FillBlankTypingRenderer item={item} answers={answers} setAnswer={setAnswer} />;
  }

  if (fmt === "heading_matching" || fmt === "matching")
    return <MatchingRenderer item={item} answers={answers} setAnswer={setAnswer} activeMatchSlot={activeMatchSlot} setActiveMatchSlot={setActiveMatchSlot} />;

  if (fmt === "flowchart")
    return <FlowchartRenderer item={item} answers={answers} setAnswer={setAnswer} />;

  if (fmt === "map_labeling")
    return <MapLabelingRenderer item={item} answers={answers} setAnswer={setAnswer} />;

  if (fmt === "essay_task1" || fmt === "essay_task2" || fmt === "essay")
    return <EssayRenderer item={item} answers={answers} setAnswer={setAnswer} />;

  if (fmt.startsWith("speaking_"))
    return <SpeakingRenderer item={item} />;

  return <p className="text-sm text-gray-500">Unsupported format: {fmt}</p>;
}
