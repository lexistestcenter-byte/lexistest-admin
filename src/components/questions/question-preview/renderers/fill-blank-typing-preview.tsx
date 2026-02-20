"use client";

import { useState, useRef, useEffect } from "react";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import { od, getStr, getArr } from "../helpers";
import type { QuestionPreviewData } from "../types";

export function FillBlankTypingPreview({ data }: { data: QuestionPreviewData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Event delegation: listen for input events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handler = (e: Event) => {
      const input = e.target as HTMLInputElement;
      if (input.tagName === "INPUT" && input.dataset.num) {
        setAnswers((prev) => ({ ...prev, [parseInt(input.dataset.num!)]: input.value }));
      }
    };
    container.addEventListener("input", handler);
    return () => container.removeEventListener("input", handler);
  }, []);

  // Sync answers to DOM inputs
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.querySelectorAll<HTMLInputElement>("input[data-num]").forEach((input) => {
      const num = parseInt(input.dataset.num || "0");
      const val = answers[num] || "";
      if (input.value !== val) input.value = val;
      if (val) {
        input.style.color = "#2563eb";
        input.style.borderBottomColor = "#3b82f6";
        input.style.borderBottomStyle = "solid";
      } else {
        input.style.color = "";
        input.style.borderBottomColor = "#d1d5db";
        input.style.borderBottomStyle = "dashed";
      }
    });
  }, [answers]);

  const o = od(data);
  const contentTitle = getStr(o, "title", data.title || "");
  const inputStyle = getStr(o, "input_style", "editor");
  const items = getArr(o, "items").map(String);

  // Replace [N] with <input> in HTML string
  const replaceWithInput = (html: string): string => {
    return html.replace(/\[(\d+)\]/g, (_, numStr) => {
      const num = parseInt(numStr);
      return `<input type="text" data-num="${num}" style="display:inline;width:100px;border:none;border-bottom:1px dashed #d1d5db;background:transparent;padding:0 4px;font-size:14px;text-align:center;outline:none;vertical-align:baseline" placeholder="${num}" />`;
    });
  };

  // Build full HTML preserving structure (ul/ol/li/p)
  let fullHtml: string;
  if (inputStyle === "items" && items.length > 0) {
    const lis = items
      .filter((i) => i.trim())
      .map((i) => `<li>${replaceWithInput(sanitizeHtmlForDisplay(i))}</li>`)
      .join("");
    fullHtml = `<ul>${lis}</ul>`;
  } else {
    fullHtml = replaceWithInput(sanitizeHtmlForDisplay(data.content || ""));
  }

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4 flex-1 overflow-y-auto">
      {contentTitle && <h2 className="text-lg font-bold border-b pb-3">{contentTitle}</h2>}
      <div
        ref={containerRef}
        className="text-sm leading-[2] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_p]:my-2 [&_p:first-child]:mt-0 [&_strong]:font-bold"
        dangerouslySetInnerHTML={{ __html: fullHtml }}
      />
    </div>
  );
}
