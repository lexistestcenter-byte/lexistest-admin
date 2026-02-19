"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCdnUrl } from "@/lib/cdn";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import { SpeakingRecorder } from "@/components/ui/speaking-recorder";
import type { QuestionItem } from "../types";

interface SpeakingRendererProps {
  item: QuestionItem;
}

interface RecordingInfo {
  url: string;
  duration: number;
}

export function SpeakingRenderer({ item }: SpeakingRendererProps) {
  const q = item.question;
  const fmt = q.question_format;
  const od = q.options_data || {};

  const [activeIdx, setActiveIdx] = useState(0);
  const [recordings, setRecordings] = useState<Record<number, RecordingInfo>>({});

  const handleRecordingComplete = (idx: number, url: string, duration: number) => {
    setRecordings((prev) => ({ ...prev, [idx]: { url, duration } }));
  };

  const handleRecordingReset = (idx: number) => {
    setRecordings((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  // Part 1: Master-detail layout
  if (fmt === "speaking_part1") {
    const questions = Array.isArray(od.questions) ? (od.questions as Record<string, unknown>[]) : [];
    const activeQ = questions[activeIdx];

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
      <div className="grid grid-cols-2 h-full -mx-4 -my-3">
        {/* Left: question list */}
        <div className="border-r border-slate-200 bg-white overflow-y-auto">
          <div className="px-4 py-3 border-b bg-emerald-50">
            <p className="text-xs font-semibold text-emerald-700">Part 1 – Interview</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{questions.length}문항</p>
          </div>
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
                {recordings[idx] && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                )}
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
                  <audio controls src={getCdnUrl(String(activeQ.audio_url))} className="w-full h-8" />
                </div>
              ) : null}
              <SpeakingRecorder
                questionId={`${q.id}-q${activeIdx}`}
                timeLimitSeconds={activeQ.time_limit_seconds ? Number(activeQ.time_limit_seconds) : undefined}
                allowResponseReset={activeQ.allow_response_reset !== false}
                onRecordingComplete={(url, dur) => handleRecordingComplete(activeIdx, url, dur)}
                onRecordingReset={() => handleRecordingReset(activeIdx)}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center">질문을 선택하세요</p>
          )}
        </div>
      </div>
    );
  }

  // Part 2: Cue Card style (unchanged)
  if (fmt === "speaking_part2") {
    const { topic, bullets, closing } = parsePart2Content(q.content || "");
    const imageUrl = getCdnUrl(String(od.image_url || q.image_url || ""));

    return (
      <div className="space-y-4">
        <div className="border-2 border-amber-300 rounded-lg overflow-hidden bg-amber-50/30">
          <div className="flex items-center justify-between px-4 py-2.5 bg-amber-100 border-b border-amber-200">
            <Badge className="text-xs font-semibold bg-amber-500 hover:bg-amber-500 text-white">
              Part 2 - 큐카드 발표
            </Badge>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-base font-semibold text-gray-900 leading-relaxed">
              {topic || q.content}
            </p>
            {bullets.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">You should say:</p>
                <ul className="list-disc space-y-1.5 text-sm text-gray-700 pl-6">
                  {bullets.map((b, i) => (
                    <li key={i} className="leading-relaxed">{b}</li>
                  ))}
                </ul>
              </div>
            )}
            {closing && (
              <p className="text-sm text-gray-700 font-medium italic">{closing}</p>
            )}
            {imageUrl && (
              <div className="mt-3 p-2 bg-white rounded border">
                <img
                  src={imageUrl}
                  alt="큐카드 이미지"
                  className="max-w-full h-auto max-h-[200px] rounded mx-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-700">
            Prep: {od.prep_time_seconds ? `${od.prep_time_seconds}s` : "60s"} | Speaking: {od.speaking_time_seconds ? `${od.speaking_time_seconds}s` : "60-120s"}
            {od.allow_response_reset === true && " | Re-record allowed"}
          </div>
        </div>
        <SpeakingRecorder
          questionId={q.id}
          timeLimitSeconds={od.time_limit_seconds ? Number(od.time_limit_seconds) : undefined}
          allowResponseReset={od.allow_response_reset !== false}
          isPart2
          prepTimeSeconds={od.prep_time_seconds ? Number(od.prep_time_seconds) : 60}
          speakingTimeSeconds={od.speaking_time_seconds ? Number(od.speaking_time_seconds) : 120}
        />
      </div>
    );
  }

  // Part 3: Master-detail layout
  if (fmt === "speaking_part3") {
    const depthLabel = q.depth_level ? `Level ${q.depth_level}` : null;
    const questions = Array.isArray(od.questions) ? (od.questions as Record<string, unknown>[]) : [];
    const activeQ = questions[activeIdx];

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
      <div className="grid grid-cols-2 h-full -mx-4 -my-3">
        {/* Left: question list */}
        <div className="border-r border-slate-200 bg-white overflow-y-auto">
          <div className="px-4 py-3 border-b bg-violet-50 space-y-1">
            <p className="text-xs font-semibold text-violet-700">
              Part 3 – Discussion{depthLabel ? ` (${depthLabel})` : ""}
            </p>
            <p className="text-[10px] text-muted-foreground">{questions.length}문항</p>
            {q.related_part2_id && (
              <p className="text-[10px] text-gray-500">
                Part 2: <span className="font-mono">{q.related_part2_id}</span>
              </p>
            )}
          </div>
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
                {recordings[idx] && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                )}
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
                  <audio controls src={getCdnUrl(String(activeQ.audio_url))} className="w-full h-8" />
                </div>
              ) : null}
              <SpeakingRecorder
                questionId={`${q.id}-q${activeIdx}`}
                timeLimitSeconds={activeQ.time_limit_seconds ? Number(activeQ.time_limit_seconds) : undefined}
                allowResponseReset={activeQ.allow_response_reset !== false}
                onRecordingComplete={(url, dur) => handleRecordingComplete(activeIdx, url, dur)}
                onRecordingReset={() => handleRecordingReset(activeIdx)}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center">질문을 선택하세요</p>
          )}
        </div>
      </div>
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

// ─── Helpers ───────────────────────────────────────────────

function parsePart2Content(content: string) {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  let topic = "";
  const bullets: string[] = [];
  let closing = "";
  let inBullets = false;

  for (const line of lines) {
    if (line.toLowerCase().startsWith("you should say")) {
      inBullets = true;
      continue;
    }
    if (line.startsWith("-") || line.startsWith("\u2022") || line.startsWith("*")) {
      bullets.push(line.replace(/^[-\u2022*]\s*/, ""));
      continue;
    }
    if (inBullets && (line.toLowerCase().startsWith("and explain") || line.toLowerCase().startsWith("and say"))) {
      closing = line;
      continue;
    }
    if (!inBullets && !topic) {
      topic = line;
    }
  }

  return { topic, bullets, closing };
}
