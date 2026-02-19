"use client";

import { useState, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Clock, Play, Pause, CheckCircle2 } from "lucide-react";
import { getCdnUrl } from "@/lib/cdn";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import { SpeakingRecorder } from "@/components/ui/speaking-recorder";
import type { QuestionItem } from "../types";

interface SpeakingRendererProps {
  item: QuestionItem;
}

function getTextPreview(html: string) {
  const text = html.replace(/<[^>]*>/g, "").trim();
  return text.length > 50 ? text.slice(0, 50) + "..." : text || "(비어있음)";
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface RecordingInfo {
  url: string;
  duration: number;
}

/** Mini play/pause button for collapsed question headers */
function MiniPlayer({ recording }: { recording?: RecordingInfo }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const disabled = !recording;

  const toggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }, [isPlaying, disabled]);

  return (
    <span className={`inline-flex items-center gap-1.5${disabled ? " opacity-30" : ""}`} onClick={(e) => e.stopPropagation()}>
      {recording && (
        <audio
          ref={audioRef}
          src={recording.url}
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
      )}
      {recording ? (
        <CheckCircle2 className="h-3 w-3 text-green-500" />
      ) : null}
      <button
        onClick={toggle}
        disabled={disabled}
        className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors disabled:hover:bg-gray-100 disabled:cursor-default"
      >
        {isPlaying ? (
          <Pause className="h-2.5 w-2.5 text-gray-700" />
        ) : (
          <Play className="h-2.5 w-2.5 text-gray-700 ml-px" />
        )}
      </button>
      <span className="text-[10px] text-gray-500 tabular-nums">{recording ? formatTimer(recording.duration) : "--:--"}</span>
    </span>
  );
}

