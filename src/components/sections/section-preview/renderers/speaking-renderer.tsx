"use client";

import { useState, useRef, useEffect } from "react";
import { Clock, CheckCircle2, Play, Pause, RotateCcw, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCdnUrl } from "@/lib/cdn";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import { SpeakingRecorder } from "@/components/ui/speaking-recorder";
import type { QuestionItem } from "../types";
import type { SpeakingQuestionState } from "../hooks/use-preview-state";

interface SpeakingRendererProps {
  item: QuestionItem;
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

interface RecordingInfo {
  url: string;
  duration: number;
}

export function SpeakingRenderer({
  item, contentAudioPlaying, onPauseContentAudio, onQuestionComplete, onQuestionIncomplete,
  getSpeakingState, updateSpeakingRecordings, updateSpeakingSubmitted, updateSpeakingSkipped, updateSpeakingActiveIdx,
}: SpeakingRendererProps) {
  const q = item.question;
  const fmt = q.question_format;
  const od = q.options_data || {};

  // Use external state if available, otherwise fall back to local state
  const externalState = getSpeakingState?.(q.id);
  const [localActiveIdx, setLocalActiveIdx] = useState(0);
  const [localRecordings, setLocalRecordings] = useState<Record<number, RecordingInfo>>({});
  const [localSubmitted, setLocalSubmitted] = useState<Set<number>>(new Set());
  const [localSkipped, setLocalSkipped] = useState<Set<number>>(new Set());

  const activeIdx = externalState ? externalState.activeSubIdx : localActiveIdx;
  const recordings = externalState ? externalState.recordings : localRecordings;
  const submittedIdxs = externalState ? externalState.submitted : localSubmitted;
  const skippedIdxs = externalState ? externalState.skipped : localSkipped;

  const setActiveIdx = (idx: number) => {
    if (updateSpeakingActiveIdx) updateSpeakingActiveIdx(q.id, idx);
    else setLocalActiveIdx(idx);
  };

  const setSubmittedIdxs = (updater: Set<number> | ((prev: Set<number>) => Set<number>)) => {
    const newVal = typeof updater === "function" ? updater(submittedIdxs) : updater;
    if (updateSpeakingSubmitted) updateSpeakingSubmitted(q.id, newVal);
    else setLocalSubmitted(newVal);
  };

  const setSkippedIdxs = (updater: Set<number> | ((prev: Set<number>) => Set<number>)) => {
    const newVal = typeof updater === "function" ? updater(skippedIdxs) : updater;
    if (updateSpeakingSkipped) updateSpeakingSkipped(q.id, newVal);
    else setLocalSkipped(newVal);
  };

  const handleRecordingComplete = (idx: number, url: string, duration: number) => {
    const newRecs = { ...recordings, [idx]: { url, duration } };
    if (updateSpeakingRecordings) updateSpeakingRecordings(q.id, newRecs);
    else setLocalRecordings(newRecs);
  };

  const handleRecordingReset = (idx: number) => {
    const newRecs = { ...recordings };
    delete newRecs[idx];
    if (updateSpeakingRecordings) updateSpeakingRecordings(q.id, newRecs);
    else setLocalRecordings(newRecs);
  };

  // Part 1: Master-detail layout
  if (fmt === "speaking_part1") {
    const questions = Array.isArray(od.questions) ? (od.questions as Record<string, unknown>[]) : [];
    const activeQ = questions[activeIdx];
    const totalSubQs = questions.length;

    if (questions.length === 0) {
      // Fallback: single question from content
      return (
        <div className="space-y-3">
          {q.content && (
            <div
              className="text-[15px] leading-relaxed prose prose-sm max-w-none [&_p]:my-3 [&_p:empty]:min-h-[1em]"
              dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(q.content) }}
            />
          )}
          <SpeakingRecorder
            questionId={q.id}
            timeLimitSeconds={od.time_limit_seconds ? Number(od.time_limit_seconds) : undefined}
            allowResponseReset={od.allow_response_reset !== false}
          />
        </div>
      );
    }

