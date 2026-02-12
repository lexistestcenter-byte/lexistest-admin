"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type QuestionType,
  questionFormats,
} from "@/components/questions/types";
import type { CreateQuestionModalProps } from "./types";
import { useModalForm } from "./hooks/use-modal-form";
import { useModalSave } from "./hooks/use-modal-save";
import { TabBar } from "./components/tab-bar";
import { FormatSelection } from "./components/format-selection";
import { SettingsPanel } from "./components/settings-panel";

// Lazy-loaded editors to reduce initial bundle
const MCQEditor = dynamic(() => import("@/components/questions/mcq-editor").then(m => ({ default: m.MCQEditor })), { ssr: false });
const TFNGEditor = dynamic(() => import("@/components/questions/tfng-editor").then(m => ({ default: m.TFNGEditor })), { ssr: false });
const WritingEditor = dynamic(() => import("@/components/questions/writing-editor").then(m => ({ default: m.WritingEditor })), { ssr: false });
const MapLabelingEditor = dynamic(() => import("@/components/questions/map-labeling-editor").then(m => ({ default: m.MapLabelingEditor })), { ssr: false });
const ModalMatchingEditor = dynamic(() => import("./editors/matching-editor").then(m => ({ default: m.ModalMatchingEditor })), { ssr: false });
const ModalFillBlankEditor = dynamic(() => import("./editors/fill-blank-wrapper").then(m => ({ default: m.ModalFillBlankEditor })), { ssr: false });
const ModalTableCompletionEditor = dynamic(() => import("./editors/table-completion-wrapper").then(m => ({ default: m.ModalTableCompletionEditor })), { ssr: false });
const ModalFlowchartEditor = dynamic(() => import("./editors/flowchart-wrapper").then(m => ({ default: m.ModalFlowchartEditor })), { ssr: false });
const ModalSpeakingSimpleEditor = dynamic(() => import("./editors/speaking-simple-editor").then(m => ({ default: m.ModalSpeakingSimpleEditor })), { ssr: false });
const ModalSpeakingPart2Editor = dynamic(() => import("./editors/speaking-part2-editor").then(m => ({ default: m.ModalSpeakingPart2Editor })), { ssr: false });

