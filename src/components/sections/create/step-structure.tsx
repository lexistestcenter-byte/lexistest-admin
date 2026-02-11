"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderPlus, FileText, Headphones, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import type { useSensors, DragEndEvent } from "@dnd-kit/core";
import { typeColors } from "@/components/sections/constants";
import { ContentBlockEditor } from "./content-block-editor";
import { GroupCard } from "./group-card";
import type { ContentBlock, QuestionGroup, Question } from "./types";

interface StepStructureProps {
  sectionType: string;
  contentBlocks: ContentBlock[];
  questionGroups: QuestionGroup[];
  totalItemCount: number;
  allUsedQuestionIds: Set<string>;
  activeGroupId: string | null;
  addDrawerGroupId: string | null;
  collapsedBlocks: Set<string>;
  expandedGroups: Set<string>;
  sensors: ReturnType<typeof useSensors>;
  numberingMap: Record<string, { startNum: number; endNum: number; label: string }>;
  availableQuestions: Question[];
  addContentBlock: () => void;
  updateContentBlock: (id: string, data: Partial<ContentBlock>) => void;
  removeContentBlock: (id: string) => void;
  addSet: () => void;
  removeSet: (groupId: string) => void;
  updateQuestionGroup: (id: string, data: Partial<QuestionGroup>) => void;
  removeQuestionFromGroup: (groupId: string, questionId: string) => void;
  setActiveGroupId: (id: string) => void;
  setAddDrawerGroupId: (id: string | null) => void;
  toggleBlockCollapse: (blockId: string) => void;
  toggleGroupExpand: (groupId: string) => void;
  handleItemDragEnd: (groupId: string) => (event: DragEndEvent) => void;
  generateGroupTitle: (group: QuestionGroup) => string;
}

export function StepStructure({
  sectionType,
  contentBlocks,
  questionGroups,
  totalItemCount,
  allUsedQuestionIds,
  activeGroupId,
  addDrawerGroupId,
  collapsedBlocks,
  expandedGroups,
  sensors,
  numberingMap,
  availableQuestions,
  addContentBlock,
  updateContentBlock,
  removeContentBlock,
  addSet,
  removeSet,
  updateQuestionGroup,
  removeQuestionFromGroup,
  setActiveGroupId,
  setAddDrawerGroupId,
  toggleBlockCollapse,
  toggleGroupExpand,
  handleItemDragEnd,
  generateGroupTitle,
}: StepStructureProps) {
  const needsContent = sectionType === "reading" || sectionType === "listening";

  return (
    <div className="space-y-4">
      <div className={cn("grid gap-6", needsContent ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1")}>
        {/* ─── Left Column: Content Blocks (reading/listening only) ─── */}
        {needsContent && (
          <div className="space-y-6">
            {needsContent && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {sectionType === "reading" ? (
                        <FileText className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Headphones className="h-5 w-5 text-sky-500" />
                      )}
                      <div>
                        <CardTitle>콘텐츠 블록 ({contentBlocks.length})</CardTitle>
                        <CardDescription>
                          여러 콘텐츠를 추가하여 시험 구조별로 연결합니다.
                        </CardDescription>
                      </div>
                    </div>
                    <Button size="sm" onClick={addContentBlock}>
                      <Plus className="mr-1 h-4 w-4" />
                      {sectionType === "reading" ? "지문 추가" : "오디오 추가"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {contentBlocks.length > 0 ? (
                    <div className="space-y-3">
                      {contentBlocks.map((block, idx) => (
                        <ContentBlockEditor
                          key={block.id}
                          block={block}
                          index={idx}
                          isCollapsed={collapsedBlocks.has(block.id)}
                          onToggleCollapse={() => toggleBlockCollapse(block.id)}
                          onUpdate={updateContentBlock}
                          onRemove={removeContentBlock}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      콘텐츠 블록이 없습니다.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ─── Right Column: Question Groups ─── */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    시험 구조{" "}
                    <span className="text-muted-foreground font-normal text-sm">
                      ({questionGroups.length}그룹, {totalItemCount}문항)
                    </span>
                  </CardTitle>
                  <CardDescription>
                    섹션과 문제를 구성합니다.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={addSet}>
                  <FolderPlus className="mr-1 h-4 w-4" />
                  섹션 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {questionGroups.length > 0 ? (
                <div className="space-y-3">
                  {questionGroups.map((group, idx) => {
                    const isActive = activeGroupId === group.id;
                    const isExpanded = expandedGroups.has(group.id);
                    const autoTitle = generateGroupTitle(group);

                    return (
                      <GroupCard
                        key={group.id}
                        group={group}
                        index={idx}
                        isActive={isActive}
                        isExpanded={isExpanded}
                        isAddingQuestions={addDrawerGroupId === group.id}
                        autoTitle={autoTitle}
                        contentBlocks={contentBlocks}
                        needsContent={needsContent}
                        numberingMap={numberingMap}
                        availableQuestions={availableQuestions}
                        sensors={sensors}
                        groupCount={questionGroups.length}
                        onActivate={() => setActiveGroupId(group.id)}
                        onToggleExpand={() => toggleGroupExpand(group.id)}
                        onUpdate={updateQuestionGroup}
                        onRemoveSet={removeSet}
                        onAddDrawer={() => {
                          setAddDrawerGroupId(addDrawerGroupId === group.id ? null : group.id);
                          setActiveGroupId(group.id);
                        }}
                        onItemDragEnd={handleItemDragEnd(group.id)}
                        onRemoveQuestion={removeQuestionFromGroup}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FolderPlus className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">섹션이 없습니다.</p>
                  <Button size="sm" onClick={addSet} className="mt-3">
                    <Plus className="mr-1 h-4 w-4" />
                    첫 번째 섹션 추가
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            생성 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">시험 유형</p>
              {sectionType ? (
                <Badge className={typeColors[sectionType] || "bg-gray-100"}>
                  {sectionType.charAt(0).toUpperCase() + sectionType.slice(1)}
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">섹션 수</p>
              <p className="text-sm font-medium">{questionGroups.length}개</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">총 문제 수</p>
              <p className="text-sm font-medium">
                {allUsedQuestionIds.size}개
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">총 문항 수</p>
              <p className="text-sm font-medium">{totalItemCount}개</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
