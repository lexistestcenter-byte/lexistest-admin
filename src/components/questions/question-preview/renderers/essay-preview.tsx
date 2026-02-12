"use client";

import { useState } from "react";
import { getCdnUrl } from "@/lib/cdn";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import { od, getStr } from "../helpers";
import type { QuestionPreviewData } from "../types";

export function EssayPreview({ data }: { data: QuestionPreviewData }) {
  const o = od(data);
  const contentTitle = getStr(o, "title", data.title || "Writing Task");
  const condition = getStr(o, "condition");
  const imageUrl = getCdnUrl(getStr(o, "image_url", ""));
  const minWords = Number(o.min_words || 0);

  const [text, setText] = useState("");
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const meetsMinimum = minWords > 0 ? wordCount >= minWords : true;

  return (
    <div className="bg-white rounded-lg overflow-hidden border flex flex-col flex-1 min-h-0">
      <div className="px-4 py-3 border-b bg-slate-50 shrink-0">
        <h2 className="font-bold text-lg">{contentTitle}</h2>
        {condition && <p className="text-sm text-muted-foreground mt-1">{condition}</p>}
      </div>
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 p-4 bg-[#d8dce8] overflow-y-auto">
          {data.content ? (
            <div
              className="prose prose-sm max-w-none text-sm [&_p]:my-3 [&_p:empty]:min-h-[1em] [&_p:has(br:only-child)]:min-h-[1em] [&_strong]:font-bold"
              dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(data.content) }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">(작문 주제 입력)</p>
          )}
          {imageUrl && (
            <div className="mt-4 p-3 bg-white rounded border">
              <img src={imageUrl} alt="Task" className="max-w-full h-auto rounded" />
            </div>
          )}
        </div>
        <div className="flex-1 p-4 flex flex-col">
          <textarea
            spellCheck={false}
            className="flex-1 w-full border border-blue-400 rounded p-3 text-sm resize-none bg-white"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="mt-2 text-sm text-right shrink-0">
            <span className="text-foreground">
              Word Count: {wordCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
