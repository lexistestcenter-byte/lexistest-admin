"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { uploadEditorImages, stripBlobImages } from "@/components/ui/rich-text-editor";
import { uploadFile } from "@/components/ui/file-upload";
import type { QuestionType } from "@/components/questions/types";
import type { ModalForm } from "./use-modal-form";

export function useModalSave(
  form: ModalForm,
  questionType: QuestionType,
  onCreated: (questionId: string) => void,
) {
  const [isSaving, setIsSaving] = useState(false);
  const { tab, updateTab } = form;

  const handleSave = async () => {
    if (!tab.selectedFormat) return;

    let actualFormat: string = tab.selectedFormat;
    let content = "";
    let optionsData: Record<string, unknown> = {};
    let answerData: Record<string, unknown> = {};
    let title: string | undefined;

    // Build payload per format
    if (tab.selectedFormat === "mcq") {
      if (!tab.mcqQuestion.trim()) { toast.error("문제를 입력해주세요."); return; }
      const hasCorrect = tab.mcqOptions.some((o) => o.isCorrect);
      if (!hasCorrect) { toast.error("정답을 하나 이상 선택해주세요."); return; }
      actualFormat = tab.mcqIsMultiple ? "mcq_multiple" : "mcq_single";
      content = tab.mcqQuestion;
      optionsData = {
        isMultiple: tab.mcqIsMultiple,
        maxSelections: tab.mcqIsMultiple ? tab.mcqMaxSelections : undefined,
        separateNumbers: tab.mcqIsMultiple ? tab.mcqSeparateNumbers : undefined,
        options: tab.mcqOptions.map((o) => ({ label: o.label, text: o.text, isCorrect: o.isCorrect })),
      };
      if (tab.mcqIsMultiple) {
        const correctOptions = tab.mcqOptions.filter((o) => o.isCorrect);
        answerData = { correct: correctOptions.map((o) => o.label) };
      } else {
        const correctOption = tab.mcqOptions.find((o) => o.isCorrect);
        answerData = { correct: correctOption?.label || "" };
      }
    } else if (tab.selectedFormat === "true_false_ng") {
      if (!tab.tfngStatement.trim()) { toast.error("진술문을 입력해주세요."); return; }
      content = tab.tfngStatement;
      optionsData = { separateNumbers: tab.separateNumbers };
      answerData = { answer: tab.tfngAnswer };
    } else if (tab.selectedFormat === "matching") {
      if (tab.matchingOptions.length < 2) { toast.error("보기를 2개 이상 추가해주세요."); return; }
      if (tab.matchingItems.length < 1) { toast.error("문항을 1개 이상 추가해주세요."); return; }
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
      if (!tab.fillContent.trim()) { toast.error("본문을 입력해주세요."); return; }
      if (tab.blanks.length === 0) { toast.error("빈칸을 1개 이상 추가해주세요."); return; }
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
      if (!tab.fillContent.trim()) { toast.error("테이블 내용을 입력해주세요."); return; }
      if (tab.blanks.length === 0) { toast.error("빈칸을 1개 이상 추가해주세요."); return; }
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
      if (tab.flowchartNodes.length === 0) { toast.error("노드를 1개 이상 추가해주세요."); return; }
      if (tab.flowchartBlanks.length === 0) { toast.error("빈칸을 1개 이상 추가해주세요."); return; }
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
      if (tab.mapItems.length === 0) { toast.error("문항을 1개 이상 추가해주세요."); return; }
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
      if (!tab.essayPrompt.trim()) { toast.error("에세이 주제를 입력해주세요."); return; }
      content = stripBlobImages(tab.essayPrompt);
      title = tab.essayTitle || undefined;
      optionsData = {
        title: tab.essayTitle || undefined,
        condition: tab.essayCondition || undefined,
        min_words: tab.essayMinWords ? parseInt(tab.essayMinWords) : undefined,
      };
    } else if (tab.selectedFormat === "speaking_part1") {
      const filledQuestions = tab.speakingQuestions.filter((q) => q.text.trim());
      if (filledQuestions.length === 0) { toast.error("Please enter at least one question."); return; }
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
      if (!tab.cueCardTopic.trim()) { toast.error("Please enter a cue card topic."); return; }
      content = JSON.stringify({
        topic: stripBlobImages(tab.cueCardTopic),
        points: tab.cueCardPoints.filter((p) => p.trim()),
      });
      optionsData = {
        generate_followup: tab.generateFollowup,
      };
    } else if (tab.selectedFormat === "speaking_part3") {
      const filledQuestions = tab.speakingQuestions.filter((q) => q.text.trim());
      if (filledQuestions.length === 0) { toast.error("Please enter at least one question."); return; }
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

    setIsSaving(true);
    try {
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
        // Speaking options_data params (migration 016) — Part 2 only
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

        // Audio file upload
        if (tab.audioFile) {
          try {
            const uploaded = await uploadFile(tab.audioFile, "audio", context);
            updatePayload.audio_url = uploaded.path;
          } catch {
            toast.error("오디오 업로드에 실패했습니다. 상세 페이지에서 다시 저장해주세요.");
          }
        }

        // 에디터 이미지 업로드 (blob URL → R2 상대 경로)
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

        // Per-sub-question audio upload for Part 1 / Part 3
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

      toast.success("Question created successfully.");
      updateTab({ saved: true, savedQuestionId: data.id });
      onCreated(data.id);
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return { isSaving, handleSave };
}
