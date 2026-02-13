"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, FolderPlus, FileText, Headphones, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { useSensors } from "@dnd-kit/core";
import { ContentBlockEditor } from "./content-block-editor";
import { ContentBlockModal } from "./content-block-modal";
import { EditGroupCard } from "./edit-group-card";
import { GroupEditModal } from "./group-edit-modal";
import type { ContentBlock, NumberedGroup, QuestionGroupData } from "./types";

interface StepStructureProps {
  sectionId: string;
  sectionType: string;
  contentBlocks: ContentBlock[];
  numberedGroups: NumberedGroup[];
  totalItemCount: number;
  activeGroupId: string | null;
  addDrawerGroupId: string | null;
  sensors: ReturnType<typeof useSensors>;
  setActiveGroupId: (id: string) => void;
  setAddDrawerGroupId: (id: string | null) => void;
  handleAddContentBlock: () => void;
  handleUpdateContentBlockLocal: (id: string, data: Partial<ContentBlock>) => void;
  handleRemoveContentBlock: (id: string) => void;
  handleSaveContentBlockFromModal: (data: Partial<ContentBlock>, existingId: string | null) => void;
  handleAddGroup: () => void;
  handleUpdateGroup: (id: string, data: Record<string, unknown>) => void;
  handleRemoveGroup: (id: string) => void;
  handleRemoveItem: (itemId: string) => void;
  handleItemDragEnd: (groupId: string) => (event: import("@dnd-kit/core").DragEndEvent) => void;
  handleSaveGroupFromModal: (
    data: { title: string | null; instructions: string | null; content_block_id: string | null },
    existingId: string | null
  ) => void;
}

export function StepStructure({
  sectionId,
  sectionType,
  contentBlocks,
  numberedGroups,
  totalItemCount,
  activeGroupId,
  addDrawerGroupId,
  sensors,
  setActiveGroupId,
  setAddDrawerGroupId,
  handleAddContentBlock: _handleAddContentBlock,
  handleUpdateContentBlockLocal,
  handleRemoveContentBlock,
  handleSaveContentBlockFromModal,
  handleAddGroup: _handleAddGroup,
  handleUpdateGroup,
  handleRemoveGroup,
  handleRemoveItem,
  handleItemDragEnd,
  handleSaveGroupFromModal,
}: StepStructureProps) {
  // ─── Content Block Modal state ──────────────────────────────
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  const handleOpenNewBlockModal = () => {
    setEditingBlock(null);
    setIsBlockModalOpen(true);
  };

  const handleEditBlock = (block: ContentBlock) => {
    setEditingBlock(block);
    setIsBlockModalOpen(true);
  };

  // ─── Group Modal state ──────────────────────────────────────
  const [editingGroup, setEditingGroup] = useState<QuestionGroupData | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  /** "섹션 추가" → open modal with no group (create mode) */
  const handleOpenNewGroupModal = () => {
    setEditingGroup(null);
    setIsGroupModalOpen(true);
  };

  /** Edit existing group → open modal with group data */
  const handleEditGroup = (group: NumberedGroup) => {
    setEditingGroup(group);
    setIsGroupModalOpen(true);
  };

  return (
    <>
      <div className={cn("grid gap-6", (sectionType === "reading" || sectionType === "listening") ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1")}>
        {/* ─── Left Column: Content Blocks (reading/listening only) ─── */}
        {(sectionType === "reading" || sectionType === "listening") && (
          <div className="space-y-6">
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
                      <CardTitle>
                        {sectionType === "listening" ? "오디오/지문 관리" : "지문 관리"} ({contentBlocks.length})
                      </CardTitle>
                      <CardDescription>
                        {sectionType === "listening"
                          ? "시험 문제와 함께 재생되는 오디오 및 지문을 추가합니다. 각 오디오/지문은 시험 구조(섹션)에 연결됩니다."
                          : "시험 문제와 함께 표시되는 지문을 추가합니다. 각 지문은 시험 구조(섹션)에 연결됩니다."}
                      </CardDescription>
                    </div>
                  </div>
                  <Button size="sm" onClick={handleOpenNewBlockModal}>
                    <Plus className="mr-1 h-4 w-4" />
                    {sectionType === "reading" ? "지문 추가" : "오디오 추가"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {contentBlocks.length > 0 ? (
                  <div className="space-y-2">
                    {contentBlocks.map((block, idx) => (
                      <ContentBlockEditor
                        key={block.id}
                        block={block}
                        index={idx}
                        onEdit={handleEditBlock}
                        onRemove={handleRemoveContentBlock}
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
                      ({numberedGroups.length}그룹, {totalItemCount}문항)
                    </span>
                  </CardTitle>
                  <CardDescription>
                    섹션과 문제를 구성합니다.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={handleOpenNewGroupModal}>
                  <FolderPlus className="mr-1 h-4 w-4" />
                  섹션 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {numberedGroups.length > 0 ? (
                <div className="space-y-3">
                  {numberedGroups.map((group) => {
                    const isActive = activeGroupId === group.id;
                    const autoTitle = (() => {
                      if (group.numberedItems.length === 0) return "Empty Group";
                      const ranges: string[] = [];
                      let totalNums = 0;
                      for (const item of group.numberedItems) {
                        totalNums += item.endNum - item.startNum + 1;
                        ranges.push(
                          item.startNum === item.endNum
                            ? `${item.startNum}`
                            : `${item.startNum}–${item.endNum}`
                        );
                      }
                      const prefix = totalNums === 1 ? "Question" : "Questions";
                      if (ranges.length === 1) return `${prefix} ${ranges[0]}`;
                      if (ranges.length === 2) return `${prefix} ${ranges[0]} and ${ranges[1]}`;
                      const last = ranges.pop()!;
                      return `${prefix} ${ranges.join(", ")} and ${last}`;
                    })();

                    return (
                      <EditGroupCard
                        key={group.id}
                        group={group}
                        isActive={isActive}
                        isAddingQuestions={addDrawerGroupId === group.id}
                        autoTitle={autoTitle}
                        contentBlocks={contentBlocks}
                        sectionType={sectionType}
                        sensors={sensors}
                        onActivate={() => setActiveGroupId(group.id)}
                        onUpdate={handleUpdateGroup}
                        onRemove={handleRemoveGroup}
                        onRemoveItem={handleRemoveItem}
                        onItemDragEnd={handleItemDragEnd(group.id)}
                        onAddQuestions={() => {
                          setAddDrawerGroupId(addDrawerGroupId === group.id ? null : group.id);
                          setActiveGroupId(group.id);
                        }}
                        onEditGroup={() => handleEditGroup(group)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ArrowUpDown className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">아직 시험 구조가 없습니다.</p>
                  <p className="text-xs mt-1">
                    &quot;섹션 추가&quot; 버튼을 클릭하세요.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Block Edit Modal */}
      <ContentBlockModal
        open={isBlockModalOpen}
        onOpenChange={setIsBlockModalOpen}
        block={editingBlock}
        sectionType={sectionType}
        sectionId={sectionId}
        onSave={(data, existingId) => handleSaveContentBlockFromModal(data, existingId)}
      />

      {/* Group Edit Modal */}
      <GroupEditModal
        open={isGroupModalOpen}
        onOpenChange={setIsGroupModalOpen}
        group={editingGroup}
        sectionType={sectionType}
        contentBlocks={contentBlocks}
        items={numberedGroups.find(g => g.id === editingGroup?.id)?.numberedItems}
        onSave={(data, existingId) => handleSaveGroupFromModal(data, existingId)}
      />
    </>
  );
}
