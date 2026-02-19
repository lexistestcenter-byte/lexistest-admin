"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Mic,
  Square,
  RotateCcw,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  Lock,
  Timer,
} from "lucide-react";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";

// ─── Types ─────────────────────────────────────────────────

interface SpeakingRecorderProps {
  /** Unique key per question to scope recorder state */
  questionId: string;
  /** Max recording time in seconds */
  timeLimitSeconds?: number;
  /** Whether re-recording is allowed after completing a recording */
  allowResponseReset?: boolean;
  /** Part 2 only: preparation time before recording */
  prepTimeSeconds?: number;
  /** Part 2 only: speaking time (used as default time limit for Part 2) */
  speakingTimeSeconds?: number;
  /** Whether this is a Part 2 cue card question */
  isPart2?: boolean;
  /** Called when a recording is completed with the audio blob URL and duration */
  onRecordingComplete?: (audioUrl: string, durationSeconds: number) => void;
  /** Called when the recording is reset (re-record) */
  onRecordingReset?: () => void;
  /** true이면 오디오 재생 완료까지 prep 카운트다운 시작 안 함 */
  waitForAudio?: boolean;
  className?: string;
}

type Part2Phase = "prep" | "speaking" | "done";

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Waveform Visualizer ────────────────────────────────────

function WaveformVisualizer({
  analyserNode,
  isActive,
}: {
  analyserNode: AnalyserNode | null;
  isActive: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserNode || !isActive) {
      // Clear canvas when not active
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const barCount = 40;
      const barWidth = w / barCount - 1;
      const step = Math.floor(bufferLength / barCount);

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i * step] / 255;
        const barHeight = Math.max(2, val * h * 0.8);
        const x = i * (barWidth + 1);
        const y = (h - barHeight) / 2;

        ctx.fillStyle = `rgba(239, 68, 68, ${0.4 + val * 0.6})`;
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [analyserNode, isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={48}
      className="w-full h-12 rounded"
    />
  );
}

// ─── Playback Component ─────────────────────────────────────

