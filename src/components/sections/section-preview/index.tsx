"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Clock, Loader2, Mic, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import { getCdnUrl } from "@/lib/cdn";

import type { SectionPreviewProps } from "./types";
import { isHeadingMatchingQuestion } from "./types";
import { usePreviewState } from "./hooks/use-preview-state";
import { QuestionPanel } from "./components/question-panel";
import { ContentPanel } from "./components/content-panel";
import { Navigator } from "./components/navigator";
import { HeadingMatchingPassage } from "./components/heading-matching-passage";
import { WritingPanel } from "./components/writing-panel";

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
  instructionAudioUrl,
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

  const [contentAudioPlaying, setContentAudioPlaying] = useState(false);

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

  // Speaking: only show left panel for Part 2 (cue card)
  const isSpeaking = sectionType === "speaking";
  const activeSpeakingFormat = activeItem?.question?.question_format;
  const isSpeakingPart2 = isSpeaking && activeSpeakingFormat === "speaking_part2";
  const showLeftPanel = isSpeaking ? isSpeakingPart2 : true;

  // Writing questions: dedicated layout
  const isWritingQuestion = activeItem
    ? ["essay_task1", "essay_task2", "essay"].includes(activeItem.question.question_format)
    : false;
  const activeGroup = activeItem
    ? questionGroups.find((g) => g.id === activeItem.groupId) ?? null
    : null;

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
                {instructionAudioUrl && (
                  <div className="flex justify-center">
                    <audio autoPlay controls src={getCdnUrl(instructionAudioUrl)} className="w-full max-w-md h-10" />
                  </div>
                )}
                {isSpeaking && <MicTestSection />}
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
          ) : isWritingQuestion && activeItem ? (
            <WritingPanel
              item={activeItem}
              group={activeGroup}
              answers={answers}
              setAnswer={setAnswer}
            />
          ) : (
            <>
              {/* Auto-play audio from content block */}
              {activeBlock?.audio_url && (
                <audio
                  key={activeBlock.id}
                  src={getCdnUrl(activeBlock.audio_url)}
                  autoPlay
                  className="hidden"
                  onPlay={() => setContentAudioPlaying(true)}
                  onEnded={() => setContentAudioPlaying(false)}
                  onError={() => setContentAudioPlaying(false)}
                />
              )}

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
                    {isSpeakingPart2 && activeItem
                      ? <SpeakingCueCardPanel question={activeItem.question} />
                      : activeIsHeadingMatching && activeItem
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
                    contentAudioPlaying={contentAudioPlaying}
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

// ─── Mic Test Section (Speaking instruction page) ──────────

function MicTestSection() {
  const [testState, setTestState] = useState<"idle" | "recording" | "playing" | "done">("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setTestState("done");
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setTestState("recording");
      setTimeout(() => { if (recorder.state === "recording") recorder.stop(); }, 3000);
    } catch {
      setTestState("idle");
    }
  };

  const playBack = () => {
    if (!audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setTestState("done");
    }
    audioRef.current.play();
    setTestState("playing");
  };

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    audioRef.current = null;
    setTestState("idle");
  };

  return (
    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/50 space-y-3">
      <div className="flex items-center gap-2">
        <Mic className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">Microphone Test</span>
      </div>
      <p className="text-xs text-blue-700">Please test your microphone before starting the test.</p>

      {testState === "idle" && (
        <Button size="sm" variant="outline" onClick={startTest} className="text-blue-700 border-blue-300">
          <Mic className="h-3.5 w-3.5 mr-1" />
          Test Microphone
        </Button>
      )}
      {testState === "recording" && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Recording... (3초)
        </div>
      )}
      {testState === "done" && (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={playBack} className="text-blue-700 border-blue-300">
            <Play className="h-3.5 w-3.5 mr-1" />
            Play Back
          </Button>
          <Button size="sm" variant="ghost" onClick={reset} className="text-gray-500">
            Retry
          </Button>
        </div>
      )}
      {testState === "playing" && (
        <div className="text-sm text-blue-600">Playing back...</div>
      )}
    </div>
  );
}

// ─── Speaking Cue Card Panel (Part 2) ──────────────────────

function SpeakingCueCardPanel({ question }: { question: { content?: string; options_data?: Record<string, unknown> | null } }) {
  const od = question.options_data || {};
  const content = String(question.content || "");

  // JSON 파싱 시도 → 폴백: 텍스트 파싱
  let topic = "";
  const bullets: string[] = [];
  let closing = "";

  try {
    const parsed = JSON.parse(content);
    if (parsed && parsed.topic) {
      topic = parsed.topic.replace(/<[^>]*>/g, "").trim();
      const points: string[] = parsed.points || [];
      bullets.push(...points);
      if (bullets.length > 0) {
        const last = bullets[bullets.length - 1];
        if (last.toLowerCase().startsWith("and explain") || last.toLowerCase().startsWith("and say")) {
          closing = bullets.pop()!;
        }
      }
    }
  } catch {
    const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
    let inBullets = false;
    for (const line of lines) {
      if (line.toLowerCase().startsWith("you should say")) { inBullets = true; continue; }
      if (line.startsWith("-") || line.startsWith("\u2022") || line.startsWith("*")) { bullets.push(line.replace(/^[-\u2022*]\s*/, "")); continue; }
      if (inBullets && (line.toLowerCase().startsWith("and explain") || line.toLowerCase().startsWith("and say"))) { closing = line; continue; }
      if (!inBullets && !topic) { topic = line; }
    }
  }

  return (
    <div className="p-4">
      <div className="border-2 border-indigo-200 rounded-lg overflow-hidden bg-indigo-50/30">
        <div className="px-4 py-2.5 bg-indigo-100 border-b border-indigo-200">
          <span className="text-xs font-semibold text-indigo-700">Cue Card</span>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-base font-semibold text-gray-900 leading-relaxed">{topic || content}</p>
          {bullets.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">You should say:</p>
              <ul className="list-disc space-y-1.5 text-sm text-gray-700 pl-6">
                {bullets.map((b, i) => <li key={i} className="leading-relaxed">{b}</li>)}
              </ul>
            </div>
          )}
          {closing && <p className="text-sm text-gray-700 font-medium italic">{closing}</p>}
        </div>
        <div className="px-4 py-2 bg-indigo-50 border-t border-indigo-200 text-xs text-indigo-700">
          Prep: {String(od.prep_time_seconds || 60)}s | Speaking: {String(od.speaking_time_seconds || 120)}s
        </div>
      </div>
    </div>
  );
}
