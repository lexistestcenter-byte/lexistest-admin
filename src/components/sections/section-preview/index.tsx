"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Clock, Loader2, Mic, Play, Volume2, Check } from "lucide-react";
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
    completedSpeakingItems,
    markSpeakingComplete,
    markSpeakingIncomplete,
    getSpeakingState,
    updateSpeakingRecordings,
    updateSpeakingSubmitted,
    updateSpeakingSkipped,
    updateSpeakingActiveIdx,
  } = state;

  const [contentAudioPlaying, setContentAudioPlaying] = useState(false);
  const contentAudioRef = useRef<HTMLAudioElement>(null);
  const instructionAudioRef = useRef<HTMLAudioElement>(null);

  const pauseContentAudio = useCallback(() => {
    if (contentAudioRef.current) {
      contentAudioRef.current.pause();
      contentAudioRef.current.currentTime = 0;
    }
  }, []);

  const pauseInstructionAudio = useCallback(() => {
    if (instructionAudioRef.current) {
      instructionAudioRef.current.pause();
    }
  }, []);

  // ─── Layout ────────────────────────────────────────────────────

  const blockHasPassageData = (b: { passage_title?: string; passage_content?: string }) =>
    !!(b.passage_title || b.passage_content);
  // Check ANY content block for passage data (not just active block)
  const hasPassageContent = contentBlocks.some(blockHasPassageData);
  const hasAudioContent =
    activeBlock?.content_type === "audio" || !!activeBlock?.audio_url ||
    (!activeBlock && contentBlocks.some((b) => b.content_type === "audio" || !!b.audio_url));
  // Heading matching has its own 2-column layout, so skip section-level left panel
  const activeIsHeadingMatching = activeItem
    ? isHeadingMatchingQuestion(activeItem.question)
    : false;

  // Speaking: only show left panel for Part 2 (cue card)
  const isSpeaking = sectionType === "speaking";
  const activeSpeakingFormat = activeItem?.question?.question_format;
  const isSpeakingPart2 = isSpeaking && activeSpeakingFormat === "speaking_part2";
  const isListening = sectionType === "listening";
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
                  <audio ref={instructionAudioRef} autoPlay src={getCdnUrl(instructionAudioUrl)} className="hidden" />
                )}
                {isSpeaking && <MicTestSection onPauseInstructionAudio={pauseInstructionAudio} />}
                {isListening && <SpeakerTestSection onPauseInstructionAudio={pauseInstructionAudio} />}
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
                  ref={contentAudioRef}
                  key={activeBlock.id}
                  src={getCdnUrl(activeBlock.audio_url)}
                  crossOrigin="anonymous"
                  autoPlay
                  className="hidden"
                  onPlay={() => setContentAudioPlaying(true)}
                  onPause={() => setContentAudioPlaying(false)}
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
                  <div className={cn(
                    "col-span-1 border-r border-slate-300",
                    isListening ? "overflow-hidden" : "bg-slate-100 overflow-y-auto"
                  )}>
                    {isListening
                      ? <AudioWaveformPanel audioRef={contentAudioRef} isPlaying={contentAudioPlaying} />
                      : isSpeakingPart2 && activeItem
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
                    onPauseContentAudio={pauseContentAudio}
                    isSpeaking={isSpeaking}
                    onQuestionComplete={markSpeakingComplete}
                    onQuestionIncomplete={markSpeakingIncomplete}
                    getSpeakingState={getSpeakingState}
                    updateSpeakingRecordings={updateSpeakingRecordings}
                    updateSpeakingSubmitted={updateSpeakingSubmitted}
                    updateSpeakingSkipped={updateSpeakingSkipped}
                    updateSpeakingActiveIdx={updateSpeakingActiveIdx}
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
            isSpeaking={isSpeaking}
            completedSpeakingItems={completedSpeakingItems}
            questionGroups={questionGroups}
            items={items}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Mic Test Section (Speaking instruction page) ──────────

function MicTestSection({ onPauseInstructionAudio }: { onPauseInstructionAudio?: () => void }) {
  const [testState, setTestState] = useState<"idle" | "recording" | "playing" | "done">("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = "rgb(239, 246, 255)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgb(59, 130, 246)";
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };
    draw();
  }, []);

  const stopWaveform = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  useEffect(() => {
    if (testState === "recording") {
      drawWaveform();
    } else {
      stopWaveform();
    }
  }, [testState, drawWaveform, stopWaveform]);

  useEffect(() => {
    return () => stopWaveform();
  }, [stopWaveform]);

  const startTest = async () => {
    onPauseInstructionAudio?.();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stopWaveform();
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
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-red-600">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Recording... (3초)
          </div>
          <canvas
            ref={canvasRef}
            width={300}
            height={60}
            className="w-full h-[60px] rounded bg-blue-50 border border-blue-200"
          />
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

// ─── Audio Waveform Panel (Listening) ──────────────────────

function AudioWaveformPanel({
  audioRef,
  isPlaying,
}: {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const connectedElementRef = useRef<HTMLAudioElement | null>(null);

  const drawIdleLine = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#475569";
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }, []);

  const startDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#38bdf8";
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };
    draw();
  }, []);

  // Connect to audio element and start/stop drawing
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = 0;
      }
      drawIdleLine();
      return;
    }

    const audioEl = audioRef.current;
    if (!audioEl) return;

    // Reconnect if audio element changed (new content block)
    if (connectedElementRef.current !== audioEl) {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
        analyserRef.current = null;
      }

      try {
        const audioCtx = new AudioContext();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        const source = audioCtx.createMediaElementSource(audioEl);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
        connectedElementRef.current = audioEl;
      } catch {
        drawIdleLine();
        return;
      }
    }

    startDrawing();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = 0;
      }
    };
  }, [isPlaying, audioRef, drawIdleLine, startDrawing]);

  // Initial idle line
  useEffect(() => {
    drawIdleLine();
  }, [drawIdleLine]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-800 p-8">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="flex items-center justify-center gap-2">
          {isPlaying && <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />}
          <span className="text-sm font-medium text-slate-300">
            {isPlaying ? "Playing Audio..." : "Audio Waveform"}
          </span>
        </div>
        <canvas
          ref={canvasRef}
          width={400}
          height={120}
          className="w-full rounded-lg border border-slate-600"
        />
      </div>
    </div>
  );
}

