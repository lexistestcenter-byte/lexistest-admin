"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Eye, Save, Loader2, AlertCircle, X } from "lucide-react";
import { questionFormats, type QuestionFormat } from "@/components/questions/types";
import { questionTypeInfo, formatLabels } from "@/components/questions/create/constants";
import { useQuestionForm } from "@/components/questions/create/use-question-form";
import { useQuestionSave } from "@/components/questions/create/use-question-save";
import { QuestionTypeSelector } from "@/components/questions/create/question-type-selector";
import { FormatSelector } from "@/components/questions/create/format-selector";
import { EditorSidebar } from "@/components/questions/create/editor-sidebar";
import { PreviewDialog } from "@/components/questions/create/preview-dialog";

// Lazy-loaded editors (shared)
const MCQEditor = dynamic(() => import("@/components/questions/mcq-editor").then(m => ({ default: m.MCQEditor })), { ssr: false });
const TFNGEditor = dynamic(() => import("@/components/questions/tfng-editor").then(m => ({ default: m.TFNGEditor })), { ssr: false });
const WritingEditor = dynamic(() => import("@/components/questions/writing-editor").then(m => ({ default: m.WritingEditor })), { ssr: false });
const MapLabelingEditor = dynamic(() => import("@/components/questions/map-labeling-editor").then(m => ({ default: m.MapLabelingEditor })), { ssr: false });
const FlowchartEditor = dynamic(() => import("@/components/questions/flowchart-editor").then(m => ({ default: m.FlowchartEditor })), { ssr: false });
const TableCompletionEditor = dynamic(() => import("@/components/questions/table-completion-editor").then(m => ({ default: m.TableCompletionEditor })), { ssr: false });
const FillBlankEditor = dynamic(() => import("@/components/questions/fill-blank-editor").then(m => ({ default: m.FillBlankEditor })), { ssr: false });
const FillBlankDragEditor = dynamic(() => import("@/components/questions/fill-blank-editor").then(m => ({ default: m.FillBlankDragEditor })), { ssr: false });
const MatchingEditor = dynamic(() => import("@/components/questions/create/matching-editor").then(m => ({ default: m.MatchingEditor })), { ssr: false });
const SpeakingPart1Editor = dynamic(() => import("@/components/questions/speaking-part1-editor").then(m => ({ default: m.SpeakingPart1Editor })), { ssr: false });
const SpeakingPart2Editor = dynamic(() => import("@/components/questions/create/speaking-part2-editor").then(m => ({ default: m.SpeakingPart2Editor })), { ssr: false });
const SpeakingPart3Editor = dynamic(() => import("@/components/questions/speaking-part3-editor").then(m => ({ default: m.SpeakingPart3Editor })), { ssr: false });

