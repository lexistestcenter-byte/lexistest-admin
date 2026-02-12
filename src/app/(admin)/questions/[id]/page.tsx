"use client";

import { use } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Eye, Trash2, Save, Loader2 } from "lucide-react";
import { questionFormats } from "@/components/questions/types";
import { tabToPreviewData } from "@/components/questions/question-preview";
import { questionTypeInfo } from "@/components/questions/constants";
import { useEditQuestionForm } from "@/components/questions/edit/use-edit-question-form";
import { useEditQuestionLoad } from "@/components/questions/edit/use-edit-question-load";
import { useEditQuestionSave } from "@/components/questions/edit/use-edit-question-save";
import { EditSidebar } from "@/components/questions/edit/edit-sidebar";
import { EditPreviewDialog } from "@/components/questions/edit/edit-preview-dialog";
import { DeleteDialog } from "@/components/questions/edit/delete-dialog";

// Lazy-loaded editors (edit-page specific)
const MCQEditor = dynamic(() => import("@/components/questions/edit/mcq-editor").then(m => ({ default: m.MCQEditor })), { ssr: false });
const MatchingEditor = dynamic(() => import("@/components/questions/edit/matching-editor").then(m => ({ default: m.MatchingEditor })), { ssr: false });
const WritingEditor = dynamic(() => import("@/components/questions/edit/writing-editor").then(m => ({ default: m.WritingEditor })), { ssr: false });
const SpeakingPart2EditorEdit = dynamic(() => import("@/components/questions/edit/speaking-part2-editor").then(m => ({ default: m.SpeakingPart2EditorEdit })), { ssr: false });
// Shared editors
const TFNGEditor = dynamic(() => import("@/components/questions/tfng-editor").then(m => ({ default: m.TFNGEditor })), { ssr: false });
const MapLabelingEditor = dynamic(() => import("@/components/questions/map-labeling-editor").then(m => ({ default: m.MapLabelingEditor })), { ssr: false });
const FlowchartEditor = dynamic(() => import("@/components/questions/flowchart-editor").then(m => ({ default: m.FlowchartEditor })), { ssr: false });
const TableCompletionEditor = dynamic(() => import("@/components/questions/table-completion-editor").then(m => ({ default: m.TableCompletionEditor })), { ssr: false });
const FillBlankEditor = dynamic(() => import("@/components/questions/fill-blank-editor").then(m => ({ default: m.FillBlankEditor })), { ssr: false });
const FillBlankDragEditor = dynamic(() => import("@/components/questions/fill-blank-editor").then(m => ({ default: m.FillBlankDragEditor })), { ssr: false });
const SpeakingPart1Editor = dynamic(() => import("@/components/questions/speaking-part1-editor").then(m => ({ default: m.SpeakingPart1Editor })), { ssr: false });
const SpeakingPart3Editor = dynamic(() => import("@/components/questions/speaking-part3-editor").then(m => ({ default: m.SpeakingPart3Editor })), { ssr: false });

