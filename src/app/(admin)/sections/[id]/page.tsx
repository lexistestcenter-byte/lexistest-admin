"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Table import removed - using list view instead
import {
  Save,
  ArrowLeft,
  ArrowRight,
  Search,
  Loader2,
  Trash2,
  GripVertical,
  Plus,
  ChevronDown,
  ChevronRight,
  Eye,
  Check,
  FolderPlus,
  FileText,
  Headphones,
  ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SectionPreview, type PreviewQuestion } from "../new/section-preview";
import { FileUpload } from "@/components/ui/file-upload";
import { formatLabels } from "@/components/sections/constants";
import { QuestionDetailPreview } from "@/components/sections/question-detail-preview";
import { stripHtml } from "@/lib/utils/sanitize";

const TOTAL_STEPS = 2;
const STEP_LABELS = ["기본 정보", "섹션 구성"];

// ─── Types ─────────────────────────────────────────────────────

interface SectionData {
  id: string;
  section_type: string;
  title: string;
  description: string | null;
  image_url: string | null;
  instruction_title: string | null;
  instruction_html: string | null;
  passage_title: string | null;
  passage_content: string | null;
  passage_footnotes: string | null;
  audio_url: string | null;
  audio_duration_seconds: number | null;
  audio_transcript: string | null;
  time_limit_minutes: number | null;
  difficulty: string | null;
  is_practice: boolean;
  is_active: boolean;
  tags: string[] | null;
}

interface ContentBlock {
  id: string;
  section_id: string;
  display_order: number;
  content_type: "passage" | "audio";
  passage_title: string | null;
  passage_content: string | null;
  passage_footnotes: string | null;
  audio_url: string | null;
  audio_duration_seconds: number | null;
  audio_transcript: string | null;
}

interface QuestionInfo {
  question_code: string;
  question_type: string;
  question_format: string;
  content: string;
  title: string | null;
  instructions: string | null;
  item_count: number;
  options_data: Record<string, unknown> | null;
  answer_data: Record<string, unknown> | null;
}

interface GroupItem {
  item_id: string;
  question_id: string;
  question_number_start: number;
  display_order: number;
  question_info: QuestionInfo;
}

interface QuestionGroupData {
  id: string;
  section_id: string;
  content_block_id: string | null;
  display_order: number;
  title: string | null;
  instructions: string | null;
  question_number_start: number;
  items: GroupItem[];
}

interface AvailableQuestion {
  id: string;
  question_code: string;
  question_type: string;
  question_format: string;
  content: string;
  title: string | null;
  instructions: string | null;
  difficulty: string | null;
  is_active: boolean;
  item_count: number;
  options_data: Record<string, unknown> | null;
  answer_data: Record<string, unknown> | null;
}

// ─── Sortable Group Item ───────────────────────────────────────

