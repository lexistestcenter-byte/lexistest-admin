"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, AlertCircle, FileText } from "lucide-react";
import type { QuestionType, QuestionFormat } from "@/components/questions/types";
import { questionFormats } from "@/components/questions/types";
import { questionTypeInfo, formatIcons, formatDescriptions, formatLabels } from "./constants";
import type { QuestionTab } from "./types";

export function FormatSelector({
  selectedQuestionType,
  tabs,
  activeTabIndex,
  setActiveTabIndex,
  addTab,
  removeTab,
  onSelectFormat,
  onBack,
}: {
  selectedQuestionType: QuestionType;
  tabs: QuestionTab[];
  activeTabIndex: number;
  setActiveTabIndex: (index: number) => void;
  addTab: () => void;
  removeTab: (index: number) => void;
  onSelectFormat: (format: QuestionFormat) => void;
  onBack: () => void;
}) {
  const formats = questionFormats[selectedQuestionType];
  const currentTypeInfo = questionTypeInfo.find(t => t.id === selectedQuestionType);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <div className="border-b px-6 py-4 bg-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tabs.length === 1 && !tabs[0].format ? "유형 변경" : "취소"}
          </Button>
          <div className="h-6 w-px bg-border" />
          {currentTypeInfo && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentTypeInfo.color}`}>
              {currentTypeInfo.name}
            </span>
          )}
        </div>
      </div>

      {/* 탭 바 */}
      {tabs.length > 1 && (
        <div className="border-b px-6 py-2 bg-white flex items-center gap-2">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabIndex(index)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${index === activeTabIndex
                ? "bg-primary text-white"
                : tab.hasError
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-100 hover:bg-slate-200"
                }`}
            >
              {tab.hasError && <AlertCircle className="h-4 w-4" />}
              문제 {index + 1}
              {tab.format && <span className="text-xs opacity-75">({formatLabels[tab.format]})</span>}
            </button>
          ))}
          <button
            onClick={addTab}
            className="px-3 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 형태 선택 */}
      <div className="max-w-3xl mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">문제 형태 선택</h1>
          <p className="text-muted-foreground mt-1">
            {selectedQuestionType === "reading" && "Reading 문제 형태를 선택하세요"}
            {selectedQuestionType === "listening" && "Listening 문제 형태를 선택하세요"}
            {selectedQuestionType === "writing" && "Writing Task를 선택하세요"}
            {selectedQuestionType === "speaking" && "Speaking Part를 선택하세요"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {formats.map((format) => {
            const Icon = formatIcons[format.value] || FileText;
            return (
              <button
                key={format.value}
                onClick={() => onSelectFormat(format.value as QuestionFormat)}
                className="flex items-start gap-4 p-6 border rounded-xl bg-white hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{format.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDescriptions[format.value]}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
