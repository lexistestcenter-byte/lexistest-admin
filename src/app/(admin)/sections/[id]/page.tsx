"use client";

import { use } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { SectionPreview } from "@/components/sections/section-preview";
import { CreateQuestionModal } from "@/components/sections/create-question-modal";
import { useSectionEdit } from "@/components/sections/edit/hooks/use-section-edit";
import { StepIndicator } from "@/components/sections/edit/step-indicator";
import { StepNav } from "@/components/sections/edit/step-nav";
import { StepBasicInfo } from "@/components/sections/edit/step-basic-info";
import { StepStructure } from "@/components/sections/edit/step-structure";
import { QuestionAddDrawer } from "@/components/sections/edit/question-add-drawer";

export default function SectionEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const s = useSectionEdit(id);

  // ─── Loading state ─────────────────────────────────────────

  if (s.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!s.section) return null;

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="시험 편집"
        description={s.section.title}
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
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={s.confirmDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              삭제
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
          sectionType={s.section.section_type}
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
          sectionId={id}
          sectionType={s.section.section_type}
          contentBlocks={s.contentBlocks}
          numberedGroups={s.numberedGroups}
          totalItemCount={s.totalItemCount}
          activeGroupId={s.activeGroupId}
          addDrawerGroupId={s.addDrawerGroupId}
          sensors={s.sensors}
          setActiveGroupId={s.setActiveGroupId}
          setAddDrawerGroupId={s.setAddDrawerGroupId}
          handleAddContentBlock={s.handleAddContentBlock}
          handleRemoveContentBlock={s.handleRemoveContentBlock}
          handleSaveContentBlockFromModal={s.handleSaveContentBlockFromModal}
          handleAddGroup={s.handleAddGroup}
          handleUpdateGroup={s.handleUpdateGroup}
          handleRemoveGroup={s.handleRemoveGroup}
          handleRemoveItem={s.handleRemoveItem}
          handleItemDragEnd={s.handleItemDragEnd}
          handleSaveGroupFromModal={s.handleSaveGroupFromModal}
        />
      )}

      {/* Question Add Drawer */}
      <QuestionAddDrawer
        addDrawerGroupId={s.addDrawerGroupId}
        sectionType={s.section.section_type}
        isPractice={s.isPractice}
        searchQuery={s.searchQuery}
        setSearchQuery={s.setSearchQuery}
        isLoadingQuestions={s.isLoadingQuestions}
        availableQuestions={s.availableQuestions}
        selectedForAdd={s.selectedForAdd}
        setSelectedForAdd={s.setSelectedForAdd}
        expandedQuestionId={s.expandedQuestionId}
        setExpandedQuestionId={s.setExpandedQuestionId}
        onClose={() => s.setAddDrawerGroupId(null)}
        onAddQuestions={s.handleAddQuestionsToGroup}
        onCreateQuestion={() => s.setShowCreateQuestion(prev => !prev)}
      />

      {/* Preview */}
      <SectionPreview
        open={s.showPreview}
        onOpenChange={s.setShowPreview}
        sectionType={s.section.section_type}
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
      <CreateQuestionModal
        open={s.showCreateQuestion}
        onOpenChange={s.setShowCreateQuestion}
        sectionType={s.section.section_type}
        onCreated={s.handleQuestionCreated}
      />
    </div>
  );
}
