"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { api } from "@/lib/api/client";
import { uploadEditorImages } from "@/components/ui/rich-text-editor";
import type { PreviewQuestion } from "@/components/sections/section-preview";
import {
  TOTAL_STEPS,
  type SectionData,
  type ContentBlock,
  type QuestionGroupData,
  type AvailableQuestion,
  type NumberedGroup,
} from "../types";

export function useSectionEdit(id: string) {
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
  const [isPractice, setIsPractice] = useState(false);

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
  const [addDrawerGroupId, setAddDrawerGroupId] = useState<string | null>(null);
  const [selectedForAdd, setSelectedForAdd] = useState<string[]>([]);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // 문제 생성 모달
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);

  // 부모 패널(문제 추가 드로어) 닫히면 자식 패널(문제 생성)도 연쇄 닫기
  useEffect(() => {
    if (!addDrawerGroupId) {
      setShowCreateQuestion(false);
    }
  }, [addDrawerGroupId]);

  // Pending deletions (deferred until save)
  const [pendingBlockDeletes, setPendingBlockDeletes] = useState<string[]>([]);
  const [pendingGroupDeletes, setPendingGroupDeletes] = useState<string[]>([]);
  const [pendingItemDeletes, setPendingItemDeletes] = useState<string[]>([]);
  // Track removed questions so they can be re-added before save
  const [pendingDeletedQuestions, setPendingDeletedQuestions] = useState<AvailableQuestion[]>([]);

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
            toast.error("시험을 찾을 수 없습니다.");
            router.push("/sections");
            return;
          }
          throw new Error(error);
        }

        if (!data) throw new Error("시험 데이터가 없습니다.");
        setSection(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setTimeLimit(data.time_limit_minutes?.toString() || "");
        setIsPractice(data.is_practice ?? false);
        setInstructionTitle(data.instruction_title || "");
        setInstructionHtml(data.instruction_html || "");
      } catch (error) {
        console.error("Error loading section:", error);
        toast.error("시험 정보를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadSection();
  }, [id, router]);

  // ─── Load structure (blocks + groups) ──────────────────────

  const loadStructure = useCallback(async (opts?: { preservePendingDeletes?: boolean }) => {
    try {
      const { data, error } = await api.get<{ content_blocks: ContentBlock[]; question_groups: QuestionGroupData[] }>(`/api/sections/${id}/structure`);
      if (error) throw new Error(error);

      let blocks = data!.content_blocks || [];
      let groups = data!.question_groups || [];

      // When reloading after add operations, filter out items pending deletion
      if (opts?.preservePendingDeletes) {
        setPendingBlockDeletes((pendingBlocks) => {
          blocks = blocks.filter((b) => !pendingBlocks.includes(b.id));
          setContentBlocks(blocks);
          return pendingBlocks;
        });
        setPendingGroupDeletes((pendingGroups) => {
          groups = groups.filter((g) => !pendingGroups.includes(g.id));
          return pendingGroups;
        });
        setPendingItemDeletes((pendingItems) => {
          groups = groups.map((g) => ({
            ...g,
            items: g.items.filter((i) => !pendingItems.includes(i.item_id)),
          }));
          setQuestionGroups(groups);
          return pendingItems;
        });
      } else {
        setContentBlocks(blocks);
        setQuestionGroups(groups);
      }

      if (groups.length > 0) {
        setActiveGroupId(groups[0].id);
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
      let questions = Array.isArray(data) ? data : [];

      // Merge back questions pending deletion (removed locally but not yet saved)
      if (pendingDeletedQuestions.length > 0) {
        const existingIds = new Set(questions.map((q) => q.id));
        // Also exclude questions currently in groups (to avoid duplicates)
        const currentQuestionIds = new Set(
          questionGroups.flatMap((g) => g.items.map((i) => i.question_id))
        );
        const toMerge = pendingDeletedQuestions.filter(
          (q) => !existingIds.has(q.id) && !currentQuestionIds.has(q.id)
        );
        if (toMerge.length > 0) {
          questions = [...toMerge, ...questions];
        }
      }

      setAvailableQuestions(questions);
    } catch (error) {
      console.error("Error loading available questions:", error);
      toast.error("문제 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [id, section, searchQuery, pendingDeletedQuestions, questionGroups]);

  useEffect(() => {
    if (addDrawerGroupId && section) {
      const timer = setTimeout(() => loadAvailableQuestions(), 300);
      return () => clearTimeout(timer);
    }
  }, [addDrawerGroupId, section, loadAvailableQuestions, searchQuery]);

  // ─── Auto-numbering ────────────────────────────────────────

  const numberedGroups: NumberedGroup[] = (() => {
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
      await loadStructure({ preservePendingDeletes: true });
    } catch (error) {
      console.error("Error adding content block:", error);
      toast.error("콘텐츠 블록 추가에 실패했습니다.");
    }
  };

  // Modal-based content block save:
  //   existingId = null → create new block via API
  //   existingId = string → update local state only (persisted during global save)
  const handleSaveContentBlockFromModal = async (
    data: Partial<ContentBlock>,
    existingId: string | null
  ) => {
    if (existingId) {
      // Update existing block locally
      handleUpdateContentBlockLocal(existingId, data);
    } else {
      // Create new block with data
      if (!section) return;
      const contentType = section.section_type === "listening" ? "audio" : "passage";
      try {
        const { error } = await api.post(`/api/sections/${id}/content-blocks`, {
          display_order: contentBlocks.length,
          content_type: contentType,
          passage_title: data.passage_title || null,
          passage_content: data.passage_content || null,
          passage_footnotes: data.passage_footnotes || null,
          audio_url: data.audio_url || null,
        });
        if (error) throw new Error(error);
        toast.success("콘텐츠 블록이 추가되었습니다.");
        await loadStructure({ preservePendingDeletes: true });
      } catch (error) {
        console.error("Error adding content block:", error);
        toast.error("콘텐츠 블록 추가에 실패했습니다.");
      }
    }
  };

  // Local-only state update (no API call) — used during editing to preserve blob URLs
  const handleUpdateContentBlockLocal = (
    blockId: string,
    data: Partial<ContentBlock>
  ) => {
    setContentBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, ...data } : b))
    );
  };

  // API call to persist a content block — used only during save
  const saveContentBlockToApi = async (
    blockId: string,
    data: Partial<ContentBlock>
  ) => {
    try {
      const { error } = await api.post(`/api/sections/${id}/content-blocks`, {
        block_id: blockId,
        display_order: data.display_order ?? 0,
        content_type: data.content_type || "passage",
        passage_title: data.passage_title || null,
        passage_content: data.passage_content || null,
        passage_footnotes: data.passage_footnotes || null,
        audio_url: data.audio_url || null,
      });
      if (error) throw new Error(error);
    } catch (error) {
      console.error("Error updating content block:", error);
      toast.error("콘텐츠 블록 저장에 실패했습니다.");
    }
  };

  const handleRemoveContentBlock = (blockId: string) => {
    if (!blockId.startsWith("temp-")) {
      setPendingBlockDeletes((prev) => [...prev, blockId]);
    }
    setContentBlocks((prev) => prev.filter((b) => b.id !== blockId));
    setQuestionGroups((prev) =>
      prev.map((g) =>
        g.content_block_id === blockId ? { ...g, content_block_id: null } : g
      )
    );
    toast.info("콘텐츠 블록이 제거되었습니다. 저장 시 반영됩니다.");
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
      toast.success("시험 구조가 추가되었습니다.");
      await loadStructure({ preservePendingDeletes: true });
    } catch (error) {
      console.error("Error adding group:", error);
      toast.error("그룹 추가에 실패했습니다.");
    }
  };

  // Modal-based group save:
  //   existingId = null → create new group via API
  //   existingId = string → update local state only
  const handleSaveGroupFromModal = async (
    data: { title: string | null; instructions: string | null; sub_instructions: string | null; content_block_id: string | null },
    existingId: string | null
  ) => {
    if (existingId) {
      // Update existing group locally
      handleUpdateGroup(existingId, data);
    } else {
      // Create new group with data
      try {
        const { error } = await api.post(`/api/sections/${id}/groups`, {
          display_order: questionGroups.length,
          content_block_id: data.content_block_id || (contentBlocks.length > 0 ? contentBlocks[0].id : null),
          question_number_start: totalItemCount + 1,
          title: data.title || null,
          instructions: data.instructions || null,
          sub_instructions: data.sub_instructions || null,
        });
        if (error) throw new Error(error);
        toast.success("시험 구조가 추가되었습니다.");
        await loadStructure({ preservePendingDeletes: true });
      } catch (error) {
        console.error("Error adding group:", error);
        toast.error("그룹 추가에 실패했습니다.");
      }
    }
  };

  const handleUpdateGroup = (
    groupId: string,
    data: Record<string, unknown>
  ) => {
    setQuestionGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, ...data } as typeof g : g))
    );
  };

  const handleRemoveGroup = (groupId: string) => {
    if (!groupId.startsWith("temp-")) {
      setPendingGroupDeletes((prev) => [...prev, groupId]);
    }
    setQuestionGroups((prev) => prev.filter((g) => g.id !== groupId));
    if (activeGroupId === groupId) {
      setActiveGroupId(questionGroups.find((g) => g.id !== groupId)?.id || null);
    }
    toast.info("시험 구조가 제거되었습니다. 저장 시 반영됩니다.");
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
      await loadStructure({ preservePendingDeletes: true });
      if (addDrawerGroupId) loadAvailableQuestions();
    } catch (error) {
      console.error("Error adding questions:", error);
      toast.error("문제 추가에 실패했습니다.");
    }
  };

  // ─── Remove item from group ────────────────────────────────

  const handleRemoveItem = (itemId: string) => {
    // Capture question info before removing so it can appear in "available questions" list
    for (const g of questionGroups) {
      const item = g.items.find((i) => i.item_id === itemId);
      if (item) {
        setPendingDeletedQuestions((prev) => {
          if (prev.some((q) => q.id === item.question_id)) return prev;
          const qi = item.question_info;
          return [...prev, {
            id: item.question_id,
            question_code: qi.question_code,
            question_type: qi.question_type,
            question_format: qi.question_format,
            content: qi.content,
            title: qi.title,
            instructions: qi.instructions,
            difficulty: null,
            is_active: true,
            item_count: qi.item_count,
            options_data: qi.options_data,
            answer_data: qi.answer_data,
          }];
        });
        break;
      }
    }

    if (!itemId.startsWith("temp-")) {
      setPendingItemDeletes((prev) => [...prev, itemId]);
    }
    setQuestionGroups((prev) =>
      prev.map((g) => ({
        ...g,
        items: g.items.filter((i) => i.item_id !== itemId),
      }))
    );
    toast.info("문제가 제거되었습니다. 저장 시 반영됩니다.");
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

    setQuestionGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, items: reordered.map((item, i) => ({ ...item, display_order: i })) }
          : g
      )
    );

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
      await loadStructure({ preservePendingDeletes: true });
    }
  };

  // ─── Question created handler ───────────────────────────────

  const handleQuestionCreated = useCallback(
    async (questionId: string) => {
      if (activeGroupId) {
        try {
          const { error } = await api.post(`/api/sections/${id}/groups/${activeGroupId}/items`, {
            question_id: questionId,
            display_order: 999,
          });
          if (error) throw new Error(error);
          await loadStructure({ preservePendingDeletes: true });
          toast.success("문제가 생성되어 그룹에 추가되었습니다.");
        } catch (err) {
          console.error("Error auto-adding question:", err);
          toast.error("문제는 생성되었으나 그룹에 자동 추가하지 못했습니다.");
        }
      } else {
        toast.success("문제가 생성되었습니다. 그룹에 추가해주세요.");
      }
      if (addDrawerGroupId) loadAvailableQuestions();
    },
    [activeGroupId, id, loadStructure, addDrawerGroupId, loadAvailableQuestions]
  );

  // ─── Save ──────────────────────────────────────────────────

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("시험명은 필수입니다.");
      return;
    }

    const allGroupsValid = questionGroups.every((g) => g.items.length > 0);
    if (!allGroupsValid) {
      toast.error("모든 섹션에 최소 1개 이상의 문제가 추가되어야 합니다.");
      return;
    }

    setIsSaving(true);
    try {
      // 0. Process pending deletions first
      for (const itemId of pendingItemDeletes) {
        const { error: itemErr } = await api.delete(`/api/sections/${id}/items?item_id=${itemId}`);
        if (itemErr) console.error("Error deleting item:", itemErr);
      }
      for (const groupId of pendingGroupDeletes) {
        const { error: groupErr } = await api.delete(`/api/sections/${id}/groups/${groupId}`);
        if (groupErr) console.error("Error deleting group:", groupErr);
      }
      for (const blockId of pendingBlockDeletes) {
        const { error: blockErr } = await api.delete(`/api/sections/${id}/content-blocks?block_id=${blockId}`);
        if (blockErr) console.error("Error deleting block:", blockErr);
      }

      // 1. Update section info
      const updateData: Record<string, unknown> = {
        title,
        description: description || null,
        time_limit_minutes: timeLimit ? parseInt(timeLimit) : null,
        is_practice: isPractice,
        instruction_title: instructionTitle || null,
        instruction_html: instructionHtml || null,
      };

      const { error } = await api.put(`/api/sections/${id}`, updateData);
      if (error) throw new Error(error);

      // 2. Save content blocks (upload blob images first, then save)
      const imgContext = `sections/${id}`;
      for (let i = 0; i < contentBlocks.length; i++) {
        const block = contentBlocks[i];

        // 항상 uploadEditorImages 호출 (blob 없으면 내부에서 즉시 return)
        let passageContent = block.passage_content || null;
        let passageFootnotes = block.passage_footnotes || null;
        console.log("[IMG-DEBUG] edit save block", block.id, ": passageContent hasBlob=", passageContent?.includes("blob:"), "content=", passageContent?.substring(0, 200));
        console.log("[IMG-DEBUG] edit save block", block.id, ": passageFootnotes hasBlob=", passageFootnotes?.includes("blob:"));

        try {
          if (passageContent) {
            passageContent = await uploadEditorImages(passageContent, imgContext);
          }
          if (passageFootnotes) {
            passageFootnotes = await uploadEditorImages(passageFootnotes, imgContext);
          }
        } catch (e) {
          console.error("Section passage image upload failed:", e);
          toast.error("지문 이미지 업로드에 실패했습니다. 다시 저장해주세요.");
        }

        await saveContentBlockToApi(block.id, {
          ...block,
          display_order: i,
          passage_content: passageContent,
          passage_footnotes: passageFootnotes,
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
          content_block_id: group.content_block_id || null,
          title: group.title || null,
          instructions: group.instructions || null,
          sub_instructions: group.sub_instructions || null,
          items,
        };
      });

      if (groupsPayload.length > 0) {
        const { error: groupError } = await api.put(`/api/sections/${id}/groups`, { groups: groupsPayload });
        if (groupError) throw new Error(groupError);
      }

      // Clear pending deletions
      setPendingBlockDeletes([]);
      setPendingGroupDeletes([]);
      setPendingItemDeletes([]);
      setPendingDeletedQuestions([]);

      toast.success("시험이 저장되었습니다.");
      router.push("/sections");
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
    toast.warning(`"${title}" 시험을 삭제하시겠습니까?`, {
      description: "이 시험에 연결된 문제는 삭제되지 않습니다.",
      actionButtonStyle: { backgroundColor: "hsl(0 84% 60%)", color: "white" },
      action: {
        label: "삭제",
        onClick: async () => {
          try {
            const { error } = await api.delete(`/api/sections/${id}`);
            if (error) throw new Error(error);
            toast.success("시험이 삭제되었습니다.");
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
        toast.error("시험명을 입력해주세요.");
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

  // ─── Preview data ──────────────────────────────────────────

  const previewContentBlocks = contentBlocks.map((b) => ({
    id: b.id,
    content_type: b.content_type,
    passage_title: b.passage_title || undefined,
    passage_content: b.passage_content || undefined,
    passage_footnotes: b.passage_footnotes || undefined,
    audio_url: b.audio_url || undefined,
  }));

  const previewQuestionGroupsData = numberedGroups.map((g) => ({
    id: g.id,
    title: g.title || "",
    instructions: g.instructions,
    subInstructions: g.sub_instructions || null,
    contentBlockId: g.content_block_id,
    startNum: g.groupStartNum,
    endNum: g.groupEndNum,
    questionIds: g.items.map((i) => i.question_id),
  }));

  return {
    // State
    section,
    isLoading,
    isSaving,
    currentStep,
    setCurrentStep,
    title,
    setTitle,
    description,
    setDescription,
    timeLimit,
    setTimeLimit,
    isPractice,
    setIsPractice,
    instructionTitle,
    setInstructionTitle,
    instructionHtml,
    setInstructionHtml,
    contentBlocks,
    questionGroups,
    activeGroupId,
    setActiveGroupId,
    numberedGroups,
    totalItemCount,
    availableQuestions,
    isLoadingQuestions,
    searchQuery,
    setSearchQuery,
    addDrawerGroupId,
    setAddDrawerGroupId,
    selectedForAdd,
    setSelectedForAdd,
    expandedQuestionId,
    setExpandedQuestionId,
    showCreateQuestion,
    setShowCreateQuestion,
    showPreview,
    setShowPreview,
    isLoadingPreview,
    previewQuestions,
    previewContentBlocks,
    previewQuestionGroupsData,
    sensors,

    // Actions
    handleAddContentBlock,
    handleUpdateContentBlockLocal,
    handleRemoveContentBlock,
    handleSaveContentBlockFromModal,
    handleAddGroup,
    handleUpdateGroup,
    handleRemoveGroup,
    handleSaveGroupFromModal,
    handleAddQuestionsToGroup,
    handleRemoveItem,
    handleItemDragEnd,
    handleQuestionCreated,
    handleSave,
    confirmDelete,
    validateStep,
    handleNext,
    handlePrev,
    openPreview,
  };
}

export type SectionEditState = ReturnType<typeof useSectionEdit>;