export function SpeakingRenderer({ item }: SpeakingRendererProps) {
  const q = item.question;
  const fmt = q.question_format;
  const od = q.options_data || {};

  // Collapsible state: first question open by default
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set([0]));
  // Track completed recordings per question index
  const [recordings, setRecordings] = useState<Record<number, RecordingInfo>>({});

  const toggleId = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (total: number) => {
    const allExpanded = expandedIds.size === total;
    if (allExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(Array.from({ length: total }, (_, i) => i)));
    }
  };

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

  // Parse Part 2 cue card content
  const parsePart2Content = (content: string) => {
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
  };

  // Part 1: Multi-question group
  if (fmt === "speaking_part1") {
    const questions = Array.isArray(od.questions) ? (od.questions as Record<string, unknown>[]) : [];

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
              Part 1 &ndash; Interview
            </Badge>
            {q.speaking_category && (
              <Badge variant="secondary" className="text-xs">
                {q.speaking_category}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">{questions.length || 1}문항</span>
          </div>
          {questions.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => toggleAll(questions.length)}
            >
              {expandedIds.size === questions.length ? "모두 접기" : "모두 펼치기"}
            </Button>
          )}
        </div>

        {/* Questions list */}
        {questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((sq, idx) => (
              <Collapsible key={idx} open={expandedIds.has(idx)} onOpenChange={() => toggleId(idx)}>
                <div className="border border-emerald-200/80 rounded-lg overflow-hidden bg-white">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center justify-between w-full px-4 py-2.5 bg-emerald-50/60 hover:bg-emerald-50 transition-colors text-left">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {expandedIds.has(idx) ? (
                          <ChevronDown className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-emerald-700 shrink-0">
                          Q{sq.number ? Number(sq.number) : idx + 1}
                        </span>
                        {!expandedIds.has(idx) && (
                          <span className="text-xs text-muted-foreground truncate">
                            {getTextPreview(String(sq.text || ""))}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {!expandedIds.has(idx) && (
                          <MiniPlayer recording={recordings[idx]} />
                        )}
                        {sq.time_limit_seconds ? (
                          <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-300">
                            <Clock className="h-2.5 w-2.5 mr-0.5" />
                            {String(sq.time_limit_seconds)}초
                          </Badge>
                        ) : null}
                        {sq.allow_response_reset === false ? (
                          <Badge variant="outline" className="text-[10px] text-orange-500 border-orange-300">재녹음 불가</Badge>
                        ) : null}
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-3 space-y-4">
                      {sq.text ? (
                        <div
                          className="text-[15px] leading-relaxed prose prose-sm max-w-none [&_p]:my-2 [&_p:empty]:min-h-[1em]"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(String(sq.text)) }}
                        />
                      ) : null}
                      <div className="border-t border-gray-100 pt-3">
                        <SpeakingRecorder
                          questionId={`${q.id}-q${idx}`}
                          timeLimitSeconds={sq.time_limit_seconds ? Number(sq.time_limit_seconds) : undefined}
                          allowResponseReset={sq.allow_response_reset !== false}
                          onRecordingComplete={(url, dur) => handleRecordingComplete(idx, url, dur)}
                          onRecordingReset={() => handleRecordingReset(idx)}
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        ) : (
          /* Fallback: single question from content */
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
        )}
      </div>
    );
  }

  // Part 2: Cue Card style
  if (fmt === "speaking_part2") {
    const { topic, bullets, closing } = parsePart2Content(q.content || "");
    const imageUrl = getCdnUrl(String(od.image_url || q.image_url || ""));

    return (
      <div className="space-y-4">
        {/* Cue Card */}
        <div className="border-2 border-amber-300 rounded-lg overflow-hidden bg-amber-50/30">
          {/* Card header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-amber-100 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <Badge className="text-xs font-semibold bg-amber-500 hover:bg-amber-500 text-white">
                Part 2 - 큐카드 발표
              </Badge>
            </div>
          </div>

          {/* Card body */}
          <div className="p-6 space-y-4">
            {/* Topic */}
            <p className="text-base font-semibold text-gray-900 leading-relaxed">
              {topic || q.content}
            </p>

            {/* Bullets */}
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

            {/* Closing */}
            {closing && (
              <p className="text-sm text-gray-700 font-medium italic">
                {closing}
              </p>
            )}

            {/* Image */}
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

          {/* Card footer - timing info */}
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-700">
            준비 시간: {od.prep_time_seconds ? `${od.prep_time_seconds}초` : "1분"} | 발표 시간: {od.speaking_time_seconds ? `${od.speaking_time_seconds}초` : "1-2분"}
            {od.allow_response_reset === true && " | 재녹음 허용"}
          </div>
        </div>

        {/* Recording */}
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

  // Part 3: Multi-question group
  if (fmt === "speaking_part3") {
    const depthLabel = q.depth_level ? `Level ${q.depth_level}` : null;
    const questions = Array.isArray(od.questions) ? (od.questions as Record<string, unknown>[]) : [];

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-medium bg-violet-50 text-violet-700 border-violet-200">
              Part 3 &ndash; Discussion
            </Badge>
            {depthLabel && (
              <Badge variant="secondary" className="text-xs">{depthLabel}</Badge>
            )}
            <span className="text-xs text-muted-foreground">{questions.length || 1}문항</span>
          </div>
          {questions.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => toggleAll(questions.length)}
            >
              {expandedIds.size === questions.length ? "모두 접기" : "모두 펼치기"}
            </Button>
          )}
        </div>

        {/* Related Part 2 reference */}
        {q.related_part2_id && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
            연결된 Part 2: <span className="font-mono">{q.related_part2_id}</span>
          </div>
        )}

        {/* Questions list */}
        {questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((sq, idx) => (
              <Collapsible key={idx} open={expandedIds.has(idx)} onOpenChange={() => toggleId(idx)}>
                <div className="border border-violet-200/80 rounded-lg overflow-hidden bg-white">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center justify-between w-full px-4 py-2.5 bg-violet-50/60 hover:bg-violet-50 transition-colors text-left">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {expandedIds.has(idx) ? (
                          <ChevronDown className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-violet-700 shrink-0">
                          Q{sq.number ? Number(sq.number) : idx + 1}
                        </span>
                        {!expandedIds.has(idx) && (
                          <span className="text-xs text-muted-foreground truncate">
                            {getTextPreview(String(sq.text || ""))}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {!expandedIds.has(idx) && (
                          <MiniPlayer recording={recordings[idx]} />
                        )}
                        {sq.time_limit_seconds ? (
                          <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-300">
                            <Clock className="h-2.5 w-2.5 mr-0.5" />
                            {String(sq.time_limit_seconds)}초
                          </Badge>
                        ) : null}
                        {sq.allow_response_reset === false ? (
                          <Badge variant="outline" className="text-[10px] text-orange-500 border-orange-300">재녹음 불가</Badge>
                        ) : null}
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-3 space-y-4">
                      {sq.text ? (
                        <div
                          className="text-[15px] leading-relaxed prose prose-sm max-w-none [&_p]:my-2 [&_p:empty]:min-h-[1em]"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(String(sq.text)) }}
                        />
                      ) : null}
                      <div className="border-t border-gray-100 pt-3">
                        <SpeakingRecorder
                          questionId={`${q.id}-q${idx}`}
                          timeLimitSeconds={sq.time_limit_seconds ? Number(sq.time_limit_seconds) : undefined}
                          allowResponseReset={sq.allow_response_reset !== false}
                          onRecordingComplete={(url, dur) => handleRecordingComplete(idx, url, dur)}
                          onRecordingReset={() => handleRecordingReset(idx)}
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        ) : (
          /* Fallback: single question from content */
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
        )}
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
