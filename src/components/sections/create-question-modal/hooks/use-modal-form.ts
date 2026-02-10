"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import type { QuestionType } from "@/components/questions/types";
import {
  type TabState,
  type MCQOptionItem,
  createEmptyTab,
  createSpeakingSubQuestion,
  genId,
} from "../types";

export function useModalForm(
  open: boolean,
  onOpenChange: (open: boolean) => void,
  questionType: QuestionType,
) {
  // Tab state
  const [tabs, setTabs] = useState<TabState[]>([createEmptyTab()]);
  const [activeTabIdx, setActiveTabIdx] = useState(0);

  // Speaking API data (shared across tabs)
  const [part2Questions, setPart2Questions] = useState<{ id: string; question_code: string; topic: string }[]>([]);
  const [isLoadingSpeakingData, setIsLoadingSpeakingData] = useState(false);

  // Speaking card expansion
  const [expandedSpeakingCards, setExpandedSpeakingCards] = useState<Set<string>>(new Set());

  // Active tab shorthand
  const tab = tabs[activeTabIdx] || tabs[0];

  // Update active tab state
  const updateTab = useCallback((updates: Partial<TabState>) => {
    setTabs((prev) => prev.map((t, i) => (i === activeTabIdx ? { ...t, ...updates } : t)));
  }, [activeTabIdx]);

  // Speaking data load (Part 2 questions for Part 3 linking)
  useEffect(() => {
    if (open && questionType === "speaking" && part2Questions.length === 0) {
      setIsLoadingSpeakingData(true);
      api.get<{ questions: { id: string; question_code: string; topic: string }[] }>("/api/speaking/part2-questions")
        .then((p2Res) => {
          setPart2Questions(p2Res.data?.questions || []);
        })
        .catch(() => toast.error("Failed to load speaking data"))
        .finally(() => setIsLoadingSpeakingData(false));
    }
  }, [open, questionType, part2Questions.length]);

  // Reset on close
  const resetAll = useCallback(() => {
    setTabs([createEmptyTab()]);
    setActiveTabIdx(0);
  }, []);

  const handlePanelClose = useCallback(() => {
    const unsaved = tabs.filter((t) => t.selectedFormat && !t.saved);
    if (unsaved.length > 0) {
      toast.warning(`저장되지 않은 문제가 ${unsaved.length}개 있습니다. 닫으시겠습니까?`, {
        id: "close-warning",
        actionButtonStyle: { backgroundColor: "hsl(0 84% 60%)", color: "white" },
        action: {
          label: "닫기",
          onClick: () => {
            resetAll();
            onOpenChange(false);
          },
        },
        cancel: { label: "취소", onClick: () => {} },
      });
    } else {
      resetAll();
      onOpenChange(false);
    }
  }, [tabs, resetAll, onOpenChange]);

  // Add new tab
  const addTab = () => {
    const newTab = createEmptyTab();
    setTabs((prev) => [...prev, newTab]);
    setActiveTabIdx(tabs.length);
  };

  // Remove tab
  const removeTab = (idx: number) => {
    if (tabs.length <= 1) return;
    const t = tabs[idx];
    if (t.selectedFormat && !t.saved) {
      toast.warning("이 탭의 내용이 저장되지 않았습니다. 삭제하시겠습니까?", {
        id: "remove-tab-warning",
        actionButtonStyle: { backgroundColor: "hsl(0 84% 60%)", color: "white" },
        action: {
          label: "삭제",
          onClick: () => {
            setTabs((prev) => prev.filter((_, i) => i !== idx));
            setActiveTabIdx((prev) => (prev >= idx ? Math.max(0, prev - 1) : prev));
          },
        },
        cancel: { label: "취소", onClick: () => {} },
      });
    } else {
      setTabs((prev) => prev.filter((_, i) => i !== idx));
      setActiveTabIdx((prev) => (prev >= idx ? Math.max(0, prev - 1) : prev));
    }
  };

  // ─── MCQ helpers ──────────────────────────────────────────

  const addMcqOption = () => {
    const nextLabel = String.fromCharCode(65 + tab.mcqOptions.length);
    updateTab({ mcqOptions: [...tab.mcqOptions, { id: genId(), label: nextLabel, text: "", isCorrect: false }] });
  };

  const removeMcqOption = (id: string) => {
    if (tab.mcqOptions.length <= 2) return;
    const filtered = tab.mcqOptions.filter((o) => o.id !== id);
    const relabeled = filtered.map((o, i) => ({ ...o, label: String.fromCharCode(65 + i) }));
    const newMax = tab.mcqMaxSelections > relabeled.length ? Math.max(2, relabeled.length) : tab.mcqMaxSelections;
    updateTab({ mcqOptions: relabeled, mcqMaxSelections: newMax });
  };

  const updateMcqOption = (id: string, data: Partial<MCQOptionItem>) => {
    updateTab({ mcqOptions: tab.mcqOptions.map((o) => (o.id === id ? { ...o, ...data } : o)) });
  };

  const toggleMcqMode = (isMultiple: boolean) => {
    const hasData = tab.mcqQuestion.trim() || tab.mcqOptions.some((o) => o.text.trim() || o.isCorrect);
    if (hasData) {
      updateTab({
        mcqIsMultiple: isMultiple,
        mcqQuestion: "",
        mcqOptions: [
          { id: "a", label: "A", text: "", isCorrect: false },
          { id: "b", label: "B", text: "", isCorrect: false },
          { id: "c", label: "C", text: "", isCorrect: false },
          { id: "d", label: "D", text: "", isCorrect: false },
        ],
        mcqMaxSelections: 2,
      });
      toast.info("선택 방식이 변경되어 입력 내용이 초기화되었습니다.");
    } else {
      updateTab({ mcqIsMultiple: isMultiple });
    }
  };

  const correctCount = tab.mcqOptions.filter((o) => o.isCorrect).length;

  // ─── Matching helpers ─────────────────────────────────────

  const addMatchingOption = () => {
    const nextLabel = String.fromCharCode(65 + tab.matchingOptions.length);
    updateTab({ matchingOptions: [...tab.matchingOptions, { id: genId(), label: nextLabel, text: "" }] });
  };

  const removeMatchingOption = (id: string) => {
    if (tab.matchingOptions.length <= 2) return;
    const filtered = tab.matchingOptions.filter((o) => o.id !== id);
    const relabeled = filtered.map((o, i) => ({ ...o, label: String.fromCharCode(65 + i) }));
    updateTab({ matchingOptions: relabeled });
  };

  const addMatchingItem = () => {
    updateTab({
      matchingItems: [
        ...tab.matchingItems,
        { id: genId(), number: tab.matchingItems.length + 1, statement: "", correctLabel: "" },
      ],
    });
  };

  const removeMatchingItem = (id: string) => {
    if (tab.matchingItems.length <= 1) return;
    const filtered = tab.matchingItems.filter((i) => i.id !== id);
    const renumbered = filtered.map((i, idx) => ({ ...i, number: idx + 1 }));
    updateTab({ matchingItems: renumbered });
  };

  // ─── Blank helpers ────────────────────────────────────────

  const addBlank = () => {
    updateTab({ blanks: [...tab.blanks, { id: genId(), number: tab.blanks.length + 1, answer: "", alternatives: "" }] });
  };

  const removeBlank = (id: string) => {
    const filtered = tab.blanks.filter((b) => b.id !== id);
    const renumbered = filtered.map((b, i) => ({ ...b, number: i + 1 }));
    updateTab({ blanks: renumbered });
  };

  const addFlowchartBlank = () => {
    updateTab({
      flowchartBlanks: [
        ...tab.flowchartBlanks,
        { id: genId(), number: tab.flowchartBlanks.length + 1, answer: "", alternatives: "" },
      ],
    });
  };

  const removeFlowchartBlank = (id: string) => {
    const filtered = tab.flowchartBlanks.filter((b) => b.id !== id);
    const renumbered = filtered.map((b, i) => ({ ...b, number: i + 1 }));
    updateTab({ flowchartBlanks: renumbered });
  };

  const addFlowchartNode = useCallback((type: "box" | "branch") => {
    const maxRow = tab.flowchartNodes.length > 0
      ? Math.max(...tab.flowchartNodes.map(n => n.row ?? 0))
      : -1;
    if (type === "box") {
      updateTab({
        flowchartNodes: [...tab.flowchartNodes, {
          id: genId(), type: "box", content: "", row: maxRow + 1, col: 0,
        }],
      });
    } else {
      updateTab({
        flowchartNodes: [...tab.flowchartNodes,
          { id: genId(), type: "branch", content: "", row: maxRow + 1, col: 0 },
          { id: genId(), type: "branch", content: "", row: maxRow + 1, col: 1 },
        ],
      });
    }
  }, [tab.flowchartNodes, updateTab]);

  // ─── Map labeling helpers ─────────────────────────────────

  const addMapItem = () => {
    updateTab({
      mapItems: [
        ...tab.mapItems,
        { id: genId(), number: tab.mapItems.length + 1, statement: "", correctLabel: "" },
      ],
    });
  };

  const removeMapItem = (id: string) => {
    if (tab.mapItems.length <= 1) return;
    const filtered = tab.mapItems.filter((i) => i.id !== id);
    const renumbered = filtered.map((i, idx) => ({ ...i, number: idx + 1 }));
    updateTab({ mapItems: renumbered });
  };

  const handleMapLabelCountChange = (count: number) => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const newLabels = Array.from({ length: count }, (_, i) => alphabet[i]);
    updateTab({
      mapLabels: newLabels,
      mapItems: tab.mapItems.map((item) =>
        !newLabels.includes(item.correctLabel) ? { ...item, correctLabel: "" } : item
      ),
    });
  };

  // ─── Speaking card helpers ────────────────────────────────

  const toggleSpeakingCard = (id: string) => {
    setExpandedSpeakingCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return {
    tabs, activeTabIdx, setActiveTabIdx, tab, updateTab,
    part2Questions, isLoadingSpeakingData,
    expandedSpeakingCards, setExpandedSpeakingCards,
    resetAll, handlePanelClose, addTab, removeTab,
    // MCQ
    addMcqOption, removeMcqOption, updateMcqOption, toggleMcqMode, correctCount,
    // Matching
    addMatchingOption, removeMatchingOption, addMatchingItem, removeMatchingItem,
    // Blanks
    addBlank, removeBlank, addFlowchartBlank, removeFlowchartBlank, addFlowchartNode,
    // Map
    addMapItem, removeMapItem, handleMapLabelCountChange,
    // Speaking
    toggleSpeakingCard,
    createSpeakingSubQuestion,
  };
}

export type ModalForm = ReturnType<typeof useModalForm>;
