"use client";

import { FileText } from "lucide-react";
import type { QuestionFormat } from "@/components/questions/types";
import type { TabState } from "../types";
import { formatIcons, formatDescriptions } from "../types";

interface FormatSelectionProps {
  formats: { value: string; label: string }[];
  questionType: string;
  updateTab: (updates: Partial<TabState>) => void;
}

export function FormatSelection({ formats, questionType, updateTab }: FormatSelectionProps) {
  return (
    <div className="p-8">
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold">문제 형태 선택</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {questionType.charAt(0).toUpperCase() + questionType.slice(1)} 문제 형태를 선택하세요.
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto">
        {formats.map((f) => {
          const Icon = formatIcons[f.value] || FileText;
          return (
            <button
              key={f.value}
              onClick={() => updateTab({ selectedFormat: f.value as QuestionFormat })}
              className="flex items-start gap-3 p-4 border-2 rounded-lg bg-white hover:border-primary hover:shadow transition-all text-left"
            >
              <Icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-sm">{f.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {formatDescriptions[f.value] || ""}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
