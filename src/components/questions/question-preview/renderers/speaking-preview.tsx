"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getCdnUrl } from "@/lib/cdn";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import { SpeakingRecorder } from "@/components/ui/speaking-recorder";
import { od, getStr, getArr } from "../helpers";
import type { QuestionPreviewData } from "../types";

function getTextPreview(html: string) {
  const text = html.replace(/<[^>]*>/g, "").trim();
  return text.length > 50 ? text.slice(0, 50) + "..." : text || "(비어있음)";
}

export function SpeakingPreview({ data }: { data: QuestionPreviewData }) {
  const fmt = data.question_format;
  const o = od(data);
  const questions = getArr(o, "questions") as Record<string, unknown>[];

  // Collapsible state: first question open by default
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set([0]));

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

  // Part 1 - Multi-question group
  if (fmt === "speaking_part1") {
    return (
      <div className="space-y-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
              Part 1 &ndash; Interview
            </Badge>
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
        {questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((sq, i) => (
              <Collapsible key={i} open={expandedIds.has(i)} onOpenChange={() => toggleId(i)}>
                <div className="border border-emerald-200/80 rounded-lg overflow-hidden bg-white">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center justify-between w-full px-4 py-2.5 bg-emerald-50/60 hover:bg-emerald-50 transition-colors text-left">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {expandedIds.has(i) ? (
                          <ChevronDown className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-emerald-700 shrink-0">
                          Q{sq.number ? Number(sq.number) : i + 1}
                        </span>
                        {!expandedIds.has(i) && (
                          <span className="text-xs text-muted-foreground truncate">
                            {getTextPreview(String(sq.text || ""))}
                          </span>
                        )}
                      </div>
                      {sq.time_limit_seconds ? (
                        <span className="text-[10px] text-gray-500 shrink-0 ml-2">{String(sq.time_limit_seconds)}초</span>
                      ) : null}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-3 space-y-4">
                      <div
                        className="text-[15px] leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(String(sq.text || "")) }}
                      />
                      <div className="border-t border-gray-100 pt-3">
                        <SpeakingRecorder
                          questionId={`preview-p1-${i}`}
                          timeLimitSeconds={sq.time_limit_seconds ? Number(sq.time_limit_seconds) : 30}
                          allowResponseReset={sq.allow_response_reset !== false}
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border p-6">
            <p className="text-[15px] leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(data.content || "(질문 입력)") }} />
          </div>
        )}
      </div>
    );
  }

  // Part 2 - Cue Card
  if (fmt === "speaking_part2") {
    const topic = getStr(o, "topic", data.content);
    const points = getArr(o, "points").map(String);
    const imageUrl = getCdnUrl(getStr(o, "image_url", ""));

    return (
      <div className="space-y-4 flex-1 overflow-y-auto">
        <div className="border-2 border-amber-300 rounded-lg overflow-hidden bg-amber-50/30">
          <div className="px-4 py-2.5 bg-amber-100 border-b border-amber-200">
            <Badge className="text-xs font-semibold bg-amber-500 hover:bg-amber-500 text-white">
              Part 2 - 큐카드 발표
            </Badge>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-base font-semibold text-gray-900 leading-relaxed">{topic || "(주제 입력)"}</p>
            {points.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">You should say:</p>
                <ul className="list-disc space-y-1.5 text-sm text-gray-700 pl-6">
                  {points.map((point, i) => (
                    <li key={i} className="leading-relaxed">{point || `(포인트 ${i + 1})`}</li>
                  ))}
                </ul>
              </div>
            )}
            {imageUrl && (
              <div className="mt-3 p-2 bg-white rounded border">
                <img src={imageUrl} alt="큐카드 이미지" className="max-w-full h-auto max-h-[200px] rounded mx-auto" />
              </div>
            )}
          </div>
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-700">
            준비 시간: {getStr(o, "prep_time_seconds", "60")}초 | 발표 시간: {getStr(o, "speaking_time_seconds", "120")}초
          </div>
        </div>
        <SpeakingRecorder
          questionId="preview-p2"
          isPart2
          prepTimeSeconds={Number(getStr(o, "prep_time_seconds", "60"))}
          speakingTimeSeconds={Number(getStr(o, "speaking_time_seconds", "120"))}
          allowResponseReset
        />
      </div>
    );
  }

  // Part 3 - Multi-question group
  if (fmt === "speaking_part3") {
    const depthLabel = data.depthLevel ? `Level ${data.depthLevel}` : null;

    return (
      <div className="space-y-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-medium bg-violet-50 text-violet-700 border-violet-200">
              Part 3 &ndash; Discussion
            </Badge>
            {depthLabel && <Badge variant="secondary" className="text-xs">{depthLabel}</Badge>}
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
        {(data.relatedPart2Id || data.relatedPart2Code) && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
            연결된 Part 2: <span className="font-mono">{data.relatedPart2Code || data.relatedPart2Id}</span>
          </div>
        )}
        {questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((sq, i) => (
              <Collapsible key={i} open={expandedIds.has(i)} onOpenChange={() => toggleId(i)}>
                <div className="border border-violet-200/80 rounded-lg overflow-hidden bg-white">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center justify-between w-full px-4 py-2.5 bg-violet-50/60 hover:bg-violet-50 transition-colors text-left">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {expandedIds.has(i) ? (
                          <ChevronDown className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-violet-700 shrink-0">
                          Q{sq.number ? Number(sq.number) : i + 1}
                        </span>
                        {!expandedIds.has(i) && (
                          <span className="text-xs text-muted-foreground truncate">
                            {getTextPreview(String(sq.text || ""))}
                          </span>
                        )}
                      </div>
                      {sq.time_limit_seconds ? (
                        <span className="text-[10px] text-gray-500 shrink-0 ml-2">{String(sq.time_limit_seconds)}초</span>
                      ) : null}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-3 space-y-4">
                      <div
                        className="text-[15px] leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(String(sq.text || "")) }}
                      />
                      <div className="border-t border-gray-100 pt-3">
                        <SpeakingRecorder
                          questionId={`preview-p3-${i}`}
                          timeLimitSeconds={sq.time_limit_seconds ? Number(sq.time_limit_seconds) : 30}
                          allowResponseReset={sq.allow_response_reset !== false}
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border p-6">
            <p className="text-[15px] leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(data.content || "(질문 입력)") }} />
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return (
    <div className="bg-white rounded-lg border p-6 flex-1 overflow-y-auto">
      <p dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(data.content || "") }} />
    </div>
  );
}
