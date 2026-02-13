"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { uploadEditorImages, stripBlobImages } from "@/components/ui/rich-text-editor";
import { uploadFile } from "@/components/ui/file-upload";
import type { QuestionType } from "@/components/questions/types";
import type { TabState } from "../types";
import type { ModalForm } from "./use-modal-form";

interface TabPayload {
  actualFormat: string;
  content: string;
  title?: string;
  optionsData: Record<string, unknown>;
  answerData: Record<string, unknown>;
}

/** Validate a single tab and return error message or null */
function validateTab(tab: TabState): string | null {
  if (!tab.selectedFormat) return "형태가 선택되지 않았습니다.";

  if (tab.selectedFormat === "mcq") {
    if (!tab.mcqQuestion.trim()) return "문제를 입력해주세요.";
    if (!tab.mcqOptions.some((o) => o.isCorrect)) return "정답을 하나 이상 선택해주세요.";
  } else if (tab.selectedFormat === "true_false_ng") {
    if (!tab.tfngStatement.trim()) return "진술문을 입력해주세요.";
  } else if (tab.selectedFormat === "matching") {
    if (tab.matchingOptions.length < 2) return "보기를 2개 이상 추가해주세요.";
    if (tab.matchingItems.length < 1) return "문항을 1개 이상 추가해주세요.";
  } else if (tab.selectedFormat === "fill_blank_typing" || tab.selectedFormat === "fill_blank_drag") {
    if (!tab.fillContent.trim()) return "본문을 입력해주세요.";
    if (tab.blanks.length === 0) return "빈칸을 1개 이상 추가해주세요.";
  } else if (tab.selectedFormat === "table_completion") {
    if (!tab.fillContent.trim()) return "테이블 내용을 입력해주세요.";
    if (tab.blanks.length === 0) return "빈칸을 1개 이상 추가해주세요.";
  } else if (tab.selectedFormat === "flowchart") {
    if (tab.flowchartNodes.length === 0) return "노드를 1개 이상 추가해주세요.";
    if (tab.flowchartBlanks.length === 0) return "빈칸을 1개 이상 추가해주세요.";
  } else if (tab.selectedFormat === "map_labeling") {
    if (tab.mapItems.length === 0) return "문항을 1개 이상 추가해주세요.";
  } else if (tab.selectedFormat === "essay") {
    if (!tab.essayPrompt.trim()) return "에세이 주제를 입력해주세요.";
  } else if (tab.selectedFormat === "speaking_part1" || tab.selectedFormat === "speaking_part3") {
    if (tab.speakingQuestions.filter((q) => q.text.trim()).length === 0)
      return "Please enter at least one question.";
  } else if (tab.selectedFormat === "speaking_part2") {
    if (!tab.cueCardTopic.trim()) return "Please enter a cue card topic.";
  }
  return null;
}