    return (
      <Part1Layout
        q={q}
        od={od}
        questions={questions}
        activeIdx={activeIdx}
        setActiveIdx={setActiveIdx}
        activeQ={activeQ}
        totalSubQs={totalSubQs}
        recordings={recordings}
        submittedIdxs={submittedIdxs}
        setSubmittedIdxs={setSubmittedIdxs}
        skippedIdxs={skippedIdxs}
        setSkippedIdxs={setSkippedIdxs}
        handleRecordingComplete={handleRecordingComplete}
        handleRecordingReset={handleRecordingReset}
        onPauseContentAudio={onPauseContentAudio}
        onQuestionComplete={onQuestionComplete}
        onQuestionIncomplete={onQuestionIncomplete}
      />
    );
  }

  // Part 2: Recorder only (cue card shown in left panel)
  if (fmt === "speaking_part2") {
    return (
      <Part2Layout
        q={q}
        od={od}
        recordings={recordings}
        submittedIdxs={submittedIdxs}
        setSubmittedIdxs={setSubmittedIdxs}
        skippedIdxs={skippedIdxs}
        setSkippedIdxs={setSkippedIdxs}
        handleRecordingComplete={handleRecordingComplete}
        handleRecordingReset={handleRecordingReset}
        contentAudioPlaying={contentAudioPlaying}
        onPauseContentAudio={onPauseContentAudio}
        onQuestionComplete={onQuestionComplete}
        onQuestionIncomplete={onQuestionIncomplete}
      />
    );
  }

  // Part 3: Master-detail layout
  if (fmt === "speaking_part3") {
    const questions = Array.isArray(od.questions) ? (od.questions as Record<string, unknown>[]) : [];
    const activeQ = questions[activeIdx];
    const totalSubQs = questions.length;

    if (questions.length === 0) {
      // Fallback: single question from content
      return (
        <div className="space-y-3">
          {q.content && (
            <div
              className="text-[15px] leading-relaxed p-4 bg-violet-50/50 border border-violet-100 rounded-lg prose prose-sm max-w-none [&_p]:my-3 [&_p:empty]:min-h-[1em]"
              dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(q.content) }}
            />
          )}
          <SpeakingRecorder
            questionId={q.id}
            timeLimitSeconds={od.time_limit_seconds ? Number(od.time_limit_seconds) : undefined}
            allowResponseReset={od.allow_response_reset !== false}
          />
        </div>
      );
    }

    return (
      <Part3Layout
        q={q}
        od={od}
        questions={questions}
        activeIdx={activeIdx}
        setActiveIdx={setActiveIdx}
        activeQ={activeQ}
        totalSubQs={totalSubQs}
        recordings={recordings}
        submittedIdxs={submittedIdxs}
        setSubmittedIdxs={setSubmittedIdxs}
        skippedIdxs={skippedIdxs}
        setSkippedIdxs={setSkippedIdxs}
        handleRecordingComplete={handleRecordingComplete}
        handleRecordingReset={handleRecordingReset}
        onPauseContentAudio={onPauseContentAudio}
        onQuestionComplete={onQuestionComplete}
        onQuestionIncomplete={onQuestionIncomplete}
      />
    );
  }

  // Fallback for unknown speaking format
  return (
    <div className="space-y-4">
      {q.content && (
        <div
          className="text-sm leading-relaxed prose prose-sm max-w-none [&_p]:my-3 [&_p:empty]:min-h-[1em] [&_p:has(br:only-child)]:min-h-[1em]"
          dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(q.content) }}
        />
      )}
      <SpeakingRecorder
        questionId={q.id}
        timeLimitSeconds={od.time_limit_seconds ? Number(od.time_limit_seconds) : undefined}
        allowResponseReset={od.allow_response_reset !== false}
      />
    </div>
  );
}

// ─── Part 1 Layout ────────────────────────────────────────

