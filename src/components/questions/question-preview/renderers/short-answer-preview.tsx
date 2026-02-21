"use client";

import { useState } from "react";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import type { QuestionPreviewData } from "../types";

export function ShortAnswerPreview({ data }: { data: QuestionPreviewData }) {
  const [answer, setAnswer] = useState("");

  const question = data.content || "";

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4 flex-1 overflow-y-auto">
      {data.title && <h2 className="text-lg font-bold border-b pb-3">{data.title}</h2>}
      <div className="space-y-2">
        <div
          className="text-sm"
          dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(question) }}
        />
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full border-b border-dashed border-gray-300 bg-transparent px-1 py-1 text-sm outline-none focus:border-blue-500 focus:border-solid"
          placeholder="Answer"
        />
      </div>
    </div>
  );
}
