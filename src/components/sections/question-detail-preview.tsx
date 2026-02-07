"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface QuestionDetailPreviewProps {
  question: {
    question_format: string;
    content: string;
    instructions: string | null;
    options_data: Record<string, unknown> | null;
    answer_data: Record<string, unknown> | null;
  };
}

export function QuestionDetailPreview({ question }: QuestionDetailPreviewProps) {
  const od = question.options_data || {};
  const ad = question.answer_data || {};
  const fmt = question.question_format;

  const mcqOptions: { label: string; text: string; isCorrect?: boolean }[] =
    Array.isArray(od.options)
      ? (od.options as { label: string; text: string; isCorrect?: boolean }[])
      : [];

  const tfngItems: { number: number; statement: string }[] =
    Array.isArray(od.items)
      ? (od.items as { number: number; statement: string }[])
      : [];

  const matchOptions: { label: string; text: string }[] =
    Array.isArray(od.options)
      ? (od.options as { label: string; text: string }[])
      : [];

  const matchItems: { number: number; statement: string }[] =
    Array.isArray(od.items)
      ? (od.items as { number: number; statement: string }[])
      : [];

  const wordBank: string[] = Array.isArray(od.word_bank)
    ? (od.word_bank as string[])
    : Array.isArray(od.wordBank)
      ? (od.wordBank as string[])
      : [];

  const blanks: { number: number; answer: string }[] = Array.isArray(
    (ad as Record<string, unknown>).blanks
  )
    ? ((ad as Record<string, unknown>).blanks as {
        number: number;
        answer: string;
      }[])
    : [];

  const tfngAnswer = String(
    (ad as Record<string, unknown>)?.answer ?? "\u2014"
  );
  const essayCondition = od.condition ? String(od.condition) : null;

  return (
    <div className="mt-2 p-3 bg-white border rounded-lg text-sm space-y-2">
      {question.instructions && (
        <div className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded">
          {question.instructions}
        </div>
      )}

      {question.content && (
        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-xs">
          {question.content}
        </div>
      )}

      {/* MCQ */}
      {(fmt === "mcq_single" || fmt === "mcq_multiple") &&
        mcqOptions.length > 0 && (
          <div className="space-y-1">
            {mcqOptions.map((opt) => (
              <div
                key={opt.label}
                className={cn(
                  "flex gap-2 text-xs p-1.5 rounded",
                  opt.isCorrect
                    ? "bg-green-50 text-green-700"
                    : "text-gray-600"
                )}
              >
                <span className="font-bold min-w-[20px]">{opt.label}</span>
                <span>{opt.text}</span>
                {opt.isCorrect && (
                  <Badge className="ml-auto text-[9px] bg-green-100 text-green-700 border-green-300">
                    정답
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

      {/* T/F/NG */}
      {fmt === "true_false_ng" && (
        <div className="space-y-1">
          {tfngItems.length > 0 ? (
            tfngItems.map((item) => (
              <div
                key={item.number}
                className="text-xs text-gray-600 p-1"
              >
                <span className="font-bold mr-1">{item.number}.</span>
                {item.statement}
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500">
              답: {tfngAnswer}
            </div>
          )}
        </div>
      )}

      {/* 매칭 */}
      {(fmt === "matching" || fmt === "heading_matching") && (
        <div className="space-y-2">
          {matchOptions.length > 0 && (
            <div className="text-xs space-y-0.5">
              <span className="font-semibold text-gray-500">보기:</span>
              {matchOptions.map((opt) => (
                <div key={opt.label} className="flex gap-1 pl-2">
                  <span className="font-bold text-blue-600">{opt.label}</span>
                  <span className="text-gray-600">{opt.text}</span>
                </div>
              ))}
            </div>
          )}
          {matchItems.length > 0 && (
            <div className="text-xs space-y-0.5">
              <span className="font-semibold text-gray-500">항목:</span>
              {matchItems.map((item) => (
                <div key={item.number} className="pl-2 text-gray-600">
                  <span className="font-bold mr-1">{item.number}.</span>
                  {item.statement}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 빈칸 - word bank */}
      {(fmt === "fill_blank_drag" || fmt === "table_completion") &&
        wordBank.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-gray-500 mr-1">Word Bank:</span>
            {wordBank.map((w, i) => (
              <span
                key={i}
                className="text-xs px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded"
              >
                {w}
              </span>
            ))}
          </div>
        )}

      {/* 정답 (빈칸 계열) */}
      {(fmt === "fill_blank_typing" ||
        fmt === "fill_blank_drag" ||
        fmt === "flowchart" ||
        fmt === "table_completion") &&
        blanks.length > 0 && (
          <div className="text-xs space-y-0.5">
            <span className="font-semibold text-gray-500">정답:</span>
            {blanks.map((b) => (
              <div key={b.number} className="pl-2 text-green-700">
                [{b.number}] {b.answer}
              </div>
            ))}
          </div>
        )}

      {/* 에세이 조건 */}
      {fmt === "essay" && essayCondition && (
        <div className="text-xs text-gray-500">조건: {essayCondition}</div>
      )}
    </div>
  );
}
