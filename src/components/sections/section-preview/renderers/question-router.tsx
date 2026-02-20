"use client";

import type { QuestionItem } from "../types";
import { renderFormattedText, renderBlockHtml } from "../types";
import { MCQRenderer } from "./mcq-renderer";
import { TFNGRenderer } from "./tfng-renderer";
import { FillBlankTypingRenderer, FillBlankDragRenderer } from "./fill-blank-renderer";
import { MatchingRenderer } from "./matching-renderer";
import { FlowchartRenderer } from "./flowchart-renderer";
import { MapLabelingRenderer } from "./map-labeling-renderer";
import { EssayRenderer } from "./essay-renderer";
import { SpeakingRenderer } from "./speaking-renderer";
import type { SpeakingQuestionState } from "../hooks/use-preview-state";

interface QuestionRouterProps {
  item: QuestionItem;
  answers: Record<number, string>;
  setAnswer: (num: number, value: string) => void;
  toggleMultiAnswer: (num: number, value: string) => void;
  activeNum?: number;
  setActiveNum?: (num: number) => void;
  activeMatchSlot: number | null;
  setActiveMatchSlot: (num: number | null) => void;
  contentAudioPlaying?: boolean;
  onPauseContentAudio?: () => void;
  onQuestionComplete?: (questionId: string) => void;
  onQuestionIncomplete?: (questionId: string) => void;
  getSpeakingState?: (questionId: string) => SpeakingQuestionState;
  updateSpeakingRecordings?: (questionId: string, recordings: Record<number, { url: string; duration: number }>) => void;
  updateSpeakingSubmitted?: (questionId: string, submitted: Set<number>) => void;
  updateSpeakingSkipped?: (questionId: string, skipped: Set<number>) => void;
  updateSpeakingActiveIdx?: (questionId: string, idx: number) => void;
}

export function QuestionRouter({
  item, answers, setAnswer,
  toggleMultiAnswer,
  activeNum, setActiveNum,
  activeMatchSlot, setActiveMatchSlot,
  contentAudioPlaying,
  onPauseContentAudio,
  onQuestionComplete,
  onQuestionIncomplete,
  getSpeakingState,
  updateSpeakingRecordings,
  updateSpeakingSubmitted,
  updateSpeakingSkipped,
  updateSpeakingActiveIdx,
}: QuestionRouterProps) {
  const fmt = item.question.question_format;
  const titleText = item.question.title || "";
  const instructionsText = item.question.instructions || "";
  const subInstructionsText = item.question.sub_instructions || "";
  const numPrefix =
    item.startNum === item.endNum
      ? `${item.startNum}`
      : `${item.startNum}–${item.endNum}`;

  let content: React.ReactNode;

  if (fmt === "mcq_single" || fmt === "mcq_multiple")
    content = <MCQRenderer item={item} answers={answers} setAnswer={setAnswer} toggleMultiAnswer={toggleMultiAnswer} />;
  else if (fmt === "true_false_ng")
    content = <TFNGRenderer item={item} answers={answers} setAnswer={setAnswer} />;
  else if (fmt === "fill_blank_typing")
    content = <FillBlankTypingRenderer item={item} answers={answers} setAnswer={setAnswer} activeNum={activeNum} setActiveNum={setActiveNum} />;
  else if (fmt === "fill_blank_drag")
    content = <FillBlankDragRenderer item={item} answers={answers} setAnswer={setAnswer} activeNum={activeNum} setActiveNum={setActiveNum} />;
  else if (fmt === "table_completion") {
    const od = item.question.options_data || {};
    const inputMode = String(od.input_mode || "typing");
    if (inputMode === "drag")
      content = <FillBlankDragRenderer item={item} answers={answers} setAnswer={setAnswer} activeNum={activeNum} setActiveNum={setActiveNum} />;
    else
      content = <FillBlankTypingRenderer item={item} answers={answers} setAnswer={setAnswer} activeNum={activeNum} setActiveNum={setActiveNum} />;
  } else if (fmt === "heading_matching" || fmt === "matching")
    content = <MatchingRenderer item={item} answers={answers} setAnswer={setAnswer} activeMatchSlot={activeMatchSlot} setActiveMatchSlot={setActiveMatchSlot} />;
  else if (fmt === "flowchart")
    content = <FlowchartRenderer item={item} answers={answers} setAnswer={setAnswer} />;
  else if (fmt === "map_labeling")
    content = <MapLabelingRenderer item={item} answers={answers} setAnswer={setAnswer} />;
  else if (fmt === "essay_task1" || fmt === "essay_task2" || fmt === "essay")
    content = <EssayRenderer item={item} answers={answers} setAnswer={setAnswer} />;
  else if (fmt.startsWith("speaking_"))
    content = <SpeakingRenderer item={item} contentAudioPlaying={contentAudioPlaying} onPauseContentAudio={onPauseContentAudio} onQuestionComplete={onQuestionComplete} onQuestionIncomplete={onQuestionIncomplete} getSpeakingState={getSpeakingState} updateSpeakingRecordings={updateSpeakingRecordings} updateSpeakingSubmitted={updateSpeakingSubmitted} updateSpeakingSkipped={updateSpeakingSkipped} updateSpeakingActiveIdx={updateSpeakingActiveIdx} />;
  else
    content = <p className="text-sm text-gray-500">Unsupported format: {fmt}</p>;

  // Speaking Part 1/3 master-detail needs full height, no wrapper padding
  const isSpeakingMasterDetail = fmt === "speaking_part1" || fmt === "speaking_part3";
  if (isSpeakingMasterDetail) {
    return <div className="h-full">{content}</div>;
  }

  return (
    <div className="space-y-3">
      {titleText && (
        <div className="bg-slate-100 border-l-4 border-slate-300 px-4 py-2.5 rounded-r">
          <div className="text-[15px]">
            <span className="font-bold mr-2">{numPrefix}</span>
            {renderFormattedText(titleText)}
          </div>
        </div>
      )}
      {instructionsText && (
        <div className="text-sm text-gray-600 leading-relaxed italic">
          {renderBlockHtml(instructionsText)}
        </div>
      )}
      {subInstructionsText && (
        <div className="text-sm text-amber-800 leading-relaxed mt-1">
          {renderBlockHtml(subInstructionsText)}
        </div>
      )}
      {content}
    </div>
  );
}
