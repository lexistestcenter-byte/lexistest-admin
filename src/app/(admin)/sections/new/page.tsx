"use client";

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { SectionPreview } from "@/components/sections/section-preview";
import { CreateQuestionModal } from "@/components/sections/create-question-modal";
import { useNewSection } from "@/components/sections/create/hooks/use-new-section";
import { StepIndicator } from "@/components/sections/create/step-indicator";
import { StepNav } from "@/components/sections/create/step-nav";
import { StepBasicInfo } from "@/components/sections/create/step-basic-info";
import { StepStructure } from "@/components/sections/create/step-structure";
import { QuestionAddDrawer } from "@/components/sections/create/question-add-drawer";

export default function NewSectionPage() {
  const s = useNewSection();

  return (
    <div className="space-y-6">
      <PageHeader
        title="시험 생성"
        description="문제들을 조합하여 새로운 시험을 생성합니다."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/sections">
                <ArrowLeft className="mr-2 h-4 w-4" />
                목록으로
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={s.openPreview}
              disabled={s.isLoadingPreview}
            >
              {s.isLoadingPreview ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              미리보기
            </Button>
          </div>
        }
      />

      <StepIndicator
        currentStep={s.currentStep}
        setCurrentStep={s.setCurrentStep}
        validateStep={s.validateStep}
      />
      <StepNav
        currentStep={s.currentStep}
        isSaving={s.isSaving}
        handlePrev={s.handlePrev}
        handleNext={s.handleNext}
        handleSave={s.handleSave}
      />

      {/* ─── Step 1: 기본 정보 ─── */}
      {s.currentStep === 1 && (
        <StepBasicInfo
          sectionType={s.sectionType}
          onSectionTypeChange={s.handleSectionTypeChange}
          title={s.title}
          setTitle={s.setTitle}
          description={s.description}
          setDescription={s.setDescription}
          timeLimit={s.timeLimit}
          setTimeLimit={s.setTimeLimit}
          isPractice={s.isPractice}
          setIsPractice={s.setIsPractice}
          instructionTitle={s.instructionTitle}
          setInstructionTitle={s.setInstructionTitle}
          instructionHtml={s.instructionHtml}
          setInstructionHtml={s.setInstructionHtml}
          instructionAudioUrl={s.instructionAudioUrl}
          setInstructionAudioUrl={s.setInstructionAudioUrl}
          instructionAudioFile={s.instructionAudioFile}
          setInstructionAudioFile={s.setInstructionAudioFile}
        />
      )}

      {/* ─── Step 2: 섹션 구성 ─── */}
      {s.currentStep === 2 && (
        <StepStructure
          sectionType={s.sectionType}
          contentBlocks={s.contentBlocks}
          questionGroups={s.questionGroups}
          totalItemCount={s.totalItemCount}
          allUsedQuestionIds={s.allUsedQuestionIds}
          activeGroupId={s.activeGroupId}
          addDrawerGroupId={s.addDrawerGroupId}
          collapsedBlocks={s.collapsedBlocks}
          expandedGroups={s.expandedGroups}
          sensors={s.sensors}
          numberingMap={s.numberingMap}
          availableQuestions={s.availableQuestions}
          addContentBlock={s.addContentBlock}
          updateContentBlock={s.updateContentBlock}
          removeContentBlock={s.removeContentBlock}
          addSet={s.addSet}
          removeSet={s.removeSet}
          updateQuestionGroup={s.updateQuestionGroup}
          removeQuestionFromGroup={s.removeQuestionFromGroup}
          setActiveGroupId={s.setActiveGroupId}
          setAddDrawerGroupId={s.setAddDrawerGroupId}
          toggleBlockCollapse={s.toggleBlockCollapse}
          toggleGroupExpand={s.toggleGroupExpand}
          handleItemDragEnd={s.handleItemDragEnd}
          generateGroupTitle={s.generateGroupTitle}
        />
      )}

      {/* Question Add Drawer */}
      <QuestionAddDrawer
        addDrawerGroupId={s.addDrawerGroupId}
        sectionType={s.sectionType}
        isPractice={s.isPractice}
        searchQuery={s.searchQuery}
        setSearchQuery={s.setSearchQuery}
        isLoadingQuestions={s.isLoadingQuestions}
        availableQuestions={s.availableQuestions}
        allUsedQuestionIds={s.allUsedQuestionIds}
        selectedForAdd={s.selectedForAdd}
        setSelectedForAdd={s.setSelectedForAdd}
        expandedQuestionId={s.expandedQuestionId}
        setExpandedQuestionId={s.setExpandedQuestionId}
        onClose={() => s.setAddDrawerGroupId(null)}
        onAddQuestions={() => s.addQuestionsToGroup(s.addDrawerGroupId!)}
        onCreateQuestion={() => s.setShowCreateQuestion(prev => !prev)}
      />

      {/* Preview */}
      <SectionPreview
        open={s.showPreview}
        onOpenChange={s.setShowPreview}
        sectionType={s.sectionType}
        title={s.title}
        timeLimit={s.timeLimit}
        isPractice={s.isPractice}
        instructionTitle={s.instructionTitle}
        instructionHtml={s.instructionHtml}
        instructionAudioUrl={s.instructionAudioUrl}
        contentBlocks={s.previewContentBlocks}
        questionGroups={s.previewQuestionGroupsData}
        questions={s.previewQuestions}
      />

      {/* 문제 생성 모달 */}
      {s.sectionType && (
        <CreateQuestionModal
          open={s.showCreateQuestion}
          onOpenChange={s.setShowCreateQuestion}
          sectionType={s.sectionType}
          onCreated={s.handleQuestionCreated}
        />
      )}
    </div>
  );
}
