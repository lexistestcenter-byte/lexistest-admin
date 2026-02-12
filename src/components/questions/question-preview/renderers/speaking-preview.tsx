"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { getCdnUrl } from "@/lib/cdn";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import { od, getStr, getArr } from "../helpers";
import type { QuestionPreviewData } from "../types";

function RecordingArea() {
  return (
    <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
      <Mic className="h-8 w-8 text-gray-300 mb-2" />
      <p className="text-sm text-gray-400 mb-2">녹음 영역 (미리보기)</p>
      <Button variant="outline" size="sm" disabled>
        <Mic className="mr-2 h-4 w-4" />
        Start Recording
      </Button>
    </div>
  );
}

export function SpeakingPreview({ data }: { data: QuestionPreviewData }) {
  const fmt = data.question_format;
  const o = od(data);
  const questions = getArr(o, "questions") as Record<string, unknown>[];

  // Part 1 - Multi-question group
  if (fmt === "speaking_part1") {
    return (
      <div className="space-y-4 flex-1 overflow-y-auto">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
            Part 1 &ndash; Interview
          </Badge>
          <span className="text-xs text-muted-foreground">{questions.length || 1} question(s)</span>
        </div>
        {questions.length > 0 ? (
          <div className="space-y-3">
            {questions.map((sq, i) => (
              <div key={i} className="bg-white rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-700">Q{sq.number ? Number(sq.number) : i + 1}</span>
                  {sq.time_limit_seconds ? <span className="text-[10px] text-gray-500">{String(sq.time_limit_seconds)}s</span> : null}
                </div>
                <p className="text-sm" dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(String(sq.text || "")) }} />
                <RecordingArea />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border p-6">
            <p className="text-lg" dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(data.content || "(질문 입력)") }} />
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
              Part 2 - Cue Card
            </Badge>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-base font-semibold text-gray-900">{topic || "(주제 입력)"}</p>
            {points.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">You should say:</p>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700 pl-2">
                  {points.map((point, i) => (
                    <li key={i} className="leading-relaxed">{point || `(포인트 ${i + 1})`}</li>
                  ))}
                </ul>
              </div>
            )}
            {imageUrl && (
              <div className="mt-3 p-2 bg-white rounded border">
                <img src={imageUrl} alt="Cue card visual" className="max-w-full h-auto max-h-[200px] rounded mx-auto" />
              </div>
            )}
          </div>
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-700">
            준비 시간: 1분 | 발표 시간: 1-2분
          </div>
        </div>
        <RecordingArea />
      </div>
    );
  }

  // Part 3 - Multi-question group
  if (fmt === "speaking_part3") {
    const depthLabel = data.depthLevel ? `Level ${data.depthLevel}` : null;

    return (
      <div className="space-y-4 flex-1 overflow-y-auto">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-medium bg-violet-50 text-violet-700 border-violet-200">
            Part 3 &ndash; Discussion
          </Badge>
          {depthLabel && <Badge variant="secondary" className="text-xs">{depthLabel}</Badge>}
          <span className="text-xs text-muted-foreground">{questions.length || 1} question(s)</span>
        </div>
        {(data.relatedPart2Id || data.relatedPart2Code) && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
            연결된 Part 2: <span className="font-mono">{data.relatedPart2Code || data.relatedPart2Id}</span>
          </div>
        )}
        {questions.length > 0 ? (
          <div className="space-y-3">
            {questions.map((sq, i) => (
              <div key={i} className="bg-white rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-violet-700">Q{sq.number ? Number(sq.number) : i + 1}</span>
                  {sq.time_limit_seconds ? <span className="text-[10px] text-gray-500">{String(sq.time_limit_seconds)}s</span> : null}
                </div>
                <p className="text-sm" dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(String(sq.text || "")) }} />
                <RecordingArea />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border p-6">
            <p className="text-lg" dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(data.content || "(질문 입력)") }} />
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