function Part1Layout({
  q, od, questions, activeIdx, setActiveIdx, activeQ, totalSubQs,
  recordings, submittedIdxs, setSubmittedIdxs, skippedIdxs, setSkippedIdxs,
  handleRecordingComplete, handleRecordingReset,
  onPauseContentAudio, onQuestionComplete, onQuestionIncomplete,
}: {
  q: { id: string; content: string; options_data: Record<string, unknown> | null };
  od: Record<string, unknown>;
  questions: Record<string, unknown>[];
  activeIdx: number;
  setActiveIdx: (idx: number) => void;
  activeQ: Record<string, unknown> | undefined;
  totalSubQs: number;
  recordings: Record<number, RecordingInfo>;
  submittedIdxs: Set<number>;
  setSubmittedIdxs: (updater: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  skippedIdxs: Set<number>;
  setSkippedIdxs: (updater: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  handleRecordingComplete: (idx: number, url: string, duration: number) => void;
  handleRecordingReset: (idx: number) => void;
  onPauseContentAudio?: () => void;
  onQuestionComplete?: (questionId: string) => void;
  onQuestionIncomplete?: (questionId: string) => void;
}) {
  const questionAudioRef = useRef<HTMLAudioElement>(null);

  // Auto-play question audio when activeIdx changes
  useEffect(() => {
    const audio = questionAudioRef.current;
    if (audio && activeQ?.audio_url) {
      audio.src = getCdnUrl(String(activeQ.audio_url));
      audio.play().catch(() => {});
    } else if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [activeIdx]);

  const pauseQuestionAudio = () => {
    const audio = questionAudioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  useEffect(() => {
    if (totalSubQs === 0) return;
    const doneCount = submittedIdxs.size + skippedIdxs.size;
    if (doneCount >= totalSubQs) {
      onQuestionComplete?.(q.id);
    } else {
      onQuestionIncomplete?.(q.id);
    }
  }, [submittedIdxs.size, skippedIdxs.size, totalSubQs, q.id, onQuestionComplete, onQuestionIncomplete]);

  return (
    <div className="grid grid-cols-2 h-full -mx-4 -my-3">
      {/* Left: question list */}
      <div className="border-r border-slate-200 bg-white overflow-y-auto">
        {questions.map((sq, idx) => (
          <button
            key={idx}
            className={cn(
              "w-full text-left px-4 py-3 border-b border-slate-100 transition-colors",
              activeIdx === idx
                ? "bg-emerald-50 border-l-2 border-l-emerald-500"
                : "hover:bg-slate-50"
            )}
            onClick={() => setActiveIdx(idx)}
          >
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs font-bold shrink-0",
                activeIdx === idx ? "text-emerald-700" : "text-gray-500"
              )}>
                Q{sq.number ? Number(sq.number) : idx + 1}
              </span>
              <span className="text-sm text-gray-700 truncate flex-1">
                {String(sq.text || "").replace(/<[^>]*>/g, "").trim() || "(비어있음)"}
              </span>
              {submittedIdxs.has(idx) ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
              ) : skippedIdxs.has(idx) ? (
                <span className="text-[10px] font-medium text-gray-400 shrink-0">SKIP</span>
              ) : recordings[idx] ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              ) : null}
            </div>
            {sq.time_limit_seconds ? (
              <div className="mt-1 ml-6">
                <span className="text-[10px] text-gray-400">
                  <Clock className="h-2.5 w-2.5 inline mr-0.5" />
                  {String(sq.time_limit_seconds)}s
                </span>
              </div>
            ) : null}
          </button>
        ))}
      </div>

      {/* Right: active question recorder */}
      <div className="overflow-y-auto p-6 bg-slate-50 flex items-center justify-center">
        {activeQ ? (
          <div className="max-w-lg w-full space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-700">
                Question {activeQ.number ? Number(activeQ.number) : activeIdx + 1}
              </span>
              {activeQ.text ? (
                <div
                  className="text-lg leading-relaxed text-gray-900 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(String(activeQ.text)) }}
                />
              ) : null}
            </div>
            {activeQ.audio_url ? (
              <div className="p-3 bg-white rounded-lg border">
                <audio
                  ref={questionAudioRef}
                  controls
                  controlsList="nodownload noplaybackrate"
                  src={getCdnUrl(String(activeQ.audio_url))}
                  className="w-full h-8"
                  onPlay={() => onPauseContentAudio?.()}
                />
              </div>
            ) : null}
            {recordings[activeIdx] && submittedIdxs.has(activeIdx) ? (
              <SubmittedRecordingView
                recording={recordings[activeIdx]}
                allowReRecord={activeQ.allow_response_reset !== false}
                onReRecord={() => {
                  setSubmittedIdxs((prev) => { const next = new Set(prev); next.delete(activeIdx); return next; });
                  handleRecordingReset(activeIdx);
                }}
              />
            ) : skippedIdxs.has(activeIdx) ? (
              <SkippedQuestionView
                onUnskip={() => setSkippedIdxs(prev => { const next = new Set(prev); next.delete(activeIdx); return next; })}
              />
            ) : (
              <>
                <SpeakingRecorder
                  questionId={`${q.id}-q${activeIdx}`}
                  timeLimitSeconds={activeQ.time_limit_seconds ? Number(activeQ.time_limit_seconds) : undefined}
                  allowResponseReset={activeQ.allow_response_reset !== false}
                  onRecordingComplete={(url, dur) => handleRecordingComplete(activeIdx, url, dur)}
                  onRecordingReset={() => handleRecordingReset(activeIdx)}
                  onSubmit={() => setSubmittedIdxs((prev) => new Set(prev).add(activeIdx))}
                  onPauseContentAudio={() => {
                    onPauseContentAudio?.();
                    pauseQuestionAudio();
                  }}
                />
                <button
                  type="button"
                  className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-1 transition-colors"
                  onClick={() => setSkippedIdxs(prev => new Set(prev).add(activeIdx))}
                >
                  Skip this question
                </button>
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center">질문을 선택하세요</p>
        )}
      </div>
    </div>
  );
}

// ─── Part 2 Layout ────────────────────────────────────────

function Part2Layout({
  q, od, recordings, submittedIdxs, setSubmittedIdxs, skippedIdxs, setSkippedIdxs,
  handleRecordingComplete, handleRecordingReset,
  contentAudioPlaying, onPauseContentAudio, onQuestionComplete, onQuestionIncomplete,
}: {
  q: { id: string; content: string; options_data: Record<string, unknown> | null };
  od: Record<string, unknown>;
  recordings: Record<number, RecordingInfo>;
  submittedIdxs: Set<number>;
  setSubmittedIdxs: (updater: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  skippedIdxs: Set<number>;
  setSkippedIdxs: (updater: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  handleRecordingComplete: (idx: number, url: string, duration: number) => void;
  handleRecordingReset: (idx: number) => void;
  contentAudioPlaying?: boolean;
  onPauseContentAudio?: () => void;
  onQuestionComplete?: (questionId: string) => void;
  onQuestionIncomplete?: (questionId: string) => void;
}) {
  const isSubmitted = submittedIdxs.has(0);
  const isSkipped = skippedIdxs.has(0);

  useEffect(() => {
    if (isSubmitted || isSkipped) {
      onQuestionComplete?.(q.id);
    } else {
      onQuestionIncomplete?.(q.id);
    }
  }, [isSubmitted, isSkipped, q.id, onQuestionComplete, onQuestionIncomplete]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w-md space-y-4 text-center">
        {recordings[0] && isSubmitted ? (
          <SubmittedRecordingView
            recording={recordings[0]}
            allowReRecord={od.allow_response_reset !== false}
            onReRecord={() => {
              setSubmittedIdxs((prev) => { const next = new Set(prev); next.delete(0); return next; });
              handleRecordingReset(0);
              onQuestionIncomplete?.(q.id);
            }}
          />
        ) : isSkipped ? (
          <SkippedQuestionView
            onUnskip={() => setSkippedIdxs(prev => { const next = new Set(prev); next.delete(0); return next; })}
          />
        ) : (
          <>
            <SpeakingRecorder
              questionId={q.id}
              timeLimitSeconds={od.time_limit_seconds ? Number(od.time_limit_seconds) : undefined}
              allowResponseReset={od.allow_response_reset !== false}
              isPart2
              prepTimeSeconds={od.prep_time_seconds ? Number(od.prep_time_seconds) : 60}
              speakingTimeSeconds={od.speaking_time_seconds ? Number(od.speaking_time_seconds) : 120}
              waitForAudio={contentAudioPlaying}
              onPauseContentAudio={onPauseContentAudio}
              onRecordingComplete={(url, dur) => handleRecordingComplete(0, url, dur)}
              onSubmit={() => setSubmittedIdxs((prev) => new Set(prev).add(0))}
            />
            <button
              type="button"
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-1 transition-colors"
              onClick={() => setSkippedIdxs(prev => new Set(prev).add(0))}
            >
              Skip this question
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Part 3 Layout ────────────────────────────────────────

function Part3Layout({
  q, od, questions, activeIdx, setActiveIdx, activeQ, totalSubQs,
  recordings, submittedIdxs, setSubmittedIdxs, skippedIdxs, setSkippedIdxs,
  handleRecordingComplete, handleRecordingReset,
  onPauseContentAudio, onQuestionComplete, onQuestionIncomplete,
}: {
  q: { id: string; related_part2_id?: string | null; content: string; options_data: Record<string, unknown> | null };
  od: Record<string, unknown>;
  questions: Record<string, unknown>[];
  activeIdx: number;
  setActiveIdx: (idx: number) => void;
  activeQ: Record<string, unknown> | undefined;
  totalSubQs: number;
  recordings: Record<number, RecordingInfo>;
  submittedIdxs: Set<number>;
  setSubmittedIdxs: (updater: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  skippedIdxs: Set<number>;
  setSkippedIdxs: (updater: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  handleRecordingComplete: (idx: number, url: string, duration: number) => void;
  handleRecordingReset: (idx: number) => void;
  onPauseContentAudio?: () => void;
  onQuestionComplete?: (questionId: string) => void;
  onQuestionIncomplete?: (questionId: string) => void;
}) {
  const questionAudioRef = useRef<HTMLAudioElement>(null);

  // Auto-play question audio when activeIdx changes
  useEffect(() => {
    const audio = questionAudioRef.current;
    if (audio && activeQ?.audio_url) {
      audio.src = getCdnUrl(String(activeQ.audio_url));
      audio.play().catch(() => {});
    } else if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [activeIdx]);

  const pauseQuestionAudio = () => {
    const audio = questionAudioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  useEffect(() => {
    if (totalSubQs === 0) return;
    const doneCount = submittedIdxs.size + skippedIdxs.size;
    if (doneCount >= totalSubQs) {
      onQuestionComplete?.(q.id);
    } else {
      onQuestionIncomplete?.(q.id);
    }
  }, [submittedIdxs.size, skippedIdxs.size, totalSubQs, q.id, onQuestionComplete, onQuestionIncomplete]);

  return (
    <div className="grid grid-cols-2 h-full -mx-4 -my-3">
      {/* Left: question list */}
      <div className="border-r border-slate-200 bg-white overflow-y-auto">
        {questions.map((sq, idx) => (
          <button
            key={idx}
            className={cn(
              "w-full text-left px-4 py-3 border-b border-slate-100 transition-colors",
              activeIdx === idx
                ? "bg-violet-50 border-l-2 border-l-violet-500"
                : "hover:bg-slate-50"
            )}
            onClick={() => setActiveIdx(idx)}
          >
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs font-bold shrink-0",
                activeIdx === idx ? "text-violet-700" : "text-gray-500"
              )}>
                Q{sq.number ? Number(sq.number) : idx + 1}
              </span>
              <span className="text-sm text-gray-700 truncate flex-1">
                {String(sq.text || "").replace(/<[^>]*>/g, "").trim() || "(비어있음)"}
              </span>
              {submittedIdxs.has(idx) ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
              ) : skippedIdxs.has(idx) ? (
                <span className="text-[10px] font-medium text-gray-400 shrink-0">SKIP</span>
              ) : recordings[idx] ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              ) : null}
            </div>
            {sq.time_limit_seconds ? (
              <div className="mt-1 ml-6">
                <span className="text-[10px] text-gray-400">
                  <Clock className="h-2.5 w-2.5 inline mr-0.5" />
                  {String(sq.time_limit_seconds)}s
                </span>
              </div>
            ) : null}
          </button>
        ))}
      </div>

      {/* Right: active question recorder */}
      <div className="overflow-y-auto p-6 bg-slate-50 flex items-center justify-center">
        {activeQ ? (
          <div className="max-w-lg w-full space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold text-violet-700">
                Question {activeQ.number ? Number(activeQ.number) : activeIdx + 1}
              </span>
              {activeQ.text ? (
                <div
                  className="text-lg leading-relaxed text-gray-900 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(String(activeQ.text)) }}
                />
              ) : null}
            </div>
            {activeQ.audio_url ? (
              <div className="p-3 bg-white rounded-lg border">
                <audio
                  ref={questionAudioRef}
                  controls
                  controlsList="nodownload noplaybackrate"
                  src={getCdnUrl(String(activeQ.audio_url))}
                  className="w-full h-8"
                  onPlay={() => onPauseContentAudio?.()}
                />
              </div>
            ) : null}
            {recordings[activeIdx] && submittedIdxs.has(activeIdx) ? (
              <SubmittedRecordingView
                recording={recordings[activeIdx]}
                allowReRecord={activeQ.allow_response_reset !== false}
                onReRecord={() => {
                  setSubmittedIdxs((prev) => { const next = new Set(prev); next.delete(activeIdx); return next; });
                  handleRecordingReset(activeIdx);
                }}
              />
            ) : skippedIdxs.has(activeIdx) ? (
              <SkippedQuestionView
                onUnskip={() => setSkippedIdxs(prev => { const next = new Set(prev); next.delete(activeIdx); return next; })}
              />
            ) : (
              <>
                <SpeakingRecorder
                  questionId={`${q.id}-q${activeIdx}`}
                  timeLimitSeconds={activeQ.time_limit_seconds ? Number(activeQ.time_limit_seconds) : undefined}
                  allowResponseReset={activeQ.allow_response_reset !== false}
                  onRecordingComplete={(url, dur) => handleRecordingComplete(activeIdx, url, dur)}
                  onRecordingReset={() => handleRecordingReset(activeIdx)}
                  onSubmit={() => setSubmittedIdxs((prev) => new Set(prev).add(activeIdx))}
                  onPauseContentAudio={() => {
                    onPauseContentAudio?.();
                    pauseQuestionAudio();
                  }}
                />
                <button
                  type="button"
                  className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-1 transition-colors"
                  onClick={() => setSkippedIdxs(prev => new Set(prev).add(activeIdx))}
                >
                  Skip this question
                </button>
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center">질문을 선택하세요</p>
        )}
      </div>
    </div>
  );
}

// ─── Submitted Recording View ─────────────────────────────

function SubmittedRecordingView({
  recording,
  allowReRecord,
  onReRecord,
}: {
  recording: RecordingInfo;
  allowReRecord: boolean;
  onReRecord: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  return (
    <div className="rounded-lg border-2 border-green-200 bg-green-50 overflow-hidden">
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Recording Complete</span>
            <span className="text-xs text-gray-500 tabular-nums">
              ({String(Math.floor(recording.duration / 60)).padStart(2, "0")}:{String(recording.duration % 60).padStart(2, "0")})
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <Lock className="h-3 w-3" />
            <span>Answer submitted</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <audio
            ref={audioRef}
            src={recording.url}
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={togglePlay}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <div className="flex-1 text-xs text-gray-500">Click to play back your recording</div>
        </div>
        {allowReRecord && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReRecord}
            className="w-full gap-2 text-indigo-700 border-indigo-300 hover:bg-indigo-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Re-record
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Skipped Question View ────────────────────────────────

function SkippedQuestionView({ onUnskip }: { onUnskip: () => void }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden">
      <div className="px-4 py-5 flex flex-col items-center gap-3">
        <span className="text-sm text-gray-400">Question skipped</span>
        <Button variant="outline" size="sm" onClick={onUnskip} className="text-gray-500">
          Answer this question
        </Button>
      </div>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────

function parsePart2Content(content: string) {
  // 1. JSON 파싱 시도
  try {
    const parsed = JSON.parse(content);
    if (parsed && parsed.topic) {
      const topicText = parsed.topic.replace(/<[^>]*>/g, "").trim();
      const points: string[] = parsed.points || [];
      return { topic: topicText, bullets: [...points], closing: "" };
    }
  } catch { }

  // 2. 기존 텍스트 파싱 폴백
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  let topic = "";
  const bullets: string[] = [];
  let inBullets = false;

  for (const line of lines) {
    if (line.toLowerCase().startsWith("you should say")) { inBullets = true; continue; }
    if (line.startsWith("-") || line.startsWith("\u2022") || line.startsWith("*")) { bullets.push(line.replace(/^[-\u2022*]\s*/, "")); continue; }
    if (inBullets) { bullets.push(line); continue; }
    if (!inBullets && !topic) { topic = line; }
  }
  return { topic, bullets, closing: "" };
}
