"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

export function TFNGEditor({
  statement,
  setStatement,
  answer,
  setAnswer,
  disabled,
}: {
  statement: string;
  setStatement: (v: string) => void;
  answer: "true" | "false" | "not_given";
  setAnswer: (v: "true" | "false" | "not_given") => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>문항 제목 <span className="text-red-500">*</span></Label>
        <RichTextEditor
          value={statement}
          onChange={setStatement}
          placeholder="예: The number of students increased significantly in 2020."
          minHeight="80px"
        />
      </div>

      <div className="space-y-3">
        <Label>정답</Label>
        <div className="flex gap-3">
          {(["true", "false", "not_given"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setAnswer(opt)}
              disabled={disabled}
              className={cn(
                "flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all border-2",
                answer === opt
                  ? "bg-primary text-white border-primary"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-200"
              )}
            >
              {opt === "true" ? "TRUE" : opt === "false" ? "FALSE" : "NOT GIVEN"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