// ─── Speaker Test Section (Listening instruction page) ─────

function SpeakerTestSection({ onPauseInstructionAudio }: { onPauseInstructionAudio?: () => void }) {
  const [testState, setTestState] = useState<"idle" | "playing" | "asked" | "passed" | "failed">("idle");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = "rgb(239, 246, 255)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgb(59, 130, 246)";
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };
    draw();
  }, []);

  const stopWaveform = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  useEffect(() => {
    if (testState === "playing") {
      drawWaveform();
    } else {
      stopWaveform();
    }
  }, [testState, drawWaveform, stopWaveform]);

  useEffect(() => {
    return () => stopWaveform();
  }, [stopWaveform]);

  const playTestSound = () => {
    onPauseInstructionAudio?.();
    try {
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;

      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      // Fade out at the end
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime + 0.8);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);

      oscillator.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(audioCtx.destination);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1);
      setTestState("playing");

      oscillator.onended = () => {
        stopWaveform();
        setTestState("asked");
      };
    } catch {
      setTestState("idle");
    }
  };

  const reset = () => {
    setTestState("idle");
  };

  return (
    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/50 space-y-3">
      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">Speaker Test</span>
      </div>
      <p className="text-xs text-blue-700">Please test your speakers or headphones before starting.</p>

      {testState === "idle" && (
        <Button size="sm" variant="outline" onClick={playTestSound} className="text-blue-700 border-blue-300">
          <Volume2 className="h-3.5 w-3.5 mr-1" />
          Test Sound
        </Button>
      )}
      {testState === "playing" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Playing test sound...
          </div>
          <canvas
            ref={canvasRef}
            width={300}
            height={60}
            className="w-full h-[60px] rounded bg-blue-50 border border-blue-200"
          />
        </div>
      )}
      {testState === "asked" && (
        <div className="space-y-2">
          <p className="text-sm text-gray-700">Could you hear the sound?</p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setTestState("passed")} className="text-green-700 border-green-300">
              <Check className="h-3.5 w-3.5 mr-1" />
              Yes
            </Button>
            <Button size="sm" variant="outline" onClick={() => setTestState("failed")} className="text-red-700 border-red-300">
              No
            </Button>
          </div>
        </div>
      )}
      {testState === "passed" && (
        <div className="flex items-center gap-2 text-sm text-green-700">
          <Check className="h-4 w-4" />
          Sound test passed
        </div>
      )}
      {testState === "failed" && (
        <div className="space-y-2">
          <p className="text-sm text-red-600">Please check your volume settings and try again.</p>
          <Button size="sm" variant="ghost" onClick={reset} className="text-gray-500">
            Retry
          </Button>
        </div>
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

  try {
    const parsed = JSON.parse(content);
    if (parsed && parsed.topic) {
      topic = parsed.topic.replace(/<[^>]*>/g, "").trim();
      const points: string[] = parsed.points || [];
      bullets.push(...points);
    }
  } catch {
    const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
    let inBullets = false;
    for (const line of lines) {
      if (line.toLowerCase().startsWith("you should say")) { inBullets = true; continue; }
      if (line.startsWith("-") || line.startsWith("\u2022") || line.startsWith("*")) { bullets.push(line.replace(/^[-\u2022*]\s*/, "")); continue; }
      if (inBullets) { bullets.push(line); continue; }
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
        </div>
        <div className="px-4 py-2 bg-indigo-50 border-t border-indigo-200 text-xs text-indigo-700">
          Prep: {String(od.prep_time_seconds || 60)}s | Speaking: {String(od.speaking_time_seconds || 120)}s
        </div>
      </div>
    </div>
  );
}