/** Build payload from a single tab */
function buildPayload(tab: TabState): TabPayload {
  let actualFormat: string = tab.selectedFormat!;
  let content = "";
  let optionsData: Record<string, unknown> = {};
  let answerData: Record<string, unknown> = {};
  let title: string | undefined;

  if (tab.selectedFormat === "mcq") {
    actualFormat = tab.mcqIsMultiple ? "mcq_multiple" : "mcq_single";
    content = tab.mcqQuestion;
    optionsData = {
      isMultiple: tab.mcqIsMultiple,
      maxSelections: tab.mcqIsMultiple ? tab.mcqMaxSelections : undefined,
      separateNumbers: tab.mcqIsMultiple ? tab.mcqSeparateNumbers : undefined,
      displayMode: tab.mcqDisplayAlphabet ? "alphabet" : "default",
      options: tab.mcqOptions.map((o) => ({ label: o.label, text: o.text, isCorrect: o.isCorrect })),
    };
    if (tab.mcqIsMultiple) {
      answerData = { correct: tab.mcqOptions.filter((o) => o.isCorrect).map((o) => o.label) };
    } else {
      answerData = { correct: tab.mcqOptions.find((o) => o.isCorrect)?.label || "" };
    }
  } else if (tab.selectedFormat === "true_false_ng") {
    content = tab.tfngStatement;
    optionsData = { separateNumbers: tab.separateNumbers };
    answerData = { answer: tab.tfngAnswer };
  } else if (tab.selectedFormat === "matching") {
    content = tab.matchingContent;
    title = tab.matchingTitle || undefined;
    optionsData = {
      title: tab.matchingTitle || undefined,
      separateNumbers: tab.separateNumbers,
      allowDuplicate: tab.matchingAllowDuplicate,
      options: tab.matchingOptions.map((o) => ({ label: o.label, text: o.text })),
      items: tab.matchingItems.map((i) => ({ number: i.number, statement: i.statement, correctLabel: i.correctLabel })),
    };
    answerData = {
      matches: tab.matchingItems.map((i) => ({ number: i.number, correctLabel: i.correctLabel })),
    };
  } else if (tab.selectedFormat === "fill_blank_typing" || tab.selectedFormat === "fill_blank_drag") {
    content = tab.fillContent;
    title = tab.fillTitle || undefined;
    optionsData = {
      title: tab.fillTitle || undefined,
      separateNumbers: tab.separateNumbers,
      blank_mode: tab.blankMode,
      ...(tab.selectedFormat === "fill_blank_drag" ? { word_bank: tab.wordBank, allow_duplicate: tab.fillBlankDragAllowDuplicate } : {}),
    };
    answerData = {
      blanks: tab.blanks.map((b) => ({
        number: b.number,
        answer: b.answer,
        alternatives: b.alternatives ? b.alternatives.split(",").map((s) => s.trim()).filter(Boolean) : [],
      })),
    };
  } else if (tab.selectedFormat === "table_completion") {
    content = tab.fillContent;
    title = tab.fillTitle || undefined;
    optionsData = {
      title: tab.fillTitle || undefined,
      separateNumbers: tab.separateNumbers,
      blank_mode: tab.blankMode,
      input_mode: tab.tableInputMode,
      ...(tab.tableInputMode === "drag" ? { word_bank: tab.wordBank } : {}),
    };
    answerData = {
      blanks: tab.blanks.map((b) => ({
        number: b.number,
        answer: b.answer,
        alternatives: b.alternatives ? b.alternatives.split(",").map((s) => s.trim()).filter(Boolean) : [],
      })),
    };
  } else if (tab.selectedFormat === "flowchart") {
    const nodes = tab.flowchartNodes.map(n => ({
      id: n.id, type: n.type, content: n.content, row: n.row, col: n.col, label: n.label,
    }));
    content = JSON.stringify({ title: tab.flowchartTitle, nodes });
    title = tab.flowchartTitle || undefined;
    optionsData = { separateNumbers: tab.separateNumbers };
    answerData = {
      blanks: tab.flowchartBlanks.map((b) => ({
        number: b.number,
        answer: b.answer,
        alternatives: b.alternatives ? b.alternatives.split(",").map((s) => s.trim()).filter(Boolean) : [],
      })),
    };
  } else if (tab.selectedFormat === "map_labeling") {
    content = stripBlobImages(tab.mapPassage) || " ";
    title = tab.mapTitle || undefined;
    optionsData = {
      title: tab.mapTitle || undefined,
      separateNumbers: tab.separateNumbers,
      labels: tab.mapLabels,
      items: tab.mapItems.map((i) => ({ number: i.number, statement: i.statement, correctLabel: i.correctLabel })),
    };
    answerData = {
      items: tab.mapItems.map((i) => ({ number: i.number, correctLabel: i.correctLabel })),
    };
  } else if (tab.selectedFormat === "essay") {
    content = stripBlobImages(tab.essayPrompt);
    title = tab.essayTitle || undefined;
    optionsData = {
      title: tab.essayTitle || undefined,
      condition: tab.essayCondition || undefined,
      min_words: tab.essayMinWords ? parseInt(tab.essayMinWords) : undefined,
    };
  } else if (tab.selectedFormat === "speaking_part1") {
    const filledQuestions = tab.speakingQuestions.filter((q) => q.text.trim());
    content = filledQuestions[0].text;
    optionsData = {
      questions: filledQuestions.map((q, i) => ({
        number: i + 1,
        text: q.text,
        time_limit_seconds: q.timeLimitSeconds ? parseInt(q.timeLimitSeconds) : 30,
        allow_response_reset: q.allowResponseReset,
        audio_url: q.audioUrl && !q.audioFile ? q.audioUrl : undefined,
      })),
    };
  } else if (tab.selectedFormat === "speaking_part2") {
    content = JSON.stringify({
      topic: stripBlobImages(tab.cueCardTopic),
      points: tab.cueCardPoints.filter((p) => p.trim()),
    });
    optionsData = {
      generate_followup: tab.generateFollowup,
    };
  } else if (tab.selectedFormat === "speaking_part3") {
    const filledQuestions = tab.speakingQuestions.filter((q) => q.text.trim());
    content = filledQuestions[0].text;
    optionsData = {
      questions: filledQuestions.map((q, i) => ({
        number: i + 1,
        text: q.text,
        time_limit_seconds: q.timeLimitSeconds ? parseInt(q.timeLimitSeconds) : 30,
        allow_response_reset: q.allowResponseReset,
        audio_url: q.audioUrl && !q.audioFile ? q.audioUrl : undefined,
      })),
    };
  }

  return { actualFormat, content, title, optionsData, answerData };
}