function RecordedPlayback({ audioUrl, knownDuration }: { audioUrl: string; knownDuration?: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(knownDuration || 0);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };
    const onTimeUpdate = () => {
      const d = (audio.duration > 0 && isFinite(audio.duration)) ? audio.duration : (knownDuration || 0);
      if (d > 0) {
        setProgress((audio.currentTime / d) * 100);
      }
    };
    const onLoaded = () => {
      if (audio.duration > 0 && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [audioUrl]);

  return (
    <div className="flex items-center gap-3 w-full">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 tabular-nums shrink-0">
        {(() => {
          const d = duration > 0 && isFinite(duration) ? duration : (knownDuration || 0);
          return d > 0 ? formatTimer(Math.floor(d)) : "--:--";
        })()}
      </span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export function SpeakingRecorder({
  questionId,
  timeLimitSeconds,
  allowResponseReset = true,
  prepTimeSeconds = 60,
  speakingTimeSeconds = 120,
  isPart2 = false,
  onRecordingComplete,
  onRecordingReset,
  waitForAudio,
  className,
}: SpeakingRecorderProps) {
  // Part 2 phase management
  const [part2Phase, setPart2Phase] = useState<Part2Phase>("prep");
  const [prepRemaining, setPrepRemaining] = useState(prepTimeSeconds);
  const prepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Re-record confirmation dialog
  const [showReRecordConfirm, setShowReRecordConfirm] = useState(false);
  // Submit (lock) state
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Effective time limit: for Part 2, use speakingTimeSeconds if no explicit timeLimitSeconds
  const effectiveTimeLimit = isPart2
    ? timeLimitSeconds || speakingTimeSeconds
    : timeLimitSeconds;

  const recorder = useAudioRecorder({
    timeLimitSeconds: effectiveTimeLimit,
    onTimeUp: () => {
      // Time's up — recording stopped automatically
    },
  });

  const {
    state,
    audioUrl,
    elapsedSeconds,
    errorMessage,
    analyserNode,
    startRecording,
    stopRecording,
    resetRecording,
  } = recorder;

  // Notify parent when recording completes
  const onRecordingCompleteRef = useRef(onRecordingComplete);
  onRecordingCompleteRef.current = onRecordingComplete;

  useEffect(() => {
    if (state === "recorded" && audioUrl) {
      onRecordingCompleteRef.current?.(audioUrl, elapsedSeconds);
    }
  }, [state, audioUrl, elapsedSeconds]);

  // Reset state when questionId changes
  useEffect(() => {
    resetRecording();
    setPart2Phase("prep");
    setPrepRemaining(prepTimeSeconds);
    setShowReRecordConfirm(false);
    setIsSubmitted(false);
    if (prepTimerRef.current) {
      clearInterval(prepTimerRef.current);
      prepTimerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  // Part 2: prep countdown
  const startPrepCountdown = useCallback(() => {
    setPrepRemaining(prepTimeSeconds);
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);

    const startTime = Date.now();
    prepTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, prepTimeSeconds - elapsed);
      setPrepRemaining(remaining);

      if (remaining <= 0) {
        if (prepTimerRef.current) clearInterval(prepTimerRef.current);
        prepTimerRef.current = null;
        setPart2Phase("speaking");
      }
    }, 200);
  }, [prepTimeSeconds]);

  // Auto-start prep countdown for Part 2 (wait for audio to finish)
  useEffect(() => {
    if (isPart2 && part2Phase === "prep" && !prepTimerRef.current && !waitForAudio) {
      startPrepCountdown();
    }
  }, [isPart2, part2Phase, startPrepCountdown, waitForAudio]);

  // Auto-start recording when entering speaking phase (Part 2)
  useEffect(() => {
    if (isPart2 && part2Phase === "speaking" && state === "idle") {
      startRecording();
    }
  }, [isPart2, part2Phase, state, startRecording]);

  // Cleanup prep timer on unmount
  useEffect(() => {
    return () => {
      if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    };
  }, []);

  // Compute remaining time for display
  const remainingSeconds = effectiveTimeLimit
    ? Math.max(0, effectiveTimeLimit - elapsedSeconds)
    : null;

  // Whether user can re-record
  const canReRecord = allowResponseReset && state === "recorded";
  const isLocked = !allowResponseReset && state === "recorded";

  // Handle re-record request
  const handleReRecordRequest = () => {
    if (!allowResponseReset) return;
    setShowReRecordConfirm(true);
  };

  const confirmReRecord = () => {
    setShowReRecordConfirm(false);
    resetRecording();
    onRecordingReset?.();
    if (isPart2) {
      setPart2Phase("prep");
      setPrepRemaining(prepTimeSeconds);
    }
  };

  // ─── Part 2 Render ────────────────────────────────────────

  if (isPart2) {
    // Phase: Preparation
    if (part2Phase === "prep" && state !== "recording" && state !== "recorded") {
      return (
        <div className={cn("space-y-3", className)}>
          <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-indigo-200 rounded-lg bg-indigo-50/50">
            <Timer className="h-8 w-8 text-indigo-500 mb-2" />
            <p className="text-sm font-medium text-indigo-700 mb-1">
              Preparation Time
            </p>
            <p className="text-3xl font-bold text-indigo-600 tabular-nums mb-3">
              {formatTimer(prepRemaining)}
            </p>
            <p className="text-xs text-indigo-600 mb-3">
              Read the cue card and prepare your answer
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (prepTimerRef.current)
                  clearInterval(prepTimerRef.current);
                prepTimerRef.current = null;
                setPart2Phase("speaking");
              }}
              className="text-indigo-700 border-indigo-300 hover:bg-indigo-100"
            >
              Skip &amp; Start Speaking
            </Button>
          </div>
          {state === "error" && errorMessage && (
            <ErrorBanner message={errorMessage} onRetry={resetRecording} />
          )}
        </div>
      );
    }

    // Phase: Speaking (ready to record or recording)
    if (part2Phase === "speaking" && state !== "recorded") {
      return (
        <div className={cn("space-y-3", className)}>
          <RecordingArea
            state={state}
            elapsedSeconds={elapsedSeconds}
            remainingSeconds={remainingSeconds}
            timeLimitSeconds={effectiveTimeLimit}
            analyserNode={analyserNode}
            errorMessage={errorMessage}
            onStart={startRecording}
            onStop={stopRecording}
            onReset={resetRecording}
            label="Your turn to speak"
            accentColor="indigo"
          />
        </div>
      );
    }

    // Phase: Done (recorded)
    if (state === "recorded" && audioUrl) {
      return (
        <div className={cn("space-y-3", className)}>
          <RecordedState
            audioUrl={audioUrl}
            elapsedSeconds={elapsedSeconds}
            isLocked={isLocked}
            canReRecord={canReRecord}
            showReRecordConfirm={showReRecordConfirm}
            onReRecordRequest={handleReRecordRequest}
            onConfirmReRecord={confirmReRecord}
            onCancelReRecord={() => setShowReRecordConfirm(false)}
            isSubmitted={isSubmitted}
            onSubmit={() => setIsSubmitted(true)}
          />
        </div>
      );
    }

    // Error state
    if (state === "error") {
      return (
        <div className={cn("space-y-3", className)}>
          <ErrorBanner message={errorMessage} onRetry={resetRecording} />
        </div>
      );
    }
  }

  // ─── Part 1 / Part 3 Render ───────────────────────────────

  // Recorded state
  if (state === "recorded" && audioUrl) {
    return (
      <div className={cn("space-y-3", className)}>
        <RecordedState
          audioUrl={audioUrl}
          elapsedSeconds={elapsedSeconds}
          isLocked={isLocked}
          canReRecord={canReRecord}
          showReRecordConfirm={showReRecordConfirm}
          onReRecordRequest={handleReRecordRequest}
          onConfirmReRecord={confirmReRecord}
          onCancelReRecord={() => setShowReRecordConfirm(false)}
          isSubmitted={isSubmitted}
          onSubmit={() => setIsSubmitted(true)}
        />
      </div>
    );
  }

  // Idle / Recording / Error
  return (
    <div className={cn("space-y-3", className)}>
      <RecordingArea
        state={state}
        elapsedSeconds={elapsedSeconds}
        remainingSeconds={remainingSeconds}
        timeLimitSeconds={effectiveTimeLimit}
        analyserNode={analyserNode}
        errorMessage={errorMessage}
        onStart={startRecording}
        onStop={stopRecording}
        onReset={resetRecording}
        label="Record your answer"
        accentColor="red"
      />
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────

function RecordingArea({
  state,
  elapsedSeconds,
  remainingSeconds,
  timeLimitSeconds,
  analyserNode,
  errorMessage,
  onStart,
  onStop,
  onReset,
  label,
  accentColor,
}: {
  state: string;
  elapsedSeconds: number;
  remainingSeconds: number | null;
  timeLimitSeconds?: number;
  analyserNode: AnalyserNode | null;
  errorMessage: string | null;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  label: string;
  accentColor: "red" | "indigo";
}) {
  const isRecording = state === "recording";
  const isRequesting = state === "requesting";
  const isError = state === "error";

  const progressPercent =
    isRecording && timeLimitSeconds
      ? Math.min(100, (elapsedSeconds / timeLimitSeconds) * 100)
      : 0;

  const isNearLimit = remainingSeconds !== null && remainingSeconds <= 10;

  return (
    <div
      className={cn(
        "rounded-lg border-2 overflow-hidden transition-colors",
        isRecording
          ? accentColor === "indigo"
            ? "border-indigo-400 bg-indigo-50"
            : "border-red-300 bg-red-50"
          : "border-gray-200 bg-gray-50"
      )}
    >
      {/* Progress bar */}
      {isRecording && timeLimitSeconds ? (
        <div className="h-1 bg-gray-200">
          <div
            className={cn(
              "h-full transition-[width] duration-200",
              isNearLimit ? "bg-red-500" : "bg-blue-500"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      ) : null}

      <div className="flex flex-col items-center justify-center py-5 px-4">
        {/* Recording indicator */}
        {isRecording ? (
          <>
            {/* Waveform */}
            <div className="w-full max-w-xs mb-3">
              <WaveformVisualizer
                analyserNode={analyserNode}
                isActive={isRecording}
              />
            </div>

            {/* Timer */}
            <div className="flex items-center gap-3 mb-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-medium text-red-600">REC</span>
              </span>
              <span
                className={cn(
                  "text-lg font-bold tabular-nums",
                  isNearLimit ? "text-red-600" : "text-gray-800"
                )}
              >
                {formatTimer(elapsedSeconds)}
              </span>
              {remainingSeconds !== null && (
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    isNearLimit
                      ? "text-red-500 font-bold"
                      : "text-gray-400"
                  )}
                >
                  ({formatTimer(remainingSeconds)} left)
                </span>
              )}
            </div>

            {/* Stop button */}
            <Button
              size="sm"
              variant="destructive"
              onClick={onStop}
              className="gap-2"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              Stop Recording
            </Button>
          </>
        ) : (
          <>
            {/* Idle state */}
            <Mic
              className={cn(
                "h-8 w-8 mb-2",
                isError ? "text-red-400" : "text-gray-300"
              )}
            />
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            {timeLimitSeconds ? (
              <p className="text-xs text-gray-400 mb-3">
                Time limit: {formatTimer(timeLimitSeconds)}
              </p>
            ) : (
              <div className="mb-3" />
            )}

            <Button
              size="sm"
              onClick={onStart}
              disabled={isRequesting}
              className={cn(
                "gap-2",
                accentColor === "indigo"
                  ? "bg-indigo-500 hover:bg-indigo-600"
                  : ""
              )}
            >
              <Mic className="h-4 w-4" />
              {isRequesting ? "Requesting mic..." : "Start Recording"}
            </Button>
          </>
        )}
      </div>

      {/* Error display */}
      {isError && errorMessage && (
        <ErrorBanner message={errorMessage} onRetry={onReset} />
      )}
    </div>
  );
}

function RecordedState({
  audioUrl,
  elapsedSeconds,
  isLocked,
  canReRecord,
  showReRecordConfirm,
  onReRecordRequest,
  onConfirmReRecord,
  onCancelReRecord,
  isSubmitted,
  onSubmit,
}: {
  audioUrl: string;
  elapsedSeconds: number;
  isLocked: boolean;
  canReRecord: boolean;
  showReRecordConfirm: boolean;
  onReRecordRequest: () => void;
  onConfirmReRecord: () => void;
  onCancelReRecord: () => void;
  isSubmitted: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-lg border-2 border-green-200 bg-green-50 overflow-hidden">
      <div className="px-4 py-3 space-y-3">
        {/* Status header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              Recording Complete
            </span>
            <span className="text-xs text-gray-500 tabular-nums">
              ({formatTimer(elapsedSeconds)})
            </span>
          </div>
          {isLocked && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Lock className="h-3 w-3" />
              <span>Cannot re-record</span>
            </div>
          )}
        </div>

        {/* Playback */}
        <RecordedPlayback audioUrl={audioUrl} knownDuration={elapsedSeconds} />

        {/* Re-record + Submit buttons */}
        {canReRecord && !showReRecordConfirm && !isSubmitted && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onReRecordRequest}
              className="flex-1 gap-2 text-indigo-700 border-indigo-300 hover:bg-indigo-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Re-record
            </Button>
            <Button
              size="sm"
              onClick={onSubmit}
              className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Submit
            </Button>
          </div>
        )}

        {/* Submitted state */}
        {isSubmitted && (
          <div className="flex items-center gap-1 justify-center text-xs text-blue-600 py-1">
            <Lock className="h-3 w-3" />
            <span>Answer submitted</span>
          </div>
        )}

        {/* Re-record confirmation */}
        {showReRecordConfirm && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
            <p className="text-sm text-indigo-800 font-medium">
              Re-record this answer?
            </p>
            <p className="text-xs text-indigo-700">
              Your current recording will be permanently replaced.
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={onConfirmReRecord}
                className="flex-1 gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Yes, re-record
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onCancelReRecord}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="mx-4 mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <p className="text-sm text-red-700">
            {message || "An error occurred."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="text-red-700 border-red-300 hover:bg-red-100"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