export default function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const form = useEditQuestionForm();
  const { isLoading, part2Questions, isLoadingSpeakingData } = useEditQuestionLoad(id, form);
  const { isSaving, isDeleting, showDeleteDialog, setShowDeleteDialog, handleSave, handleDelete } = useEditQuestionSave(id, form);

  const {
    selectedQuestionType, selectedFormat,
    questionCode,
    isPreviewOpen, setIsPreviewOpen,
  } = form;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!selectedQuestionType || !selectedFormat) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">문제 데이터를 불러올 수 없습니다.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/questions">목록으로</Link>
        </Button>
      </div>
    );
  }

  const currentTypeInfo = questionTypeInfo.find(t => t.id === selectedQuestionType);
  const currentFormat = questionFormats[selectedQuestionType]?.find(f => f.value === selectedFormat);

  return (
    <div className="h-screen flex flex-col">
      {/* 헤더 */}
      <div className="border-b px-6 py-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/questions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Link>
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold">{questionCode}</span>
            {currentTypeInfo && (
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${currentTypeInfo.color}`}>
                {currentTypeInfo.name}
              </span>
            )}
            <span className="text-muted-foreground">·</span>
            <span className="text-sm">{currentFormat?.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            미리보기
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
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
                저장
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 왼쪽: 설정 패널 */}
        <EditSidebar
          selectedQuestionType={selectedQuestionType}
          selectedFormat={selectedFormat}
          isPractice={form.isPractice}
          setIsPractice={form.setIsPractice}
          separateNumbers={form.separateNumbers}
          setSeparateNumbers={form.setSeparateNumbers}
          mcqIsMultiple={form.mcqIsMultiple}
          audioUrl={form.audioUrl}
          setAudioUrl={form.setAudioUrl}
          questionCode={questionCode}
          blanks={form.blanks}
          wordBank={form.wordBank}
          tableInputMode={form.tableInputMode}
          generateFollowup={form.generateFollowup}
          setGenerateFollowup={form.setGenerateFollowup}
          addWord={form.addWord}
          updateWord={form.updateWord}
          removeWord={form.removeWord}
        />

        {/* 오른쪽: 에디터 영역 */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto p-8">
            {/* MCQ (통합: 단일/복수) */}
            {selectedFormat === "mcq" && (
              <MCQEditor
                question={form.mcqQuestion}
                setQuestion={form.setMcqQuestion}
                options={form.mcqOptions}
                addOption={form.addMcqOption}
                removeOption={form.removeMcqOption}
                updateOption={form.updateMcqOption}
                toggleCorrect={(optionId) => form.toggleMcqCorrect(optionId, form.mcqIsMultiple)}
                isMultiple={form.mcqIsMultiple}
                setIsMultiple={form.toggleMcqMode}
                maxSelections={form.mcqMaxSelections}
                setMaxSelections={form.setMcqMaxSelections}
              />
            )}

            {/* T/F/NG */}
            {selectedFormat === "true_false_ng" && (
              <TFNGEditor
                statement={form.tfngStatement}
                setStatement={form.setTfngStatement}
                answer={form.tfngAnswer}
                setAnswer={form.setTfngAnswer}
              />
            )}

            {/* 매칭 */}
            {selectedFormat === "matching" && (
              <MatchingEditor
                title={form.matchingTitle}
                setTitle={form.setMatchingTitle}
                content={form.contentHtml}
                setContent={form.setContentHtml}
                allowDuplicate={form.matchingAllowDuplicate}
                setAllowDuplicate={form.setMatchingAllowDuplicate}
                options={form.matchingOptions}
                addOption={form.addMatchingOption}
                removeOption={form.removeMatchingOption}
                updateOption={form.updateMatchingOption}
                items={form.matchingItems}
                setItems={form.setMatchingItems}
              />
            )}

            {/* 빈칸채우기 (직접입력) */}
            {selectedFormat === "fill_blank_typing" && (
              <FillBlankEditor
                title={form.contentTitle}
                setTitle={form.setContentTitle}
                content={form.contentHtml}
                setContent={form.setContentHtml}
                blanks={form.blanks}
                setBlanks={form.setBlanks}
                blankMode={form.blankMode}
                setBlankMode={form.setBlankMode}
              />
            )}

            {/* 빈칸채우기 (드래그앤드랍) */}
            {selectedFormat === "fill_blank_drag" && (
              <FillBlankDragEditor
                title={form.contentTitle}
                setTitle={form.setContentTitle}
                content={form.contentHtml}
                setContent={form.setContentHtml}
                blanks={form.blanks}
                setBlanks={form.setBlanks}
                wordBank={form.wordBank}
                setWordBank={form.setWordBank}
                blankMode={form.blankMode}
                setBlankMode={form.setBlankMode}
                allowDuplicate={form.fillBlankDragAllowDuplicate}
                setAllowDuplicate={form.setFillBlankDragAllowDuplicate}
              />
            )}

            {/* 테이블 완성하기 */}
            {selectedFormat === "table_completion" && (
              <TableCompletionEditor
                title={form.contentTitle}
                setTitle={form.setContentTitle}
                content={form.contentHtml}
                setContent={form.setContentHtml}
                blanks={form.blanks}
                setBlanks={form.setBlanks}
                wordBank={form.wordBank}
                setWordBank={form.setWordBank}
                blankMode={form.blankMode}
                setBlankMode={form.setBlankMode}
                inputMode={form.tableInputMode}
                setInputMode={form.setTableInputMode}
              />
            )}

            {/* 플로우차트 */}
            {selectedFormat === "flowchart" && (
              <FlowchartEditor
                title={form.flowchartTitle}
                setTitle={form.setFlowchartTitle}
                nodes={form.flowchartNodes}
                setNodes={form.setFlowchartNodes}
                addNode={form.addFlowchartNode}
                blanks={form.flowchartBlanks}
                setBlanks={form.setFlowchartBlanks}
                updateBlank={(blankId, field, value) => {
                  form.setFlowchartBlanks(form.flowchartBlanks.map(b => b.id === blankId ? { ...b, [field]: value } : b));
                }}
              />
            )}

            {/* Writing */}
            {selectedFormat === "essay" && (
              <WritingEditor
                title={form.writingTitle}
                setTitle={form.setWritingTitle}
                condition={form.writingCondition}
                setCondition={form.setWritingCondition}
                prompt={form.writingPrompt}
                setPrompt={form.setWritingPrompt}
                minWords={form.writingMinWords}
                setMinWords={form.setWritingMinWords}
              />
            )}

            {/* Speaking Part 1 */}
            {selectedFormat === "speaking_part1" && (
              <SpeakingPart1Editor
                questions={form.speakingQuestions}
                setQuestions={form.setSpeakingQuestions}
              />
            )}

            {/* Speaking Part 2 */}
            {selectedFormat === "speaking_part2" && (
              <SpeakingPart2EditorEdit
                topic={form.cueCardTopic}
                setTopic={form.setCueCardTopic}
                points={form.cueCardPoints}
                setPoints={form.setCueCardPoints}
              />
            )}

            {/* Speaking Part 3 */}
            {selectedFormat === "speaking_part3" && (
              <SpeakingPart3Editor
                questions={form.speakingQuestions}
                setQuestions={form.setSpeakingQuestions}
                relatedPart2Id={form.relatedPart2Id}
                setRelatedPart2Id={form.setRelatedPart2Id}
                part2Questions={part2Questions}
                depthLevel={form.depthLevel}
                setDepthLevel={form.setDepthLevel}
                isLoading={isLoadingSpeakingData}
              />
            )}

            {/* Map Labeling */}
            {selectedFormat === "map_labeling" && (
              <MapLabelingEditor
                title={form.mapLabelingTitle}
                setTitle={form.setMapLabelingTitle}
                passage={form.mapLabelingPassage}
                setPassage={form.setMapLabelingPassage}
                labels={form.mapLabelingLabels}
                setLabels={form.setMapLabelingLabels}
                items={form.mapLabelingItems}
                setItems={form.setMapLabelingItems}
              />
            )}

          </div>
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <DeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        questionCode={questionCode}
        isDeleting={isDeleting}
        onDelete={handleDelete}
      />

      {/* 미리보기 모달 */}
      <EditPreviewDialog
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        questionType={selectedQuestionType}
        previewData={selectedFormat ? tabToPreviewData({
          format: selectedFormat,
          mcqQuestion: form.mcqQuestion, mcqOptions: form.mcqOptions, mcqIsMultiple: form.mcqIsMultiple, mcqMaxSelections: form.mcqMaxSelections,
          tfngStatement: form.tfngStatement,
          matchingTitle: form.matchingTitle, matchingAllowDuplicate: form.matchingAllowDuplicate, matchingOptions: form.matchingOptions,
          contentTitle: form.contentTitle, contentHtml: form.contentHtml, blanks: form.blanks, wordBank: form.wordBank,
          fillBlankDragAllowDuplicate: form.fillBlankDragAllowDuplicate,
          tableInputMode: form.tableInputMode,
          flowchartTitle: form.flowchartTitle, flowchartNodes: form.flowchartNodes,
          writingTitle: form.writingTitle, writingCondition: form.writingCondition, writingPrompt: form.writingPrompt, writingMinWords: form.writingMinWords,
          speakingQuestions: form.speakingQuestions, cueCardTopic: form.cueCardTopic, cueCardPoints: form.cueCardPoints,
          relatedPart2Id: form.relatedPart2Id, depthLevel: form.depthLevel,
          audioUrl: form.audioUrl,
          mapLabelingTitle: form.mapLabelingTitle, mapLabelingPassage: form.mapLabelingPassage,
          mapLabelingLabels: form.mapLabelingLabels,
          mapLabelingItems: form.mapLabelingItems,
          instructions: form.instructions,
          blankMode: form.blankMode,
        }, selectedQuestionType || "") : null}
      />
    </div>
  );
}