export default function NewQuestionPage() {
  const form = useQuestionForm();
  const { isSaving, handleSave } = useQuestionSave(
    form.tabs, form.setTabs, form.setActiveTabIndex, form.selectedQuestionType,
  );
  const {
    selectedQuestionType, setSelectedQuestionType,
    tabs, activeTabIndex, setActiveTabIndex,
    isPreviewOpen, setIsPreviewOpen,
    currentTab, updateCurrentTab,
    addTab, removeTab, resetCurrentTabFormat,
    addMcqOption, removeMcqOption, updateMcqOption, toggleMcqCorrect, toggleMcqMode,
    addMatchingOption, removeMatchingOption, updateMatchingOption, updateMatchingOptionLabel,
    addMatchingItem, updateMatchingItem, removeMatchingItem,
    addFlowchartNode,
    addWord, updateWord, removeWord,
  } = form;

  // Step 1: 문제 유형 선택
  if (!selectedQuestionType) {
    return <QuestionTypeSelector onSelect={setSelectedQuestionType} />;
  }

  // Step 2: 형태 선택
  if (!currentTab.format) {
    return (
      <FormatSelector
        selectedQuestionType={selectedQuestionType}
        tabs={tabs}
        activeTabIndex={activeTabIndex}
        setActiveTabIndex={setActiveTabIndex}
        addTab={addTab}
        removeTab={removeTab}
        onSelectFormat={(f: QuestionFormat) => updateCurrentTab("format", f)}
        onBack={() => {
          if (tabs.length === 1 && !tabs[0].format) {
            setSelectedQuestionType(null);
          } else {
            removeTab(activeTabIndex);
          }
        }}
      />
    );
  }

  // Step 3: 에디터
  const currentTypeInfo = questionTypeInfo.find(t => t.id === selectedQuestionType);
  const formatLabel = questionFormats[selectedQuestionType].find(f => f.value === currentTab.format)?.label || currentTab.format;

  return (
    <div className="h-screen flex flex-col">
      {/* 헤더 */}
      <div className="border-b px-6 py-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={resetCurrentTabFormat}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            형태 변경
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            {currentTypeInfo && (
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${currentTypeInfo.color}`}>
                {currentTypeInfo.name}
              </span>
            )}
            <span className="font-medium">{formatLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            미리보기
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                저장 ({tabs.length}개)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 탭 바 */}
      <div className="border-b px-6 py-2 bg-white flex items-center gap-2">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${index === activeTabIndex
              ? "bg-primary text-white"
              : tab.hasError
                ? "bg-red-100 text-red-700"
                : "bg-slate-100 hover:bg-slate-200"
              }`}
            onClick={() => setActiveTabIndex(index)}
          >
            {tab.hasError && <AlertCircle className="h-4 w-4" />}
            문제 {index + 1}
            {tab.format && (
              <span className="text-xs opacity-75">
                ({questionFormats[selectedQuestionType].find(f => f.value === tab.format)?.label || tab.format})
              </span>
            )}
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeTab(index);
                }}
                className="ml-1 hover:bg-white/20 rounded p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addTab}
          className="px-3 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          추가
        </button>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 왼쪽: 설정 패널 */}
        <EditorSidebar
          currentTab={currentTab}
          selectedQuestionType={selectedQuestionType}
          updateCurrentTab={updateCurrentTab}
          addWord={addWord}
          updateWord={updateWord}
          removeWord={removeWord}
        />

        {/* 오른쪽: 에디터 영역 */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto p-8">
            {/* 지시문 - MCQ/T·F·NG/flowchart/essay 제외 */}
            {currentTab.format && currentTab.format !== "mcq" && currentTab.format !== "true_false_ng" && currentTab.format !== "flowchart" && currentTab.format !== "essay" && (
              <div className="mb-6">
                <Label className="text-sm font-medium">지시문 (Instructions)</Label>
                <Textarea
                  className="mt-1"
                  placeholder="예: Choose the correct letter, A, B, C or D."
                  value={currentTab.instructions || ""}
                  onChange={(e) => updateCurrentTab("instructions", e.target.value)}
                  rows={2}
                />
              </div>
            )}

            {currentTab.format === "mcq" && (
              <MCQEditor
                question={currentTab.mcqQuestion}
                setQuestion={(v) => updateCurrentTab("mcqQuestion", v)}
                options={currentTab.mcqOptions}
                addOption={addMcqOption}
                removeOption={removeMcqOption}
                updateOption={updateMcqOption}
                toggleCorrect={toggleMcqCorrect}
                isMultiple={currentTab.mcqIsMultiple}
                setIsMultiple={toggleMcqMode}
                maxSelections={currentTab.mcqMaxSelections}
                setMaxSelections={(v) => updateCurrentTab("mcqMaxSelections", v)}
              />
            )}

            {currentTab.format === "true_false_ng" && (
              <TFNGEditor
                statement={currentTab.tfngStatement}
                setStatement={(v) => updateCurrentTab("tfngStatement", v)}
                answer={currentTab.tfngAnswer}
                setAnswer={(v) => updateCurrentTab("tfngAnswer", v)}
              />
            )}

            {currentTab.format === "matching" && (
              <MatchingEditor
                title={currentTab.matchingTitle}
                setTitle={(v) => updateCurrentTab("matchingTitle", v)}
                content={currentTab.contentHtml}
                setContent={(v) => updateCurrentTab("contentHtml", v)}
                allowDuplicate={currentTab.matchingAllowDuplicate}
                setAllowDuplicate={(v) => updateCurrentTab("matchingAllowDuplicate", v)}
                options={currentTab.matchingOptions}
                addOption={addMatchingOption}
                removeOption={removeMatchingOption}
                updateOption={updateMatchingOption}
                updateOptionLabel={updateMatchingOptionLabel}
                items={currentTab.matchingItems}
                setItems={(v) => updateCurrentTab("matchingItems", v)}
              />
            )}

            {currentTab.format === "fill_blank_typing" && (
              <FillBlankEditor
                title={currentTab.contentTitle}
                setTitle={(v) => updateCurrentTab("contentTitle", v)}
                content={currentTab.contentHtml}
                setContent={(v) => updateCurrentTab("contentHtml", v)}
                blanks={currentTab.blanks}
                setBlanks={(v) => updateCurrentTab("blanks", v)}
                blankMode={currentTab.blankMode}
                setBlankMode={(v) => updateCurrentTab("blankMode", v)}
              />
            )}

            {currentTab.format === "fill_blank_drag" && (
              <FillBlankDragEditor
                title={currentTab.contentTitle}
                setTitle={(v) => updateCurrentTab("contentTitle", v)}
                content={currentTab.contentHtml}
                setContent={(v) => updateCurrentTab("contentHtml", v)}
                blanks={currentTab.blanks}
                setBlanks={(v) => updateCurrentTab("blanks", v)}
                wordBank={currentTab.wordBank}
                setWordBank={(v) => updateCurrentTab("wordBank", v)}
                blankMode={currentTab.blankMode}
                setBlankMode={(v) => updateCurrentTab("blankMode", v)}
                allowDuplicate={currentTab.fillBlankDragAllowDuplicate}
                setAllowDuplicate={(v) => updateCurrentTab("fillBlankDragAllowDuplicate", v)}
              />
            )}

            {currentTab.format === "table_completion" && (
              <TableCompletionEditor
                title={currentTab.contentTitle}
                setTitle={(v) => updateCurrentTab("contentTitle", v)}
                content={currentTab.contentHtml}
                setContent={(v) => updateCurrentTab("contentHtml", v)}
                blanks={currentTab.blanks}
                setBlanks={(v) => updateCurrentTab("blanks", v)}
                wordBank={currentTab.wordBank}
                setWordBank={(v) => updateCurrentTab("wordBank", v)}
                blankMode={currentTab.blankMode}
                setBlankMode={(v) => updateCurrentTab("blankMode", v)}
                inputMode={currentTab.tableInputMode}
                setInputMode={(v) => updateCurrentTab("tableInputMode", v)}
              />
            )}

            {currentTab.format === "flowchart" && (
              <FlowchartEditor
                title={currentTab.flowchartTitle}
                setTitle={(v) => updateCurrentTab("flowchartTitle", v)}
                nodes={currentTab.flowchartNodes}
                setNodes={(v) => updateCurrentTab("flowchartNodes", v)}
                addNode={addFlowchartNode}
                blanks={currentTab.flowchartBlanks}
                setBlanks={(v) => updateCurrentTab("flowchartBlanks", v)}
                updateBlank={(id, field, value) => {
                  updateCurrentTab("flowchartBlanks", currentTab.flowchartBlanks.map(b => b.id === id ? { ...b, [field]: value } : b));
                }}
              />
            )}

            {currentTab.format === "essay" && (
              <WritingEditor
                title={currentTab.writingTitle}
                setTitle={(v) => updateCurrentTab("writingTitle", v)}
                condition={currentTab.writingCondition}
                setCondition={(v) => updateCurrentTab("writingCondition", v)}
                prompt={currentTab.writingPrompt}
                setPrompt={(v) => updateCurrentTab("writingPrompt", v)}
                minWords={currentTab.writingMinWords}
                setMinWords={(v) => updateCurrentTab("writingMinWords", v)}
              />
            )}

            {currentTab.format === "speaking_part1" && (
              <SpeakingPart1Editor
                questions={currentTab.speakingQuestions}
                setQuestions={(v) => updateCurrentTab("speakingQuestions", v)}
              />
            )}

            {currentTab.format === "speaking_part2" && (
              <SpeakingPart2Editor
                topic={currentTab.cueCardTopic}
                setTopic={(v) => updateCurrentTab("cueCardTopic", v)}
                points={currentTab.cueCardPoints}
                setPoints={(v) => updateCurrentTab("cueCardPoints", v)}
              />
            )}

            {currentTab.format === "speaking_part3" && (
              <SpeakingPart3Editor
                questions={currentTab.speakingQuestions}
                setQuestions={(v) => updateCurrentTab("speakingQuestions", v)}
              />
            )}

            {currentTab.format === "map_labeling" && (
              <MapLabelingEditor
                title={currentTab.mapLabelingTitle}
                setTitle={(v) => updateCurrentTab("mapLabelingTitle", v)}
                passage={currentTab.mapLabelingPassage}
                setPassage={(v) => updateCurrentTab("mapLabelingPassage", v)}
                labels={currentTab.mapLabelingLabels}
                setLabels={(v) => updateCurrentTab("mapLabelingLabels", v)}
                items={currentTab.mapLabelingItems}
                setItems={(v) => updateCurrentTab("mapLabelingItems", v)}
              />
            )}
          </div>
        </div>
      </div>

      {/* 미리보기 다이얼로그 */}
      <PreviewDialog
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        questionType={selectedQuestionType}
        tab={currentTab}
      />

      {/* 저장 중 오버레이 */}
      {isSaving && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg px-8 py-6 flex flex-col items-center gap-3 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">저장 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}