export function CreateQuestionModal({
  open,
  onOpenChange,
  sectionType,
  onCreated,
}: CreateQuestionModalProps) {
  const questionType = sectionType as QuestionType;
  const formats = questionFormats[questionType] || [];

  const form = useModalForm(open, onOpenChange, questionType);
  const { isSaving, saveProgress, unsavedCount, handleSaveAll } = useModalSave(form, questionType, onCreated);

  const { tab, updateTab, tabs } = form;
  const fmt = tab.selectedFormat;

  return (
    <div
      className={cn(
        "fixed top-0 left-[420px] h-full bg-white border-l shadow-xl z-50 transition-[width] duration-300 ease-in-out overflow-hidden",
        open ? "w-[calc(100vw-440px)]" : "w-0 border-l-0"
      )}
    >
      <div className="min-w-[calc(100vw-440px)] h-full flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b shrink-0 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            새 문제 만들기 — {questionType.charAt(0).toUpperCase() + questionType.slice(1)}
          </h2>
          <button
            type="button"
            className="p-1.5 rounded hover:bg-slate-100 transition-colors"
            onClick={form.handlePanelClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab bar - shown when at least one tab has a format selected */}
        {tabs.some((t) => t.selectedFormat) && (
          <TabBar
            tabs={tabs}
            activeTabIdx={form.activeTabIdx}
            setActiveTabIdx={form.setActiveTabIdx}
            removeTab={form.removeTab}
            addTab={form.addTab}
            isSaving={isSaving}
            saveProgress={saveProgress}
            unsavedCount={unsavedCount}
            handleSaveAll={handleSaveAll}
          />
        )}

        {!fmt ? (
          <FormatSelection
            formats={formats}
            questionType={questionType}
            updateTab={updateTab}
          />
        ) : (
          /* Editor area */
          <div className="flex-1 min-h-0 flex flex-col">
            {/* Editor header */}
            <div className="border-b px-6 py-2.5 flex items-center bg-white shrink-0">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => updateTab({ selectedFormat: null })} disabled={tab.saved}>
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  형태 변경
                </Button>
                <Badge variant="outline">{formats.find((f) => f.value === fmt)?.label || fmt}</Badge>
                {tab.saved && (
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    <Check className="h-3 w-3 mr-1" />
                    저장 완료
                  </Badge>
                )}
              </div>
            </div>

            {/* 2-panel content */}
            <div className="flex-1 flex overflow-hidden">
              {/* 좌측: 설정 사이드바 */}
              <div className="w-72 border-r bg-slate-50 overflow-y-auto shrink-0">
                <div className="p-4">
                  <SettingsPanel
                    tab={tab}
                    updateTab={updateTab}
                    questionType={questionType}
                    toggleMcqMode={form.toggleMcqMode}
                    correctCount={form.correctCount}
                    part2Questions={form.part2Questions}
                    isLoadingSpeakingData={form.isLoadingSpeakingData}
                  />
                </div>
              </div>

              {/* 우측: 에디터 */}
              <div className="flex-1 overflow-y-auto bg-white">
                <div className="max-w-4xl mx-auto p-6 space-y-6">
                  {tab.saved && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 text-center">
                      이 문제는 이미 저장되었습니다. 새 문제를 추가하려면 &quot;+&quot; 탭을 클릭하세요.
                    </div>
                  )}

                  {/* Instructions (공통, MCQ/T/F/NG/flowchart 제외) */}
                  {fmt !== "mcq" && fmt !== "true_false_ng" && fmt !== "flowchart" && (
                    <div>
                      <Label className="text-sm font-medium">지시문 (Instructions)</Label>
                      <Textarea
                        className="mt-1"
                        placeholder="예: Choose the correct letter, A, B, C or D."
                        value={tab.instructions}
                        onChange={(e) => updateTab({ instructions: e.target.value })}
                        rows={2}
                        disabled={tab.saved}
                      />
                    </div>
                  )}

                  {/* Format-specific editors */}
                  {fmt === "mcq" && (
                    <MCQEditor
                      question={tab.mcqQuestion}
                      setQuestion={(v) => updateTab({ mcqQuestion: v })}
                      options={tab.mcqOptions}
                      addOption={form.addMcqOption}
                      removeOption={form.removeMcqOption}
                      updateOption={(id, field, value) => form.updateMcqOption(id, { [field]: value })}
                      toggleCorrect={(id) => {
                        if (tab.mcqIsMultiple) {
                          form.updateMcqOption(id, { isCorrect: !tab.mcqOptions.find(o => o.id === id)?.isCorrect });
                        } else {
                          updateTab({ mcqOptions: tab.mcqOptions.map((o) => ({ ...o, isCorrect: o.id === id })) });
                        }
                      }}
                      isMultiple={tab.mcqIsMultiple}
                      setIsMultiple={form.toggleMcqMode}
                      maxSelections={tab.mcqMaxSelections}
                      setMaxSelections={(v) => updateTab({ mcqMaxSelections: v })}
                      disabled={tab.saved}
                    />
                  )}
                  {fmt === "true_false_ng" && (
                    <TFNGEditor
                      statement={tab.tfngStatement}
                      setStatement={(v) => updateTab({ tfngStatement: v })}
                      answer={tab.tfngAnswer}
                      setAnswer={(v) => updateTab({ tfngAnswer: v })}
                      disabled={tab.saved}
                    />
                  )}
                  {fmt === "matching" && (
                    <ModalMatchingEditor
                      tab={tab}
                      updateTab={updateTab}
                      addMatchingOption={form.addMatchingOption}
                      removeMatchingOption={form.removeMatchingOption}
                      addMatchingItem={form.addMatchingItem}
                      removeMatchingItem={form.removeMatchingItem}
                    />
                  )}
                  {(fmt === "fill_blank_typing" || fmt === "fill_blank_drag") && (
                    <ModalFillBlankEditor tab={tab} updateTab={updateTab} />
                  )}
                  {fmt === "table_completion" && (
                    <ModalTableCompletionEditor tab={tab} updateTab={updateTab} />
                  )}
                  {fmt === "flowchart" && (
                    <ModalFlowchartEditor
                      tab={tab}
                      updateTab={updateTab}
                      addFlowchartNode={form.addFlowchartNode}
                    />
                  )}
                  {fmt === "map_labeling" && (
                    <MapLabelingEditor
                      title={tab.mapTitle}
                      setTitle={(v) => updateTab({ mapTitle: v })}
                      passage={tab.mapPassage}
                      setPassage={(v) => updateTab({ mapPassage: v })}
                      labels={tab.mapLabels}
                      setLabels={(v) => updateTab({ mapLabels: v })}
                      items={tab.mapItems}
                      setItems={(v) => updateTab({ mapItems: v })}
                      disabled={tab.saved}
                    />
                  )}
                  {fmt === "essay" && (
                    <WritingEditor
                      title={tab.essayTitle}
                      setTitle={(v) => updateTab({ essayTitle: v })}
                      condition={tab.essayCondition}
                      setCondition={(v) => updateTab({ essayCondition: v })}
                      prompt={tab.essayPrompt}
                      setPrompt={(v) => updateTab({ essayPrompt: v })}
                      minWords={tab.essayMinWords}
                      setMinWords={(v) => updateTab({ essayMinWords: v })}
                      disabled={tab.saved}
                    />
                  )}
                  {(fmt === "speaking_part1" || fmt === "speaking_part3") && (
                    <ModalSpeakingSimpleEditor
                      tab={tab}
                      updateTab={updateTab}
                      expandedSpeakingCards={form.expandedSpeakingCards}
                      setExpandedSpeakingCards={form.setExpandedSpeakingCards}
                      toggleSpeakingCard={form.toggleSpeakingCard}
                    />
                  )}
                  {fmt === "speaking_part2" && (
                    <ModalSpeakingPart2Editor tab={tab} updateTab={updateTab} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
