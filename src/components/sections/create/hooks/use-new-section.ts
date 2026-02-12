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
import { uploadFile } from "@/components/ui/file-upload";
import { uploadEditorImages } from "@/components/ui/rich-text-editor";
import {
  TOTAL_STEPS,
  generateTempId,
  type Question,
  type ContentBlock,
  type QuestionGroup,
  type PreviewQuestion,
} from "../types";

export function useNewSection() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [previewQuestions, setPreviewQuestions] = useState<PreviewQuestion[]>(
    []
  );
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Form state
  const [sectionType, setSectionType] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [timeLimit, setTimeLimit] = useState<string>("");
  const [isPractice, setIsPractice] = useState(false);
  const [instructionTitle, setInstructionTitle] = useState<string>("");
  const [instructionHtml, setInstructionHtml] = useState<string>("");

  // Content blocks
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

  // Question groups
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  // Available questions
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedForAdd, setSelectedForAdd] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  // 문제 생성 모달
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);

  // Step 2 state
  const [addDrawerGroupId, setAddDrawerGroupId] = useState<string | null>(null);
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // ─── Content Block helpers ─────────────────────────────────

  const addContentBlock = () => {
    const contentType = sectionType === "listening" ? "audio" : "passage";
    const newBlock: ContentBlock = {
      id: generateTempId(),
      content_type: contentType as "passage" | "audio",
      display_order: contentBlocks.length,
      passage_title: "",
      passage_content: "",
      passage_footnotes: "",
      audio_url: "",
      audio_transcript: "",
    };
    setContentBlocks((prev) => [...prev, newBlock]);
  };

  const updateContentBlock = (id: string, data: Partial<ContentBlock>) => {
    setContentBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...data } : b))
    );
  };

  const removeContentBlock = (id: string) => {
    setContentBlocks((prev) => prev.filter((b) => b.id !== id));
    setQuestionGroups((prev) =>
      prev.map((g) =>
        g.content_block_id === id ? { ...g, content_block_id: null } : g
      )
    );
  };

  const addSet = () => {
    const contentType = sectionType === "listening" ? "audio" : "passage";
    const needsContent = sectionType === "reading" || sectionType === "listening";
    const newBlockId = needsContent ? generateTempId() : null;

    if (needsContent && newBlockId) {
      setContentBlocks((prev) => [
        ...prev,
        {
          id: newBlockId,
          content_type: contentType as "passage" | "audio",
          display_order: prev.length,
          passage_title: "",
          passage_content: "",
          passage_footnotes: "",
          audio_url: "",
          audio_transcript: "",
        },
      ]);
    }

    const newGroupId = generateTempId();
    setQuestionGroups((prev) => [
      ...prev,
      {
        id: newGroupId,
        content_block_id: newBlockId,
        display_order: prev.length,
        title: "",
        instructions: "",
        questions: [],
      },
    ]);
    setActiveGroupId(newGroupId);
  };

  const removeSet = (groupId: string) => {
    const group = questionGroups.find((g) => g.id === groupId);
    if (group?.content_block_id) {
      setContentBlocks((prev) =>
        prev.filter((b) => b.id !== group.content_block_id)
      );
    }
    setQuestionGroups((prev) => prev.filter((g) => g.id !== groupId));
    if (activeGroupId === groupId) {
      const remaining = questionGroups.filter((g) => g.id !== groupId);
      setActiveGroupId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  useEffect(() => {
    if (sectionType && questionGroups.length === 0) {
      addSet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionType]);

  // ─── Question Group helpers ────────────────────────────────

  const addQuestionGroup = () => {
    const newGroup: QuestionGroup = {
      id: generateTempId(),
      content_block_id: contentBlocks.length > 0 ? contentBlocks[0].id : null,
      display_order: questionGroups.length,
      title: "",
      instructions: "",
      questions: [],
    };
    setQuestionGroups((prev) => [...prev, newGroup]);
    setActiveGroupId(newGroup.id);
  };

  const updateQuestionGroup = (id: string, data: Partial<QuestionGroup>) => {
    setQuestionGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...data } : g))
    );
  };

  const removeQuestionGroup = (id: string) => {
    setQuestionGroups((prev) => prev.filter((g) => g.id !== id));
    if (activeGroupId === id) {
      setActiveGroupId(questionGroups.find((g) => g.id !== id)?.id || null);
    }
  };

  const addQuestionsToGroup = (groupId: string) => {
    if (selectedForAdd.length === 0) return;
    setQuestionGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const existing = new Set(g.questions);
        const newQs = selectedForAdd.filter((qId) => !existing.has(qId));
        return { ...g, questions: [...g.questions, ...newQs] };
      })
    );
    setSelectedForAdd([]);
  };

  const removeQuestionFromGroup = (groupId: string, questionId: string) => {
    setQuestionGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return { ...g, questions: g.questions.filter((q) => q !== questionId) };
      })
    );
  };

  // ─── Number Calculation ────────────────────────────────────

  const numberingMap = (() => {
    const map: Record<
      string,
      { startNum: number; endNum: number; label: string }
    > = {};
    let currentNum = 1;
    for (const group of questionGroups) {
      for (const qId of group.questions) {
        const q = availableQuestions.find((aq) => aq.id === qId);
        const itemCount = q?.item_count || 1;
        const startNum = currentNum;
        const endNum = startNum + itemCount - 1;
        map[qId] = {
          startNum,
          endNum,
          label: itemCount > 1 ? `Q${startNum}-${endNum}` : `Q${startNum}`,
        };
        currentNum += itemCount;
      }
    }
    return map;
  })();

  const groupNumbering = (() => {
    const map: Record<string, { startNum: number; endNum: number }> = {};
    let currentNum = 1;
    for (const group of questionGroups) {
      const groupStart = currentNum;
      for (const qId of group.questions) {
        const q = availableQuestions.find((aq) => aq.id === qId);
        currentNum += q?.item_count || 1;
      }
      map[group.id] = { startNum: groupStart, endNum: currentNum - 1 };
    }
    return map;
  })();

  const totalItemCount = Object.values(numberingMap).reduce(
    (sum, n) => Math.max(sum, n.endNum),
    0
  );

  const allUsedQuestionIds = new Set(
    questionGroups.flatMap((g) => g.questions)
  );

  const generateGroupTitle = (group: QuestionGroup): string => {
    const ranges: string[] = [];
    let totalItems = 0;
    for (const qId of group.questions) {
      const num = numberingMap[qId];
      if (!num) continue;
      totalItems += num.endNum - num.startNum + 1;
      ranges.push(
        num.startNum === num.endNum
          ? `${num.startNum}`
          : `${num.startNum}–${num.endNum}`
      );
    }
    if (ranges.length === 0) return "";
    const prefix = totalItems === 1 ? "Question" : "Questions";
    if (ranges.length === 1) return `${prefix} ${ranges[0]}`;
    if (ranges.length === 2) return `${prefix} ${ranges[0]} and ${ranges[1]}`;
    const last = ranges.pop()!;
    return `${prefix} ${ranges.join(", ")} and ${last}`;
  };

  // ─── Load available questions ──────────────────────────────

  const loadAvailableQuestions = useCallback(async () => {
    if (!sectionType) {
      setAvailableQuestions([]);
      return;
    }

    setIsLoadingQuestions(true);
    try {
      const params = new URLSearchParams();
      params.set("question_type", sectionType);
      params.set("is_active", "true");
      params.set("is_practice", isPractice ? "true" : "false");
      params.set("limit", "100");
      if (searchQuery) params.set("search", searchQuery);

      const { data: result, error } = await api.get<{ questions: Question[] }>(`/api/questions?${params.toString()}`);
      if (error) throw new Error(error);
      setAvailableQuestions(result?.questions || []);
    } catch (error) {
      console.error("Error loading questions:", error);
      toast.error("문제 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [sectionType, searchQuery, isPractice]);

  useEffect(() => {
    loadAvailableQuestions();
  }, [loadAvailableQuestions]);

  useEffect(() => {
    const timer = setTimeout(() => loadAvailableQuestions(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 모달에서 문제 생성 완료 시
  const handleQuestionCreated = useCallback(
    async (questionId: string) => {
      // 현재 활성 그룹에 자동 추가
      if (activeGroupId) {
        setQuestionGroups((prev) =>
          prev.map((g) => {
            if (g.id !== activeGroupId) return g;
            if (g.questions.includes(questionId)) return g;
            return { ...g, questions: [...g.questions, questionId] };
          })
        );
      }
      // 문제 목록 새로고침
      await loadAvailableQuestions();
    },
    [activeGroupId, loadAvailableQuestions]
  );

  // ─── Section type change handler ───────────────────────────

  const handleSectionTypeChange = useCallback((newType: string) => {
    const hasQuestions = questionGroups.some((g) => g.questions.length > 0);
    if (hasQuestions && newType !== sectionType) {
      toast.warning("시험 과목을 변경하면 추가된 문제 목록이 초기화됩니다. 계속하시겠습니까?", {
        actionButtonStyle: { backgroundColor: "hsl(0 84% 60%)", color: "white" },
        action: {
          label: "변경",
          onClick: () => {
            setSectionType(newType);
            setContentBlocks([]);
            setQuestionGroups([]);
          },
        },
        cancel: { label: "취소", onClick: () => { } },
      });
    } else {
      setSectionType(newType);
      setContentBlocks([]);
      setQuestionGroups([]);
    }
  }, [questionGroups, sectionType]);

  // ─── Step validation ───────────────────────────────────────

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!sectionType) {
        toast.error("시험 과목을 선택해주세요.");
        return false;
      }
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

  // ─── Save ──────────────────────────────────────────────────

  const handleSave = async () => {
    if (!sectionType || !title) {
      toast.error("시험 유형과 제목은 필수입니다.");
      return;
    }

    // 최소 1세트에 1개 이상의 문제가 있어야 저장 가능
    const hasValidGroup = questionGroups.some((g) => g.questions.length > 0);
    if (!hasValidGroup) {
      toast.error("최소 1개 섹션에 문제가 1개 이상 추가되어야 저장할 수 있습니다.");
      return;
    }

    setIsSaving(true);
    try {
      const sectionData = {
        section_type: sectionType,
        title,
        description: description || null,
        time_limit_minutes: timeLimit ? parseInt(timeLimit) : null,
        is_practice: isPractice,
        is_active: true,
        instruction_title: instructionTitle || null,
        instruction_html: instructionHtml || null,
      };

      const { data: newSection, error: sectionError } = await api.post<{ id: string }>("/api/sections", sectionData);
      if (sectionError) throw new Error(sectionError);
      const sectionId = newSection!.id;

      // Content blocks
      const blockIdMap: Record<string, string> = {};
      const pendingAudioBlocks: { blockId: string; file: File }[] = [];
      const imgContext = `sections/${sectionId}`;

      for (let i = 0; i < contentBlocks.length; i++) {
        const block = contentBlocks[i];
        const hasPendingFile = !!block.audioFile;

        // 항상 uploadEditorImages 호출 (blob 없으면 내부에서 즉시 return)
        let passageContent = block.passage_content || null;
        let passageFootnotes = block.passage_footnotes || null;
        console.log("[IMG-DEBUG] save block", i, ": passageContent hasBlob=", passageContent?.includes("blob:"), "content=", passageContent?.substring(0, 200));
        console.log("[IMG-DEBUG] save block", i, ": passageFootnotes hasBlob=", passageFootnotes?.includes("blob:"));

        try {
          if (passageContent) {
            passageContent = await uploadEditorImages(passageContent, imgContext);
          }
          if (passageFootnotes) {
            passageFootnotes = await uploadEditorImages(passageFootnotes, imgContext);
          }
        } catch (e) {
          console.error("Section passage image upload failed:", e);
          toast.error("지문 이미지 업로드에 실패했습니다.");
        }

        const { data: result, error: blockError } = await api.post<{ block_id: string }>(`/api/sections/${sectionId}/content-blocks`, {
          display_order: i,
          content_type: block.content_type,
          passage_title: block.passage_title || null,
          passage_content: passageContent,
          passage_footnotes: passageFootnotes,
          // deferred 파일이 있으면 URL 제외 (blob URL이므로)
          audio_url: hasPendingFile ? null : (block.audio_url || null),
        });
        if (!blockError && result) {
          blockIdMap[block.id] = result.block_id;
          // pending 파일 기록
          if (hasPendingFile && block.audioFile) {
            pendingAudioBlocks.push({ blockId: result.block_id, file: block.audioFile });
          }
        }
      }

      // pending 오디오 파일 업로드 후 콘텐츠 블록 업데이트
      for (const pending of pendingAudioBlocks) {
        const context = `sections/${sectionId}`;
        const uploaded = await uploadFile(pending.file, "audio", context);
        // 블록 업데이트 (upsert with block_id)
        await api.post(`/api/sections/${sectionId}/content-blocks`, {
          block_id: pending.blockId,
          audio_url: uploaded.path,
        });
      }

      // Question groups + items
      let currentNumber = 1;
      for (let gi = 0; gi < questionGroups.length; gi++) {
        const group = questionGroups[gi];
        const serverBlockId = group.content_block_id
          ? blockIdMap[group.content_block_id] || null
          : null;

        const { data: groupResult, error: groupError } = await api.post<{ group_id: string }>(`/api/sections/${sectionId}/groups`, {
          content_block_id: serverBlockId,
          display_order: gi,
          title: group.title || null,
          instructions: group.instructions || null,
          question_number_start: currentNumber,
        });

        if (groupError || !groupResult) continue;
        const serverGroupId = groupResult.group_id;

        for (let qi = 0; qi < group.questions.length; qi++) {
          const questionId = group.questions[qi];
          const question = availableQuestions.find((q) => q.id === questionId);
          const itemCount = question?.item_count || 1;

          await api.post(`/api/sections/${sectionId}/groups/${serverGroupId}/items`, {
            question_id: questionId,
            question_number_start: currentNumber,
            display_order: qi,
          });

          currentNumber += itemCount;
        }
      }

      toast.success("시험이 생성되었습니다.");
      router.push("/sections");
    } catch (error) {
      console.error("Error saving section:", error);
      toast.error(
        error instanceof Error ? error.message : "시험 생성에 실패했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Preview ───────────────────────────────────────────────

  const openPreview = async () => {
    const allQuestionIds = questionGroups.flatMap((g) => g.questions);
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
          if (error) throw new Error(error);
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

  // ─── DnD ───────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleBlockDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setContentBlocks((prev) => {
        const oldIndex = prev.findIndex((b) => b.id === String(active.id));
        const newIndex = prev.findIndex((b) => b.id === String(over.id));
        return arrayMove(prev, oldIndex, newIndex).map((b, i) => ({
          ...b,
          display_order: i,
        }));
      });
    }
  };

  const handleGroupDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setQuestionGroups((prev) => {
        const oldIndex = prev.findIndex((g) => g.id === String(active.id));
        const newIndex = prev.findIndex((g) => g.id === String(over.id));
        return arrayMove(prev, oldIndex, newIndex).map((g, i) => ({
          ...g,
          display_order: i,
        }));
      });
    }
  };

  const handleItemDragEnd =
    (groupId: string) => (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        setQuestionGroups((prev) =>
          prev.map((g) => {
            if (g.id !== groupId) return g;
            const oldIndex = g.questions.indexOf(String(active.id));
            const newIndex = g.questions.indexOf(String(over.id));
            return {
              ...g,
              questions: arrayMove(g.questions, oldIndex, newIndex),
            };
          })
        );
      }
    };

  // ─── Step 2 UI helpers ─────────────────────────────────────

  // 부모 패널(문제 추가 드로어) 닫히면 자식 패널(문제 생성)도 연쇄 닫기
  useEffect(() => {
    if (!addDrawerGroupId) {
      setShowCreateQuestion(false);
    }
  }, [addDrawerGroupId]);

  const toggleBlockCollapse = (blockId: string) => {
    setCollapsedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId); else next.add(blockId);
      return next;
    });
  };

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
      return next;
    });
  };

  // Auto-expand newly added groups
  useEffect(() => {
    if (activeGroupId && !expandedGroups.has(activeGroupId)) {
      setExpandedGroups((prev) => new Set(prev).add(activeGroupId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroupId]);

  // ─── Build preview props ───────────────────────────────────

  const previewContentBlocks = contentBlocks.map((b) => ({
    id: b.id,
    content_type: b.content_type,
    passage_title: b.passage_title,
    passage_content: b.passage_content,
    passage_footnotes: b.passage_footnotes,
    audio_url: b.audio_url,
  }));

  const previewQuestionGroupsData = questionGroups.map((g) => {
    const gNum = groupNumbering[g.id] || { startNum: 0, endNum: 0 };
    return {
      id: g.id,
      title: g.title,
      instructions: g.instructions || null,
      contentBlockId: g.content_block_id,
      startNum: gNum.startNum,
      endNum: gNum.endNum,
      questionIds: g.questions,
    };
  });

  return {
    // Form state
    sectionType,
    handleSectionTypeChange,
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

    // Content blocks
    contentBlocks,
    addContentBlock,
    updateContentBlock,
    removeContentBlock,
    addSet,
    removeSet,

    // Question groups
    questionGroups,
    activeGroupId,
    setActiveGroupId,
    addQuestionGroup,
    updateQuestionGroup,
    removeQuestionGroup,
    addQuestionsToGroup,
    removeQuestionFromGroup,

    // Numbering
    numberingMap,
    groupNumbering,
    totalItemCount,
    allUsedQuestionIds,
    generateGroupTitle,

    // Available questions
    availableQuestions,
    isLoadingQuestions,
    selectedForAdd,
    setSelectedForAdd,
    searchQuery,
    setSearchQuery,
    expandedQuestionId,
    setExpandedQuestionId,

    // Create question modal
    showCreateQuestion,
    setShowCreateQuestion,
    handleQuestionCreated,

    // Step navigation
    currentStep,
    setCurrentStep,
    validateStep,
    handleNext,
    handlePrev,
    isSaving,
    handleSave,

    // Preview
    showPreview,
    setShowPreview,
    isLoadingPreview,
    openPreview,
    previewQuestions,
    previewContentBlocks,
    previewQuestionGroupsData,

    // DnD
    sensors,
    handleBlockDragEnd,
    handleGroupDragEnd,
    handleItemDragEnd,

    // Step 2 UI
    addDrawerGroupId,
    setAddDrawerGroupId,
    collapsedBlocks,
    expandedGroups,
    toggleBlockCollapse,
    toggleGroupExpand,
  };
}