export function useModalSave(
  form: ModalForm,
  questionType: QuestionType,
  onCreated: (questionId: string) => void,
) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 });

  const unsavedCount = form.tabs.filter((t) => t.selectedFormat && !t.saved).length;

  /** Save a single tab by index */
  const saveSingleTab = async (tab: TabState, tabIdx: number): Promise<boolean> => {
    const { actualFormat, content, title, optionsData, answerData } = buildPayload(tab);

    const payload: Record<string, unknown> = {
      question_type: questionType,
      question_format: actualFormat,
      content,
      title,
      instructions: (tab.selectedFormat !== "mcq" && tab.selectedFormat !== "true_false_ng") ? tab.instructions || undefined : undefined,
      options_data: Object.keys(optionsData).length > 0 ? optionsData : undefined,
      answer_data: Object.keys(answerData).length > 0 ? answerData : undefined,
      is_practice: tab.isPractice,
      audio_url: (questionType === "listening" || tab.selectedFormat === "speaking_part2") && tab.audioUrl && !tab.audioFile ? tab.audioUrl : undefined,
      related_part2_id: tab.selectedFormat === "speaking_part3" ? tab.relatedPart2Id || undefined : undefined,
      depth_level: tab.selectedFormat === "speaking_part3" ? tab.depthLevel : undefined,
      generate_followup: tab.selectedFormat === "speaking_part2" ? tab.generateFollowup : undefined,
      time_limit_seconds: tab.selectedFormat === "speaking_part2"
        ? (tab.timeLimitSeconds ? parseInt(tab.timeLimitSeconds) : undefined) : undefined,
      allow_response_reset: tab.selectedFormat === "speaking_part2"
        ? tab.allowResponseReset : undefined,
      prep_time_seconds: tab.selectedFormat === "speaking_part2"
        ? (tab.prepTimeSeconds ? parseInt(tab.prepTimeSeconds) : 60) : undefined,
      speaking_time_seconds: tab.selectedFormat === "speaking_part2"
        ? (tab.speakingTimeSeconds ? parseInt(tab.speakingTimeSeconds) : 120) : undefined,
    };

    // Remove blob URLs from options_data
    if (payload.options_data) {
      const od = payload.options_data as Record<string, unknown>;
      if (Array.isArray(od.questions)) {
        for (const q of od.questions as Record<string, unknown>[]) {
          if (q.audio_url && typeof q.audio_url === "string" && (q.audio_url as string).startsWith("blob:")) {
            delete q.audio_url;
          }
        }
      }
    }

    const { data, error } = await api.post<{ id: string; question_code: string }>("/api/questions", payload);
    if (error || !data) throw new Error(error || "저장 실패");

    // Upload deferred files if any
    if (data.question_code) {
      const context = `questions/${data.question_code}`;
      const updatePayload: Record<string, unknown> = {};

      if (tab.audioFile) {
        try {
          const uploaded = await uploadFile(tab.audioFile, "audio", context);
          updatePayload.audio_url = uploaded.path;
        } catch {
          toast.error("오디오 업로드에 실패했습니다.");
        }
      }

      try {
        if (tab.selectedFormat === "essay" && tab.essayPrompt.includes("blob:")) {
          updatePayload.content = await uploadEditorImages(tab.essayPrompt, context);
        } else if (tab.selectedFormat === "speaking_part2" && tab.cueCardTopic.includes("blob:")) {
          const uploadedTopic = await uploadEditorImages(tab.cueCardTopic, context);
          updatePayload.content = JSON.stringify({
            topic: uploadedTopic,
            points: tab.cueCardPoints.filter((p) => p.trim()),
          });
        } else if (tab.selectedFormat === "map_labeling" && tab.mapPassage.includes("blob:")) {
          updatePayload.content = await uploadEditorImages(tab.mapPassage, context);
        }
      } catch {
        toast.error("이미지 업로드에 실패했습니다.");
      }

      if (tab.selectedFormat === "speaking_part1" || tab.selectedFormat === "speaking_part3") {
        const filledQuestions = tab.speakingQuestions.filter((q) => q.text.trim());
        const questionsWithAudio = filledQuestions.filter((q) => q.audioFile);
        if (questionsWithAudio.length > 0) {
          const existingOd = (payload.options_data || {}) as Record<string, unknown>;
          const questions = (existingOd.questions || []) as Record<string, unknown>[];
          let audioUploadFailed = false;
          for (const sq of questionsWithAudio) {
            const idx = filledQuestions.indexOf(sq);
            if (idx >= 0 && questions[idx]) {
              try {
                const uploaded = await uploadFile(sq.audioFile!, "audio", `${context}/q${idx + 1}`);
                questions[idx].audio_url = uploaded.path;
              } catch {
                audioUploadFailed = true;
              }
            }
          }
          if (audioUploadFailed) {
            toast.error("Some question audio uploads failed.");
          }
          updatePayload.options_data = { ...existingOd, questions };
        }
      }

      if (Object.keys(updatePayload).length > 0) {
        try {
          await api.put(`/api/questions/${data.id}`, updatePayload);
        } catch {
          toast.error("파일 URL 업데이트에 실패했습니다.");
        }
      }
    }

    form.updateTabByIdx(tabIdx, { saved: true, savedQuestionId: data.id });
    onCreated(data.id);
    return true;
  };

  /** Save all unsaved tabs at once */
  const handleSaveAll = async () => {
    const unsavedTabs = form.tabs
      .map((t, idx) => ({ tab: t, idx }))
      .filter(({ tab }) => tab.selectedFormat && !tab.saved);

    if (unsavedTabs.length === 0) return;

    // Validate all tabs first
    for (const { tab, idx } of unsavedTabs) {
      const error = validateTab(tab);
      if (error) {
        form.setActiveTabIdx(idx);
        toast.error(`문제 ${idx + 1}: ${error}`);
        return;
      }
    }

    // Confirmation via toast action
    toast.warning(`${unsavedTabs.length}개의 문제를 저장하시겠습니까?`, {
      action: {
        label: "저장",
        onClick: async () => {
          setIsSaving(true);
          setSaveProgress({ current: 0, total: unsavedTabs.length });

          let savedCount = 0;
          for (const { tab, idx } of unsavedTabs) {
            try {
              await saveSingleTab(tab, idx);
              savedCount++;
              setSaveProgress({ current: savedCount, total: unsavedTabs.length });
            } catch (error) {
              console.error(`Save error (tab ${idx + 1}):`, error);
              form.setActiveTabIdx(idx);
              toast.error(`문제 ${idx + 1}: ${error instanceof Error ? error.message : "저장에 실패했습니다."}`);
              break;
            }
          }

          if (savedCount === unsavedTabs.length) {
            toast.success(`${savedCount}개 문제가 저장되었습니다.`);
          } else if (savedCount > 0) {
            toast.warning(`${unsavedTabs.length}개 중 ${savedCount}개만 저장되었습니다.`);
          }

          setIsSaving(false);
          setSaveProgress({ current: 0, total: 0 });
        },
      },
      cancel: { label: "취소", onClick: () => {} },
    });
  };

  return { isSaving, saveProgress, unsavedCount, handleSaveAll };
}
