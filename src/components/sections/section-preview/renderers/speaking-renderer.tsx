"use client";

import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { getCdnUrl } from "@/lib/cdn";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import { SpeakingRecorder } from "@/components/ui/speaking-recorder";
import type { QuestionItem } from "../types";

interface SpeakingRendererProps {
  item: QuestionItem;
}

export function SpeakingRenderer({ item }: SpeakingRendererProps) {
  const q = item.question;
  const fmt = q.question_format;
  const od = q.options_data || {};

  // Parse Part 2 cue card content
  const parsePart2Content = (content: string) => {
    // Expected format:
    // Topic line
    //
    // You should say:
    // - bullet 1
    // - bullet 2
    // ...
    // and explain...
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
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
            Part 1 &ndash; Interview
          </Badge>
          {q.speaking_category && (
            <Badge variant="secondary" className="text-xs">
              {q.speaking_category}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">{questions.length || 1} question(s)</span>
        </div>

        {/* Questions list */}
        {questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((sq, idx) => (
              <div key={idx} className="border border-emerald-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50">
                  <span className="text-xs font-semibold text-emerald-700">Q{sq.number ? Number(sq.number) : idx + 1}</span>
                  <div className="flex items-center gap-2">
                    {sq.time_limit_seconds ? (
                      <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-300">
                        <Clock className="h-2.5 w-2.5 mr-0.5" />
                        {String(sq.time_limit_seconds)}s
                      </Badge>
                    ) : null}
                    {sq.allow_response_reset === false && (
                      <Badge variant="outline" className="text-[10px] text-orange-500 border-orange-300">No re-record</Badge>
                    )}
                  </div>
                </div>
                <div className="p-3 space-y-3">
                  {sq.text ? (
                    <div
                      className="text-[15px] leading-relaxed prose prose-sm max-w-none [&_p]:my-2 [&_p:empty]:min-h-[1em]"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(String(sq.text)) }}
                    />
                  ) : null}
                  <SpeakingRecorder
                    questionId={`${q.id}-q${idx}`}
                    timeLimitSeconds={sq.time_limit_seconds ? Number(sq.time_limit_seconds) : undefined}
                    allowResponseReset={sq.allow_response_reset !== false}
                  />
                </div>
              </div>
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
                Part 2 - Cue Card
              </Badge>
            </div>
          </div>

          {/* Card body */}
          <div className="p-5 space-y-4">
            {/* Topic */}
            <p className="text-base font-semibold text-gray-900 leading-relaxed">
              {topic || q.content}
            </p>

            {/* Bullets */}
            {bullets.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">You should say:</p>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700 pl-2">
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
                  alt="Cue card visual"
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
            Preparation: {od.prep_time_seconds ? `${od.prep_time_seconds}s` : "1 min"} | Speaking: {od.speaking_time_seconds ? `${od.speaking_time_seconds}s` : "1-2 min"}
            {od.allow_response_reset === true && " | Re-recording allowed"}
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

  // Part 3: Multi-question group (same structure as Part 1)
  if (fmt === "speaking_part3") {
    const depthLabel = q.depth_level ? `Level ${q.depth_level}` : null;
    const questions = Array.isArray(od.questions) ? (od.questions as Record<string, unknown>[]) : [];

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-medium bg-violet-50 text-violet-700 border-violet-200">
            Part 3 &ndash; Discussion
          </Badge>
          {depthLabel && (
            <Badge variant="secondary" className="text-xs">{depthLabel}</Badge>
          )}
          <span className="text-xs text-muted-foreground">{questions.length || 1} question(s)</span>
        </div>

        {/* Related Part 2 reference */}
        {q.related_part2_id && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
            Related Part 2: <span className="font-mono">{q.related_part2_id}</span>
          </div>
        )}

        {/* Questions list */}
        {questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((sq, idx) => (
              <div key={idx} className="border border-violet-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-violet-50">
                  <span className="text-xs font-semibold text-violet-700">Q{sq.number ? Number(sq.number) : idx + 1}</span>
                  <div className="flex items-center gap-2">
                    {sq.time_limit_seconds ? (
                      <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-300">
                        <Clock className="h-2.5 w-2.5 mr-0.5" />
                        {String(sq.time_limit_seconds)}s
                      </Badge>
                    ) : null}
                    {sq.allow_response_reset === false && (
                      <Badge variant="outline" className="text-[10px] text-orange-500 border-orange-300">No re-record</Badge>
                    )}
                  </div>
                </div>
                <div className="p-3 space-y-3">
                  {sq.text ? (
                    <div
                      className="text-[15px] leading-relaxed prose prose-sm max-w-none [&_p]:my-2 [&_p:empty]:min-h-[1em]"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(String(sq.text)) }}
                    />
                  ) : null}
                  <SpeakingRecorder
                    questionId={`${q.id}-q${idx}`}
                    timeLimitSeconds={sq.time_limit_seconds ? Number(sq.time_limit_seconds) : undefined}
                    allowResponseReset={sq.allow_response_reset !== false}
                  />
                </div>
              </div>
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
