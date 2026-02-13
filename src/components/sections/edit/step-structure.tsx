"use client";

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
import { EditGroupCard } from "./edit-group-card";
import type { ContentBlock, NumberedGroup } from "./types";

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
  handleAddGroup: () => void;
  handleUpdateGroup: (id: string, data: Record<string, unknown>) => void;
  handleRemoveGroup: (id: string) => void;
  handleRemoveItem: (itemId: string) => void;
  handleItemDragEnd: (groupId: string) => (event: import("@dnd-kit/core").DragEndEvent) => void;
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
  handleAddContentBlock,
  handleUpdateContentBlockLocal,
  handleRemoveContentBlock,
  handleAddGroup,
  handleUpdateGroup,
  handleRemoveGroup,
  handleRemoveItem,
  handleItemDragEnd,
}: StepStructureProps) {
  return (
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
                    <CardTitle>콘텐츠 블록 ({contentBlocks.length})</CardTitle>
                    <CardDescription>
                      여러 콘텐츠를 추가하여 시험 구조별로 연결합니다.
                    </CardDescription>
                  </div>
                </div>
                <Button size="sm" onClick={handleAddContentBlock}>
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
                      onUpdate={handleUpdateContentBlockLocal}
                      onRemove={handleRemoveContentBlock}
                      sectionId={sectionId}
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
              <Button size="sm" onClick={handleAddGroup}>
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
  );
}