function SortableGroupItemRow({
  item,
  numberLabel,
  onRemove,
}: {
  item: GroupItem;
  numberLabel: string;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.item_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const info = item.question_info;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "bg-muted/50 rounded",
        isDragging && "shadow-lg"
      )}
    >
      <div className="flex items-center gap-2 p-2">
        <div {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <span className="text-xs font-mono font-semibold text-primary min-w-[50px]">
          {numberLabel}
        </span>
        <span className="text-xs text-muted-foreground font-mono">
          {info.question_code}
        </span>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {formatLabels[info.question_format] || info.question_format}
        </Badge>
        <span className="flex-1 text-xs text-muted-foreground">
          {stripHtml(info.title || info.content)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setExpanded(!expanded)}
        >
          <Eye className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      {expanded && info.options_data !== undefined && (
        <div className="px-2 pb-2">
          <QuestionDetailPreview
            question={{
              question_format: info.question_format,
              content: info.content,
              instructions: info.instructions,
              options_data: info.options_data,
              answer_data: info.answer_data,
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────

export default function SectionEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<PreviewQuestion[]>([]);

  // Section data
  const [section, setSection] = useState<SectionData | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");

  // Instruction page
  const [instructionTitle, setInstructionTitle] = useState("");
  const [instructionHtml, setInstructionHtml] = useState("");

  // Content blocks
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

  // Question groups
  const [questionGroups, setQuestionGroups] = useState<QuestionGroupData[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  // Available questions
  const [availableQuestions, setAvailableQuestions] = useState<AvailableQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [selectedForAdd, setSelectedForAdd] = useState<string[]>([]);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ─── Load section data ─────────────────────────────────────

  useEffect(() => {
    const loadSection = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await api.get<SectionData>(`/api/sections/${id}`);
        if (error) {
          if (error.includes("404") || error.includes("not found")) {
            toast.error("섹션을 찾을 수 없습니다.");
            router.push("/sections");
            return;
          }
          throw new Error(error);
        }

        if (!data) throw new Error("섹션 데이터가 없습니다.");
        setSection(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setTimeLimit(data.time_limit_minutes?.toString() || "");
        setInstructionTitle(data.instruction_title || "");
        setInstructionHtml(data.instruction_html || "");
      } catch (error) {
        console.error("Error loading section:", error);
        toast.error("섹션 정보를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadSection();
  }, [id, router]);

  // ─── Load structure (blocks + groups) ──────────────────────

  const loadStructure = useCallback(async () => {
    try {
      const { data, error } = await api.get<{ content_blocks: ContentBlock[]; question_groups: QuestionGroupData[] }>(`/api/sections/${id}/structure`);
      if (error) throw new Error(error);
      setContentBlocks(data!.content_blocks || []);
      setQuestionGroups(data!.question_groups || []);
      if (data!.question_groups?.length > 0) {
        setActiveGroupId(data!.question_groups[0].id);
      }
    } catch (error) {
      console.error("Error loading structure:", error);
    }
  }, [id]);

  useEffect(() => {
    if (!isLoading) {
      loadStructure();
    }
  }, [isLoading, loadStructure]);

  // ─── Load available questions ──────────────────────────────

  const loadAvailableQuestions = useCallback(async () => {
    if (!section) return;

    setIsLoadingQuestions(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      params.set("limit", "100");

      const { data, error } = await api.get<AvailableQuestion[]>(
        `/api/sections/${id}/available-questions?${params.toString()}`
      );
      if (error) throw new Error(error);
      setAvailableQuestions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading available questions:", error);
      toast.error("문제 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [id, section, searchQuery]);

  useEffect(() => {
    if (showAddPanel && section) {
      const timer = setTimeout(() => loadAvailableQuestions(), 300);
      return () => clearTimeout(timer);
    }
  }, [showAddPanel, section, loadAvailableQuestions, searchQuery]);

  // ─── All used question IDs ─────────────────────────────────

  const allUsedQuestionIds = new Set(
    questionGroups.flatMap((g) => g.items.map((item) => item.question_id))
  );

  // ─── Auto-numbering ────────────────────────────────────────

  const numberedGroups = (() => {
    let currentNum = 1;
    return questionGroups.map((group) => {
      const groupStartNum = currentNum;
      const numberedItems = group.items.map((item) => {
        const startNum = currentNum;
        const itemCount = item.question_info.item_count || 1;
        const endNum = startNum + itemCount - 1;
        currentNum += itemCount;
        return { ...item, startNum, endNum };
      });
      return {
        ...group,
        numberedItems,
        groupStartNum,
        groupEndNum: currentNum - 1,
      };
    });
  })();

  const totalItemCount = numberedGroups.length > 0
    ? numberedGroups[numberedGroups.length - 1].groupEndNum
    : 0;

  // ─── Content Block CRUD ────────────────────────────────────

  const handleAddContentBlock = async () => {
    if (!section) return;
    const contentType = section.section_type === "listening" ? "audio" : "passage";
    try {
      const { error } = await api.post(`/api/sections/${id}/content-blocks`, {
        display_order: contentBlocks.length,
        content_type: contentType,
      });
      if (error) throw new Error(error);
      toast.success("콘텐츠 블록이 추가되었습니다.");
      await loadStructure();
    } catch (error) {
      console.error("Error adding content block:", error);
      toast.error("콘텐츠 블록 추가에 실패했습니다.");
    }
  };

  const handleUpdateContentBlock = async (
    blockId: string,
    data: Partial<ContentBlock>
  ) => {
    try {
      const block = contentBlocks.find((b) => b.id === blockId);
      if (!block) return;

      const { error } = await api.post(`/api/sections/${id}/content-blocks`, {
        block_id: blockId,
        display_order: data.display_order ?? block.display_order,
        content_type: data.content_type ?? block.content_type,
        passage_title: data.passage_title ?? block.passage_title,
        passage_content: data.passage_content ?? block.passage_content,
        passage_footnotes: data.passage_footnotes ?? block.passage_footnotes,
        audio_url: data.audio_url ?? block.audio_url,
        audio_transcript: data.audio_transcript ?? block.audio_transcript,
      });
      if (error) throw new Error(error);
    } catch (error) {
      console.error("Error updating content block:", error);
      toast.error("콘텐츠 블록 저장에 실패했습니다.");
    }
  };

  const handleRemoveContentBlock = async (blockId: string) => {
    try {
      const { error } = await api.delete(
        `/api/sections/${id}/content-blocks?block_id=${blockId}`
      );
      if (error) throw new Error(error);
      toast.success("콘텐츠 블록이 삭제되었습니다.");
      await loadStructure();
    } catch (error) {
      console.error("Error removing content block:", error);
      toast.error("콘텐츠 블록 삭제에 실패했습니다.");
    }
  };

  // ─── Question Group CRUD ───────────────────────────────────

  const handleAddGroup = async () => {
    try {
      const { error } = await api.post(`/api/sections/${id}/groups`, {
        display_order: questionGroups.length,
        content_block_id: contentBlocks.length > 0 ? contentBlocks[0].id : null,
        question_number_start: totalItemCount + 1,
      });
      if (error) throw new Error(error);
      toast.success("문제 그룹이 추가되었습니다.");
      await loadStructure();
    } catch (error) {
      console.error("Error adding group:", error);
      toast.error("그룹 추가에 실패했습니다.");
    }
  };

  const handleUpdateGroup = async (
    groupId: string,
    data: Record<string, unknown>
  ) => {
    try {
      const { error } = await api.put(`/api/sections/${id}/groups/${groupId}`, data);
      if (error) throw new Error(error);
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error("그룹 정보 저장에 실패했습니다.");
    }
  };

  const handleRemoveGroup = async (groupId: string) => {
    try {
      const { error } = await api.delete(`/api/sections/${id}/groups/${groupId}`);
      if (error) throw new Error(error);
      toast.success("문제 그룹이 삭제되었습니다.");
      await loadStructure();
      if (showAddPanel) loadAvailableQuestions();
    } catch (error) {
      console.error("Error removing group:", error);
      toast.error("그룹 삭제에 실패했습니다.");
    }
  };

  // ─── Add questions to group ────────────────────────────────

  const handleAddQuestionsToGroup = async () => {
    if (!activeGroupId || selectedForAdd.length === 0) return;

    try {
      let currentNum = totalItemCount + 1;
      const group = questionGroups.find((g) => g.id === activeGroupId);
      const currentOrder = group?.items.length || 0;

      for (let i = 0; i < selectedForAdd.length; i++) {
        const qId = selectedForAdd[i];
        const q = availableQuestions.find((aq) => aq.id === qId);
        const itemCount = q?.item_count || 1;

        const { error } = await api.post(`/api/sections/${id}/groups/${activeGroupId}/items`, {
          question_id: qId,
          question_number_start: currentNum,
          display_order: currentOrder + i,
        });
        if (error) throw new Error(error);

        currentNum += itemCount;
      }

      toast.success(`${selectedForAdd.length}개 문제가 추가되었습니다.`);
      setSelectedForAdd([]);
      await loadStructure();
      if (showAddPanel) loadAvailableQuestions();
    } catch (error) {
      console.error("Error adding questions:", error);
      toast.error("문제 추가에 실패했습니다.");
    }
  };

  // ─── Remove item from group ────────────────────────────────

  const handleRemoveItem = async (itemId: string) => {
    try {
      const { error } = await api.delete(`/api/sections/${id}/items?item_id=${itemId}`);
      if (error) throw new Error(error);
      toast.success("문제가 제거되었습니다.");
      await loadStructure();
      if (showAddPanel) loadAvailableQuestions();
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("문제 제거에 실패했습니다.");
    }
  };

  // ─── Reorder items within a group (DnD) ────────────────────

  const handleItemDragEnd = (groupId: string) => async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const group = questionGroups.find((g) => g.id === groupId);
    if (!group) return;

    const oldIndex = group.items.findIndex((i) => i.item_id === String(active.id));
    const newIndex = group.items.findIndex((i) => i.item_id === String(over.id));

    const reordered = arrayMove(group.items, oldIndex, newIndex);

    // Optimistic update
    setQuestionGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, items: reordered.map((item, i) => ({ ...item, display_order: i })) }
          : g
      )
    );

    // Build reorder payload for all groups
    try {
      const groupsPayload = questionGroups.map((g) => {
        const items =
          g.id === groupId
            ? reordered.map((item, i) => ({
                item_id: item.item_id,
                display_order: i,
                question_number_start: item.question_number_start,
              }))
            : g.items.map((item) => ({
                item_id: item.item_id,
                display_order: item.display_order,
                question_number_start: item.question_number_start,
              }));
        return {
          group_id: g.id,
          display_order: g.display_order,
          question_number_start: g.question_number_start,
          items,
        };
      });

      const { error } = await api.put(`/api/sections/${id}/groups`, { groups: groupsPayload });
      if (error) throw new Error(error);
    } catch (error) {
      console.error("Error reordering:", error);
      toast.error("순서 변경에 실패했습니다.");
      await loadStructure();
    }
  };

  // ─── Save ──────────────────────────────────────────────────

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("섹션명은 필수입니다.");
      return;
    }

    // 최소 1세트에 1개 이상의 문제가 있어야 저장 가능
    const hasValidGroup = questionGroups.some((g) => g.items.length > 0);
    if (!hasValidGroup) {
      toast.error("최소 1개 세트에 문제가 1개 이상 추가되어야 저장할 수 있습니다.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Update section info
      const updateData: Record<string, unknown> = {
        title,
        description: description || null,
        time_limit_minutes: timeLimit ? parseInt(timeLimit) : null,
        instruction_title: instructionTitle || null,
        instruction_html: instructionHtml || null,
      };

      const { error } = await api.put(`/api/sections/${id}`, updateData);
      if (error) throw new Error(error);

      // 2. Save content blocks
      for (let i = 0; i < contentBlocks.length; i++) {
        await handleUpdateContentBlock(contentBlocks[i].id, {
          ...contentBlocks[i],
          display_order: i,
        });
      }

      // 3. Save group ordering + item numbering
      let currentNumber = 1;
      const groupsPayload = questionGroups.map((group, gi) => {
        const groupStart = currentNumber;
        const items = group.items.map((item, qi) => {
          const startNum = currentNumber;
          currentNumber += item.question_info.item_count || 1;
          return {
            item_id: item.item_id,
            display_order: qi,
            question_number_start: startNum,
          };
        });
        return {
          group_id: group.id,
          display_order: gi,
          question_number_start: groupStart,
          items,
        };
      });

      if (groupsPayload.length > 0) {
        const { error: groupError } = await api.put(`/api/sections/${id}/groups`, { groups: groupsPayload });
        if (groupError) throw new Error(groupError);
      }

      toast.success("섹션이 저장되었습니다.");
    } catch (error) {
      console.error("Error saving section:", error);
      toast.error(
        error instanceof Error ? error.message : "저장에 실패했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Delete ────────────────────────────────────────────────

  const confirmDelete = () => {
    toast.warning(`"${title}" 섹션을 삭제하시겠습니까?`, {
      description: "이 섹션에 연결된 문제는 삭제되지 않습니다.",
      actionButtonStyle: { backgroundColor: "hsl(0 84% 60%)", color: "white" },
      action: {
        label: "삭제",
        onClick: async () => {
          try {
            const { error } = await api.delete(`/api/sections/${id}`);
            if (error) throw new Error(error);
            toast.success("섹션이 삭제되었습니다.");
            router.push("/sections");
          } catch (error) {
            console.error("Error deleting section:", error);
            toast.error("삭제에 실패했습니다.");
          }
        },
      },
      cancel: {
        label: "취소",
        onClick: () => {},
      },
    });
  };

  // ─── Step Navigation ─────────────────────────────────────────

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!title.trim()) {
        toast.error("섹션명을 입력해주세요.");
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep))
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const renderStepIndicator = () => (
    <div>
      <div className="flex items-center justify-center gap-0">
        {STEP_LABELS.map((label, idx) => {
          const step = idx + 1;
          const isCompleted = currentStep > step;
          const isCurrent = currentStep === step;
          return (
            <div key={step} className="flex items-center">
              {idx > 0 && (
                <div
                  className={cn(
                    "h-px w-12 sm:w-20",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                />
              )}
              <button
                type="button"
                onClick={() => {
                  if (step === currentStep) return;
                  if (step < currentStep) {
                    setCurrentStep(step);
                  } else if (validateStep(currentStep)) {
                    setCurrentStep(step);
                  }
                }}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  isCurrent && "bg-primary text-primary-foreground",
                  isCompleted &&
                    "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20",
                  !isCurrent &&
                    !isCompleted &&
                    "text-muted-foreground cursor-pointer hover:text-foreground/70"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                    isCurrent && "bg-primary-foreground text-primary",
                    isCompleted && "bg-primary text-primary-foreground",
                    !isCurrent &&
                      !isCompleted &&
                      "bg-muted-foreground/20 text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : step}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStepNav = () => (
    <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
      <Button
        variant="outline"
        onClick={handlePrev}
        disabled={currentStep === 1}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        이전
      </Button>

      <div className="text-sm text-muted-foreground font-medium">
        {currentStep} / {TOTAL_STEPS}
      </div>

      {currentStep < TOTAL_STEPS ? (
        <Button onClick={handleNext}>
          다음
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ) : (
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
      )}
    </div>
  );

  // ─── Preview ───────────────────────────────────────────────

  const openPreview = async () => {
    const allQuestionIds = questionGroups.flatMap((g) =>
      g.items.map((i) => i.question_id)
    );
    if (allQuestionIds.length === 0) {
      setShowPreview(true);
      return;
    }
    setIsLoadingPreview(true);
    try {
      const uniqueIds = [...new Set(allQuestionIds)];
      const details = await Promise.all(
        uniqueIds.map(async (qId) => {
          const { data, error } = await api.get<{ question: PreviewQuestion }>(`/api/questions/${qId}`);
          if (error) throw new Error(`Failed to fetch question ${qId}`);
          return data!.question;
        })
      );
      const detailMap = new Map(details.map((d) => [d.id, d]));
      setPreviewQuestions(
        allQuestionIds
          .map((qId) => detailMap.get(qId))
          .filter((q): q is PreviewQuestion => q !== undefined)
      );
      setShowPreview(true);
    } catch (error) {
      console.error("Error loading preview:", error);
      toast.error("미리보기 데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // ─── Loading state ─────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!section) return null;

  // ─── Build preview props ───────────────────────────────────

  const previewContentBlocks = contentBlocks.map((b) => ({
    id: b.id,
    content_type: b.content_type,
    passage_title: b.passage_title || undefined,
    passage_content: b.passage_content || undefined,
    passage_footnotes: b.passage_footnotes || undefined,
    audio_url: b.audio_url || undefined,
    audio_transcript: b.audio_transcript || undefined,
  }));

  const previewQuestionGroupsData = numberedGroups.map((g) => ({
    id: g.id,
    title: g.title || "",
    instructions: g.instructions,
    contentBlockId: g.content_block_id,
    startNum: g.groupStartNum,
    endNum: g.groupEndNum,
    questionIds: g.items.map((i) => i.question_id),
  }));

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="섹션 편집"
        description={section.title}
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
              onClick={openPreview}
              disabled={isLoadingPreview}
            >
              {isLoadingPreview ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              미리보기
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={confirmDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              삭제
            </Button>
          </div>
        }
      />

      {renderStepIndicator()}
      {renderStepNav()}

      {/* ─── Step 1: 기본 정보 ─── */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>
                {section.section_type.charAt(0).toUpperCase() +
                  section.section_type.slice(1)}{" "}
                섹션
                {section.is_practice && (
                  <Badge variant="outline" className="ml-2">
                    연습용
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>섹션명 <span className="text-red-500">*</span></Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: Reading Passage 1"
                />
              </div>
              <div className="space-y-2">
                <Label>설명</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="섹션 설명..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>제한 시간 (분)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="예: 20"
                  maxLength={3}
                  value={timeLimit}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^[1-9]\d{0,2}$/.test(v)) {
                      setTimeLimit(v);
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Instruction Page */}
          <Card>
            <CardHeader>
              <CardTitle>안내 페이지</CardTitle>
              <CardDescription>
                섹션 시작 전 표시될 안내 내용입니다. (선택)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>안내 제목</Label>
                <Input
                  value={instructionTitle}
                  onChange={(e) => setInstructionTitle(e.target.value)}
                  placeholder="예: Reading Test Instructions"
                />
              </div>
              <div className="space-y-2">
                <Label>안내 내용</Label>
                <Textarea
                  value={instructionHtml}
                  onChange={(e) => setInstructionHtml(e.target.value)}
                  placeholder="시험 안내 내용..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Step 2: 섹션 구성 ─── */}
      {currentStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ─── Left Column: Content Blocks ─── */}
          <div className="space-y-6">
            {/* Content Blocks */}
            {(section.section_type === "reading" ||
              section.section_type === "listening") && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {section.section_type === "reading" ? (
                        <FileText className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Headphones className="h-5 w-5 text-sky-500" />
                    )}
                    <div>
                      <CardTitle>콘텐츠 블록 ({contentBlocks.length})</CardTitle>
                      <CardDescription>
                        여러 콘텐츠를 추가하여 문제 그룹별로 연결합니다.
                      </CardDescription>
                    </div>
                  </div>
                  <Button size="sm" onClick={handleAddContentBlock}>
                    <Plus className="mr-1 h-4 w-4" />
                    {section.section_type === "reading" ? "지문 추가" : "오디오 추가"}
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
                        onUpdate={handleUpdateContentBlock}
                        onRemove={handleRemoveContentBlock}
                        sectionId={id}
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

          {/* ─── Right Column: Question Groups ─── */}
        <div className="space-y-6">
          {/* Question Groups */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    문제 그룹{" "}
                    <span className="text-muted-foreground font-normal text-sm">
                      ({questionGroups.length}그룹, {totalItemCount}문항)
                    </span>
                  </CardTitle>
                  <CardDescription>
                    그룹별로 문제를 구성합니다.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={showAddPanel ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setShowAddPanel(!showAddPanel)}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    {showAddPanel ? "닫기" : "문제 추가"}
                  </Button>
                  <Button size="sm" onClick={handleAddGroup}>
                    <FolderPlus className="mr-1 h-4 w-4" />
                    그룹 추가
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {numberedGroups.length > 0 ? (
                <div className="space-y-3">
                  {numberedGroups.map((group) => {
                    const isActive = activeGroupId === group.id;
                    const autoTitle =
                      group.groupEndNum >= group.groupStartNum
                        ? group.groupStartNum === group.groupEndNum
                          ? `Question ${group.groupStartNum}`
                          : `Questions ${group.groupStartNum}–${group.groupEndNum}`
                        : "Empty Group";

                    return (
                      <EditGroupCard
                        key={group.id}
                        group={group}
                        isActive={isActive}
                        autoTitle={autoTitle}
                        contentBlocks={contentBlocks}
                        sensors={sensors}
                        onActivate={() => setActiveGroupId(group.id)}
                        onUpdate={handleUpdateGroup}
                        onRemove={handleRemoveGroup}
                        onRemoveItem={handleRemoveItem}
                        onItemDragEnd={handleItemDragEnd(group.id)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ArrowUpDown className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">아직 문제 그룹이 없습니다.</p>
                  <p className="text-xs mt-1">
                    &quot;그룹 추가&quot; 버튼을 클릭하세요.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Questions Panel */}
          {showAddPanel && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">문제 추가</CardTitle>
                <CardDescription>
                  {section.section_type.charAt(0).toUpperCase() +
                    section.section_type.slice(1)}{" "}
                  유형
                  {section.is_practice ? " (연습문제만)" : " (실전문제만)"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="문제 코드, 제목, 내용으로 검색..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="border rounded-lg max-h-[500px] overflow-y-auto divide-y">
                  {isLoadingQuestions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : availableQuestions.length > 0 ? (
                    availableQuestions.map((q) => {
                      const isChecked = selectedForAdd.includes(q.id);
                      const isExpanded = expandedQuestionId === q.id;
                      return (
                        <div
                          key={q.id}
                          className={cn(
                            "transition-colors",
                            isChecked && "bg-primary/5"
                          )}
                        >
                          <div className="flex items-center gap-2 p-2.5">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() =>
                                setSelectedForAdd((prev) =>
                                  prev.includes(q.id)
                                    ? prev.filter((i) => i !== q.id)
                                    : [...prev, q.id]
                                )
                              }
                            />
                            <button
                              type="button"
                              className="flex-1 flex items-center gap-2 text-left min-w-0"
                              onClick={() =>
                                setExpandedQuestionId(isExpanded ? null : q.id)
                              }
                            >
                              <span className="text-xs font-mono text-muted-foreground shrink-0">
                                {q.question_code}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] shrink-0"
                              >
                                {formatLabels[q.question_format] ||
                                  q.question_format}
                              </Badge>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {q.item_count}문항
                              </span>
                              <span className="text-xs text-muted-foreground flex-1">
                                {stripHtml(q.title || q.content)}
                              </span>
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              )}
                            </button>
                          </div>
                          {isExpanded && (
                            <div className="px-2.5 pb-2.5">
                              <QuestionDetailPreview
                                question={{
                                  question_format: q.question_format,
                                  content: q.content,
                                  instructions: q.instructions,
                                  options_data: q.options_data,
                                  answer_data: q.answer_data,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      추가 가능한 문제가 없습니다.
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    {availableQuestions.length}개 사용 가능
                  </p>
                  {selectedForAdd.length > 0 && activeGroupId && (
                    <Button size="sm" onClick={handleAddQuestionsToGroup}>
                      <Plus className="mr-1 h-4 w-4" />
                      {selectedForAdd.length}개 추가
                    </Button>
                  )}
                </div>

                {selectedForAdd.length > 0 && !activeGroupId && (
                  <p className="text-xs text-amber-600 text-center">
                    먼저 위에서 그룹을 선택하세요.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      )}

      {/* Preview */}
      <SectionPreview
        open={showPreview}
        onOpenChange={setShowPreview}
        sectionType={section.section_type}
        title={title}
        timeLimit={timeLimit}
        isPractice={section.is_practice}
        contentBlocks={previewContentBlocks}
        questionGroups={previewQuestionGroupsData}
        questions={previewQuestions}
      />

    </div>
  );
}

// ─── Content Block Editor ──────────────────────────────────────

function ContentBlockEditor({
  block,
  index,
  onUpdate,
  onRemove,
  sectionId,
}: {
  block: ContentBlock;
  index: number;
  onUpdate: (id: string, data: Partial<ContentBlock>) => void;
  onRemove: (id: string) => void;
  sectionId: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [localTitle, setLocalTitle] = useState(block.passage_title || "");
  const [localContent, setLocalContent] = useState(block.passage_content || "");
  const [localFootnotes, setLocalFootnotes] = useState(block.passage_footnotes || "");
  const [localAudioUrl, setLocalAudioUrl] = useState(block.audio_url || "");
  const [localTranscript, setLocalTranscript] = useState(block.audio_transcript || "");

  const label =
    block.content_type === "passage"
      ? block.passage_title || `Passage ${index + 1}`
      : `Audio ${index + 1}`;

  // Debounced save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (block.content_type === "passage") {
        onUpdate(block.id, {
          passage_title: localTitle || null,
          passage_content: localContent || null,
          passage_footnotes: localFootnotes || null,
        } as Partial<ContentBlock>);
      } else {
        onUpdate(block.id, {
          audio_url: localAudioUrl || null,
          audio_transcript: localTranscript || null,
        } as Partial<ContentBlock>);
      }
    }, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localTitle, localContent, localFootnotes, localAudioUrl, localTranscript]);

  return (
    <div className="border rounded-lg bg-white">
      <div className="flex items-center gap-2 p-3 border-b">
        <button type="button" onClick={() => setCollapsed(!collapsed)} className="p-0.5">
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {block.content_type === "passage" ? (
          <FileText className="h-4 w-4 text-emerald-500" />
        ) : (
          <Headphones className="h-4 w-4 text-sky-500" />
        )}
        <span className="text-sm font-medium flex-1">{label}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onRemove(block.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-3">
          {block.content_type === "passage" ? (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">지문 제목</Label>
                <Input
                  placeholder="예: The History of Glass"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">지문 내용</Label>
                <Textarea
                  placeholder="지문 내용을 입력하세요..."
                  rows={8}
                  value={localContent}
                  onChange={(e) => setLocalContent(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">각주 (선택)</Label>
                <Textarea
                  placeholder="예: *calorie: a measure of the energy value of food"
                  rows={2}
                  value={localFootnotes}
                  onChange={(e) => setLocalFootnotes(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">오디오 파일</Label>
                <FileUpload
                  value={localAudioUrl}
                  onChange={(url) => setLocalAudioUrl(url)}
                  accept="audio"
                  placeholder="오디오 파일 업로드"
                  context={`sections/${sectionId}`}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">스크립트</Label>
                <Textarea
                  placeholder="오디오 스크립트를 입력하세요..."
                  rows={4}
                  value={localTranscript}
                  onChange={(e) => setLocalTranscript(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Edit Group Card ───────────────────────────────────────────

function EditGroupCard({
  group,
  isActive,
  autoTitle,
  contentBlocks,
  sensors,
  onActivate,
  onUpdate,
  onRemove,
  onRemoveItem,
  onItemDragEnd,
}: {
  group: {
    id: string;
    content_block_id: string | null;
    title: string | null;
    instructions: string | null;
    numberedItems: (GroupItem & { startNum: number; endNum: number })[];
    groupStartNum: number;
    groupEndNum: number;
  };
  isActive: boolean;
  autoTitle: string;
  contentBlocks: ContentBlock[];
  sensors: ReturnType<typeof useSensors>;
  onActivate: () => void;
  onUpdate: (id: string, data: Record<string, unknown>) => void;
  onRemove: (id: string) => void;
  onRemoveItem: (itemId: string) => void;
  onItemDragEnd: (event: DragEndEvent) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [localTitle, setLocalTitle] = useState(group.title || "");
  const [localInstructions, setLocalInstructions] = useState(
    group.instructions || ""
  );

  // Debounced save for title/instructions
  useEffect(() => {
    const timer = setTimeout(() => {
      onUpdate(group.id, {
        title: localTitle || null,
        instructions: localInstructions || null,
      });
    }, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localTitle, localInstructions]);

  return (
    <div
      className={cn(
        "border rounded-lg transition-colors",
        isActive ? "border-primary shadow-sm" : "border-border"
      )}
      onClick={onActivate}
    >
      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-t-lg">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="p-0.5"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <span className="text-sm font-semibold flex-1">
          {group.title || autoTitle}
        </span>
        <Badge variant="outline" className="text-[10px]">
          {group.numberedItems.length}문제
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(group.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {expanded && (
        <div className="p-3 space-y-3" onClick={(e) => e.stopPropagation()}>
          {/* Content block selector */}
          {contentBlocks.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">콘텐츠 블록</Label>
              <Select
                value={group.content_block_id || "none"}
                onValueChange={(v) =>
                  onUpdate(group.id, {
                    content_block_id: v === "none" ? null : v,
                  })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="콘텐츠 선택..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">없음</SelectItem>
                  {contentBlocks.map((b, i) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.content_type === "passage"
                        ? b.passage_title || `Passage ${i + 1}`
                        : `Audio ${i + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Group title */}
          <div className="space-y-1">
            <Label className="text-xs">그룹 제목 (자동 생성 — 직접 입력 시 오버라이드, 예: &quot;Questions 1–5&quot;)</Label>
            <Input
              className="h-8 text-xs"
              placeholder={autoTitle || "문제 추가 시 자동 생성"}
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
            />
          </div>

          {/* Instructions */}
          <div className="space-y-1">
            <Label className="text-xs">지시문</Label>
            <Textarea
              className="text-xs"
              rows={2}
              placeholder="예: Choose the correct letter A, B, C or D."
              value={localInstructions}
              onChange={(e) => setLocalInstructions(e.target.value)}
            />
          </div>

          {/* Items */}
          {group.numberedItems.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onItemDragEnd}
            >
              <SortableContext
                items={group.numberedItems.map((i) => i.item_id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {group.numberedItems.map((item) => {
                    const numLabel =
                      item.startNum === item.endNum
                        ? `Q${item.startNum}`
                        : `Q${item.startNum}-${item.endNum}`;
                    return (
                      <SortableGroupItemRow
                        key={item.item_id}
                        item={item}
                        numberLabel={numLabel}
                        onRemove={() => onRemoveItem(item.item_id)}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-xs border border-dashed rounded">
              아래 &quot;문제 추가&quot; 패널에서 문제를 선택 후 추가하세요.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
