import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { QuestionType, MCQOption, MatchingItem, Blank } from "@/components/questions/types";
import type { QuestionTab } from "./types";
import { createDefaultTab } from "./types";

export function useQuestionForm() {
  // 문제 유형 (최초 선택 후 고정)
  const [selectedQuestionType, setSelectedQuestionType] = useState<QuestionType | null>(null);

  // 탭 관리
  const [tabs, setTabs] = useState<QuestionTab[]>([createDefaultTab()]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // 미리보기 모달
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // 현재 활성 탭
  const currentTab = tabs[activeTabIndex];

  // ==========================================================================
  // 탭 업데이트 헬퍼
  // ==========================================================================
  const updateCurrentTab = useCallback(<K extends keyof QuestionTab>(
    field: K,
    value: QuestionTab[K]
  ) => {
    setTabs(prevTabs => prevTabs.map((tab, idx) =>
      idx === activeTabIndex ? { ...tab, [field]: value, hasError: false, errorMessage: "" } : tab
    ));
  }, [activeTabIndex]);

  // ==========================================================================
  // 탭 관리 함수
  // ==========================================================================
  const addTab = () => {
    const newTab = createDefaultTab();
    setTabs([...tabs, newTab]);
    setActiveTabIndex(tabs.length);
  };

  const removeTab = (index: number) => {
    if (tabs.length <= 1) {
      toast.error("최소 1개의 탭이 필요합니다.");
      return;
    }
    const newTabs = tabs.filter((_, i) => i !== index);
    setTabs(newTabs);
    if (activeTabIndex >= newTabs.length) {
      setActiveTabIndex(newTabs.length - 1);
    } else if (activeTabIndex > index) {
      setActiveTabIndex(activeTabIndex - 1);
    }
  };

  const resetCurrentTabFormat = () => {
    const defaultTab = createDefaultTab();
    setTabs(prevTabs => prevTabs.map((tab, idx) =>
      idx === activeTabIndex ? { ...defaultTab, id: tab.id } : tab
    ));
  };

  // ==========================================================================
  // MCQ 관련 함수
  // ==========================================================================
  const addMcqOption = () => {
    const labels = "ABCDEFGHIJ";
    const options = currentTab.mcqOptions;
    const nextLabel = labels[options.length] || `O${options.length + 1}`;
    updateCurrentTab("mcqOptions", [...options, { id: `o${Date.now()}`, label: nextLabel, text: "", isCorrect: false }]);
  };

  const removeMcqOption = (id: string) => {
    const options = currentTab.mcqOptions;
    if (options.length <= 2) {
      toast.error("최소 2개의 선택지가 필요합니다.");
      return;
    }
    const newOptions = options.filter(o => o.id !== id);
    const labels = "ABCDEFGHIJ";
    updateCurrentTab("mcqOptions", newOptions.map((o, i) => ({ ...o, label: labels[i] || `O${i + 1}` })));
    if (currentTab.mcqMaxSelections > newOptions.length) {
      updateCurrentTab("mcqMaxSelections", Math.max(2, newOptions.length));
    }
  };

  const updateMcqOption = (id: string, field: keyof MCQOption, value: unknown) => {
    updateCurrentTab("mcqOptions", currentTab.mcqOptions.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const toggleMcqCorrect = (id: string) => {
    if (currentTab.mcqIsMultiple) {
      updateCurrentTab("mcqOptions", currentTab.mcqOptions.map(o => o.id === id ? { ...o, isCorrect: !o.isCorrect } : o));
    } else {
      updateCurrentTab("mcqOptions", currentTab.mcqOptions.map(o => ({ ...o, isCorrect: o.id === id })));
    }
  };

  const toggleMcqMode = (isMultiple: boolean) => {
    const hasData = currentTab.mcqQuestion.trim() || currentTab.mcqOptions.some(o => o.text.trim() || o.isCorrect);
    updateCurrentTab("mcqIsMultiple", isMultiple);
    if (hasData) {
      updateCurrentTab("mcqQuestion", "");
      updateCurrentTab("mcqOptions", [
        { id: "a", label: "A", text: "", isCorrect: false },
        { id: "b", label: "B", text: "", isCorrect: false },
        { id: "c", label: "C", text: "", isCorrect: false },
        { id: "d", label: "D", text: "", isCorrect: false },
      ]);
      updateCurrentTab("mcqMaxSelections", 2);
      toast.info("선택 방식이 변경되어 입력 내용이 초기화되었습니다.");
    }
  };

  // ==========================================================================
  // 매칭 관련 함수
  // ==========================================================================
  const addMatchingOption = () => {
    const options = currentTab.matchingOptions;
    const labels = "ABCDEFGHIJ";
    const nextLabel = labels[options.length] || `O${options.length + 1}`;
    updateCurrentTab("matchingOptions", [...options, { id: `o${Date.now()}`, label: nextLabel, text: "" }]);
  };

  const removeMatchingOption = (id: string) => {
    const options = currentTab.matchingOptions;
    if (options.length <= 2) {
      toast.error("최소 2개의 보기가 필요합니다.");
      return;
    }
    const newOptions = options.filter(o => o.id !== id);
    const labels = "ABCDEFGHIJ";
    updateCurrentTab("matchingOptions", newOptions.map((o, i) => ({ ...o, label: labels[i] || `O${i + 1}` })));
  };

  const updateMatchingOption = (id: string, text: string) => {
    updateCurrentTab("matchingOptions", currentTab.matchingOptions.map(o => o.id === id ? { ...o, text } : o));
  };

  const addMatchingItem = () => {
    const items = currentTab.matchingItems;
    const nextNum = items.length > 0 ? Math.max(...items.map(i => i.number)) + 1 : 1;
    updateCurrentTab("matchingItems", [...items, { id: `m${Date.now()}`, number: nextNum, statement: "", correctLabel: "" }]);
  };

  const updateMatchingItem = (id: string, field: keyof MatchingItem, value: unknown) => {
    updateCurrentTab("matchingItems", currentTab.matchingItems.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeMatchingItem = (id: string) => {
    if (currentTab.matchingItems.length <= 1) {
      toast.error("최소 1개의 문항이 필요합니다.");
      return;
    }
    updateCurrentTab("matchingItems", currentTab.matchingItems.filter(i => i.id !== id));
  };

  // ==========================================================================
  // 빈칸 관련 함수
  // ==========================================================================
  const addBlank = () => {
    const blanks = currentTab.blanks;
    const nextNumber = blanks.length > 0 ? Math.max(...blanks.map(b => b.number)) + 1 : 1;
    updateCurrentTab("blanks", [...blanks, { id: `b${Date.now()}`, number: nextNumber, answer: "", alternatives: [] }]);
  };

  const updateBlank = (id: string, field: keyof Blank, value: unknown) => {
    updateCurrentTab("blanks", currentTab.blanks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const removeBlank = (id: string) => {
    updateCurrentTab("blanks", currentTab.blanks.filter(b => b.id !== id));
  };

  // Word Bank
  const addWord = () => updateCurrentTab("wordBank", [...currentTab.wordBank, ""]);
  const cleanWord = (s: string) => s.trim();
  const updateWord = (index: number, value: string) => {
    const allowSpaces = currentTab.format === "table_completion";
    const parts = value.split(",").map(cleanWord).filter(Boolean);
    if (parts.length > 1) {
      const valid = allowSpaces ? parts : parts.filter(p => !/\s/.test(p));
      const invalid = allowSpaces ? [] : parts.filter(p => /\s/.test(p));
      if (invalid.length > 0) toast.warning(`공백이 포함된 단어는 추가할 수 없습니다: ${invalid.join(", ")}`);
      if (valid.length > 0) {
        const newBank = [...currentTab.wordBank];
        newBank[index] = valid[0];
        const extra = valid.slice(1).filter(w => !newBank.includes(w));
        updateCurrentTab("wordBank", [...newBank, ...extra]);
      }
      return;
    }
    const cleaned = cleanWord(value);
    if (!allowSpaces && cleaned && /\s/.test(cleaned)) {
      toast.warning("공백이 포함된 단어는 추가할 수 없습니다. 단일 단어만 입력해주세요.");
      return;
    }
    const newBank = [...currentTab.wordBank];
    newBank[index] = cleaned;
    updateCurrentTab("wordBank", newBank);
  };
  const removeWord = (index: number) => updateCurrentTab("wordBank", currentTab.wordBank.filter((_, i) => i !== index));

  // ==========================================================================
  // 플로우차트 관련 함수
  // ==========================================================================
  const addFlowchartNode = (type: "box" | "branch") => {
    const nodes = currentTab.flowchartNodes;
    const maxRow = nodes.reduce((max, n) => Math.max(max, n.row), -1);
    updateCurrentTab("flowchartNodes", [...nodes, {
      id: `n${Date.now()}`,
      type,
      content: "",
      row: maxRow + 1,
      col: 0,
      label: "",
    }]);
  };

  return {
    // State
    selectedQuestionType,
    setSelectedQuestionType,
    tabs,
    setTabs,
    activeTabIndex,
    setActiveTabIndex,
    isPreviewOpen,
    setIsPreviewOpen,
    currentTab,

    // Tab management
    updateCurrentTab,
    addTab,
    removeTab,
    resetCurrentTabFormat,

    // MCQ
    addMcqOption,
    removeMcqOption,
    updateMcqOption,
    toggleMcqCorrect,
    toggleMcqMode,

    // Matching
    addMatchingOption,
    removeMatchingOption,
    updateMatchingOption,
    addMatchingItem,
    updateMatchingItem,
    removeMatchingItem,

    // Blanks
    addBlank,
    updateBlank,
    removeBlank,
    addWord,
    updateWord,
    removeWord,

    // Flowchart
    addFlowchartNode,
  };
}
