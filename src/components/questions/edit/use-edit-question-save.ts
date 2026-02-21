"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { uploadEditorImages } from "@/components/ui/rich-text-editor";
import { uploadFile } from "@/components/ui/file-upload";
import { api } from "@/lib/api/client";
import type { EditQuestionForm } from "./use-edit-question-form";

export function useEditQuestionSave(id: string, form: EditQuestionForm) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // ==========================================================================
  // 저장 핸들러
  // ==========================================================================
  const handleSave = async () => {
    const { selectedQuestionType, selectedFormat } = form;

    if (!selectedQuestionType || !selectedFormat) {
      toast.error("문제 유형이 필요합니다.");
      return;
    }

    // MCQ 유효성 검사
    if (selectedFormat === "mcq") {
      const emptyOptions = form.mcqOptions.filter(o => !o.text.trim());
      if (emptyOptions.length > 0) {
        toast.error("모든 선택지를 입력해주세요.");
        return;
      }
      const correctCount = form.mcqOptions.filter(o => o.isCorrect).length;
      if (correctCount === 0) {
        toast.error("정답을 선택해주세요.");
        return;
      }
      if (form.mcqIsMultiple && correctCount !== form.mcqMaxSelections) {
        toast.error(`복수선택 개수(${form.mcqMaxSelections}개)만큼 정답을 선택해주세요.`);
        return;
      }
      if (!form.mcqQuestion.trim()) {
        toast.error("문제를 입력해주세요.");
        return;
      }
    }

    // T/F/NG & Y/N/NG 유효성 검사
    if (selectedFormat === "true_false_ng" || selectedFormat === "yes_no_ng") {
      if (!form.tfngStatement.trim()) {
        toast.error("진술문을 입력해주세요.");
        return;
      }
    }

    // 매칭 유효성 검사
    if (selectedFormat === "matching") {
      if (!form.contentHtml.trim()) {
        toast.error("지문을 입력하세요.");
        return;
      }
      const emptyOptions = form.matchingOptions.filter(o => !o.text.trim());
      if (emptyOptions.length > 0) {
        const labels = emptyOptions.map(o => o.label).join(", ");
        toast.error(`제목 ${labels}의 텍스트를 입력하세요.`);
        return;
      }
      // 지문에서 섹션 번호 파싱
      const sectionText = form.contentHtml.replace(/<[^>]*>/g, "");
      const sectionNums: number[] = [];
      const sectionRe = /\[(\d+)\]/g;
      let sm;
      while ((sm = sectionRe.exec(sectionText)) !== null) sectionNums.push(parseInt(sm[1]));
      const uniqueSections = [...new Set(sectionNums)];
      if (uniqueSections.length === 0) {
        toast.error("지문에 섹션 마커 [1], [2] 등을 추가하세요.");
        return;
      }
      const assignedSections = new Set(form.matchingItems.map(i => i.number));
      const unassigned = uniqueSections.filter(n => !assignedSections.has(n));
      if (unassigned.length > 0) {
        toast.error(`섹션 [${unassigned.join("], [")}]에 정답 제목을 지정하세요.`);
        return;
      }
    }

    // 빈칸채우기 유효성 검사
    if (selectedFormat === "fill_blank_typing" || selectedFormat === "fill_blank_drag") {
      if (!form.contentHtml.trim()) {
        toast.error("지문을 입력해주세요.");
        return;
      }
      if (form.blanks.length === 0) {
        toast.error("빈칸을 추가해주세요.");
        return;
      }
      const emptyBlanks = form.blanks.filter(b => !b.answer.trim());
      if (emptyBlanks.length > 0) {
        toast.error("모든 빈칸의 정답을 입력해주세요.");
        return;
      }
    }

    // 플로우차트 유효성 검사
    if (selectedFormat === "flowchart") {
      if (!form.flowchartTitle.trim()) {
        toast.error("플로우차트 제목을 입력해주세요.");
        return;
      }
    }

    // Writing(에세이) 유효성 검사
    if (selectedFormat === "essay") {
      if (!form.writingMinWords.trim()) {
        toast.error("최소 단어 수를 입력해주세요.");
        return;
      }
      if (!form.writingPrompt.trim()) {
        toast.error("작문 프롬프트를 입력해주세요.");
        return;
      }
    }

    // Speaking 유효성 검사
    if (selectedFormat === "speaking_part1" || selectedFormat === "speaking_part3") {
      const filledQs = form.speakingQuestions.filter(q => q.text.trim());
      if (filledQs.length === 0) {
        toast.error("최소 1개의 질문을 입력해주세요.");
        return;
      }
    }

    if (selectedFormat === "speaking_part2") {
      if (!form.cueCardTopic.trim()) {
        toast.error("큐카드 주제를 입력해주세요.");
        return;
      }
    }

    // 단답형 유효성 검사
    if (selectedFormat === "short_answer") {
      if (!form.shortAnswerQuestion.trim()) {
        toast.error("질문을 입력해주세요.");
        return;
      }
      if (!form.shortAnswerAnswer.trim()) {
        toast.error("정답을 입력해주세요.");
        return;
      }
    }

    // 테이블 완성하기 유효성 검사
    if (selectedFormat === "table_completion") {
      if (!form.contentHtml.trim()) {
        toast.error("테이블 지문을 입력해주세요.");
        return;
      }
      if (form.blanks.length === 0) {
        toast.error("빈칸을 추가해주세요.");
        return;
      }
      const emptyBlanks = form.blanks.filter(b => !b.answer.trim());
      if (emptyBlanks.length > 0) {
        toast.error("모든 빈칸의 정답을 입력해주세요.");
        return;
      }
    }

    // Map Labeling 유효성 검사
    if (selectedFormat === "map_labeling") {
      if (form.mapLabelingItems.length === 0) {
        toast.error("문제 항목을 추가해주세요.");
        return;
      }
      const emptyItems = form.mapLabelingItems.filter(i => !i.statement.trim() || !i.correctLabel);
      if (emptyItems.length > 0) {
        toast.error("모든 문제 항목과 정답 라벨을 입력해주세요.");
        return;
      }
    }

    setIsSaving(true);
    try {
      // 에디터 이미지 업로드 (blob URL → R2 상대 경로, 저장 전 처리)
      const imgCtx = form.questionCode ? `questions/${form.questionCode}` : "questions";
      const processedWritingPrompt = form.writingPrompt.includes("blob:")
        ? await uploadEditorImages(form.writingPrompt, imgCtx) : form.writingPrompt;
      const processedCueCardTopic = form.cueCardTopic.includes("blob:")
        ? await uploadEditorImages(form.cueCardTopic, imgCtx) : form.cueCardTopic;
      const processedMapPassage = form.mapLabelingPassage.includes("blob:")
        ? await uploadEditorImages(form.mapLabelingPassage, imgCtx) : form.mapLabelingPassage;

      // Build question content based on format
      let content = "";
      let optionsData = null;
      let answerData = null;
      let modelAnswers = null;
      // 실제 저장할 format (MCQ의 경우 isMultiple에 따라 결정)
      let actualFormat: string = selectedFormat;

      // Fill blank
      if (selectedFormat === "fill_blank_typing" || selectedFormat === "fill_blank_drag") {
        content = form.contentHtml;
        answerData = {
          blanks: form.blanks.map(b => ({
            number: b.number,
            answer: b.answer,
            alternatives: b.alternatives || [],
          })),
        };
        optionsData = {
          blank_mode: form.blankMode,
          ...(selectedFormat === "fill_blank_drag" ? { word_bank: form.wordBank, allow_duplicate: form.fillBlankDragAllowDuplicate, bank_label: form.bankLabel, bank_layout: form.bankLayout } : {}),
        };
      }
      // MCQ (통합: 단일/복수)
      else if (selectedFormat === "mcq") {
        // 저장 시 isMultiple에 따라 실제 format 결정
        actualFormat = form.mcqIsMultiple ? "mcq_multiple" : "mcq_single";
        content = form.mcqQuestion;
        optionsData = {
          isMultiple: form.mcqIsMultiple,
          ...(form.mcqIsMultiple ? { maxSelections: form.mcqMaxSelections } : {}),
          displayMode: form.mcqDisplayAlphabet ? "alphabet" : "default",
          options: form.mcqOptions.map(o => ({
            label: o.label,
            text: o.text,
            isCorrect: o.isCorrect,
          })),
        };
        if (form.mcqIsMultiple) {
          const correctOptions = form.mcqOptions.filter(o => o.isCorrect);
          answerData = { correct: correctOptions.map(o => o.label) };
        } else {
          const correctOption = form.mcqOptions.find(o => o.isCorrect);
          answerData = { correct: correctOption?.label || "" };
        }
      }
      // T/F/NG & Y/N/NG
      else if (selectedFormat === "true_false_ng" || selectedFormat === "yes_no_ng") {
        content = form.tfngStatement;
        answerData = {
          answer: form.tfngAnswer,
        };
      }
      // 매칭
      else if (selectedFormat === "matching") {
        content = form.contentHtml;
        optionsData = {
          title: form.matchingTitle || null,
          allowDuplicate: form.matchingAllowDuplicate,
          options: form.matchingOptions.map(o => ({
            label: o.label,
            text: o.text,
          })),
          items: form.matchingItems.map(i => ({
            number: i.number,
            statement: i.statement,
            correctLabel: i.correctLabel,
          })),
        };
        answerData = {
          matches: form.matchingItems.map(i => ({ number: i.number, correctLabel: i.correctLabel })),
        };
      }
      // Flowchart
      else if (selectedFormat === "flowchart") {
        content = JSON.stringify({ title: form.flowchartTitle, nodes: form.flowchartNodes });
        answerData = {
          blanks: form.flowchartBlanks.map(b => ({
            number: b.number,
            answer: b.answer,
            alternatives: b.alternatives || [],
          })),
        };
      }
      // Short Answer
      else if (selectedFormat === "short_answer") {
        content = form.shortAnswerQuestion;
        answerData = {
          answer: form.shortAnswerAnswer,
          alternatives: form.shortAnswerAlternatives.filter(Boolean),
        };
      }
      // Table Completion
      else if (selectedFormat === "table_completion") {
        content = form.contentHtml;
        optionsData = {
          title: form.contentTitle || undefined,
          blank_mode: form.blankMode,
          input_mode: form.tableInputMode,
          ...(form.tableInputMode === "drag" ? { word_bank: form.wordBank } : {}),
        };
        answerData = {
          blanks: form.blanks.map(b => ({
            number: b.number,
            answer: b.answer,
            alternatives: b.alternatives || [],
          })),
        };
      }
      // Writing
      else if (selectedFormat === "essay") {
        content = processedWritingPrompt;
        optionsData = {
          title: form.writingTitle || null,
          condition: form.writingCondition || null,
          min_words: form.writingMinWords ? parseInt(form.writingMinWords) : null,
        };
      }
      // Speaking Part 1
      else if (selectedFormat === "speaking_part1") {
        const filledQuestions = form.speakingQuestions.filter(q => q.text.trim());
        content = filledQuestions[0]?.text || "";
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
      // Speaking Part 2
      else if (selectedFormat === "speaking_part2") {
        content = JSON.stringify({
          topic: processedCueCardTopic,
          points: form.cueCardPoints.filter(p => p.trim()),
        });
        optionsData = {
          generate_followup: form.generateFollowup,
        };
      }
      // Speaking Part 3
      else if (selectedFormat === "speaking_part3") {
        const filledQuestions = form.speakingQuestions.filter(q => q.text.trim());
        content = filledQuestions[0]?.text || "";
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
      // Map Labeling
      else if (selectedFormat === "map_labeling") {
        content = processedMapPassage || " ";
        optionsData = {
          title: form.mapLabelingTitle || undefined,
          labels: form.mapLabelingLabels,
          items: form.mapLabelingItems.map(i => ({
            number: i.number,
            statement: i.statement,
            correctLabel: i.correctLabel,
          })),
        };
        answerData = {
          items: form.mapLabelingItems.map(i => ({
            number: i.number,
            correctLabel: i.correctLabel,
          })),
        };
      }

      // separateNumbers를 multi-item 유형에 공통 추가
      if ([
        "true_false_ng", "yes_no_ng", "matching", "heading_matching",
        "fill_blank_typing", "fill_blank_drag",
        "flowchart", "table_completion", "map_labeling",
      ].includes(selectedFormat!) || (selectedFormat === "mcq" && form.mcqIsMultiple)) {
        optionsData = { ...optionsData, separateNumbers: form.separateNumbers };
      }

      const questionData = {
        question_type: selectedQuestionType,
        question_format: actualFormat,
        content,
        title: form.contentTitle || form.flowchartTitle || form.mapLabelingTitle || null,
        instructions: (selectedFormat !== "mcq" && selectedFormat !== "true_false_ng" && selectedFormat !== "yes_no_ng") ? (form.instructions || null) : null,
        options_data: optionsData,
        answer_data: answerData,
        model_answers: modelAnswers,
        generate_followup: form.generateFollowup,
        is_practice: form.isPractice,
        tags: (selectedFormat !== "mcq" && selectedFormat !== "true_false_ng" && selectedFormat !== "yes_no_ng") && form.tags ? form.tags.split(",").map(t => t.trim()) : null,
        // Audio fields (Listening & Speaking Part 2)
        audio_url: (selectedQuestionType === "listening" || selectedFormat === "speaking_part2") && form.audioUrl ? form.audioUrl : null,
        audio_transcript: (selectedQuestionType === "listening" || selectedFormat === "speaking_part2") && form.audioTranscript ? form.audioTranscript : null,
        // Speaking fields
        speaking_category: null,
        related_part2_id: null,
        depth_level: null,
        target_band_min: null,
        target_band_max: null,
      };

      const { error } = await api.put(`/api/questions/${id}`, questionData);

      if (error) {
        throw new Error(error);
      }

      // Per-sub-question audio upload for speaking Part 1/3
      if (selectedFormat === "speaking_part1" || selectedFormat === "speaking_part3") {
        const filledQuestions = form.speakingQuestions.filter(q => q.text.trim());
        const audioUploads = filledQuestions
          .map((q, i) => ({ index: i, file: q.audioFile }))
          .filter((u): u is { index: number; file: File } => u.file !== null);

        if (audioUploads.length > 0) {
          const currentOptionsData = questionData.options_data as any;
          const updatedQuestions = [...(currentOptionsData?.questions || [])];
          for (const upload of audioUploads) {
            try {
              const result = await uploadFile(upload.file, "audio", `questions/${id}`);
              if (updatedQuestions[upload.index]) {
                updatedQuestions[upload.index] = { ...updatedQuestions[upload.index], audio_url: result.path };
              }
            } catch (e) {
              console.error(`Failed to upload audio for sub-question ${upload.index}:`, e);
            }
          }
          await api.put(`/api/questions/${id}`, {
            ...questionData,
            options_data: { ...currentOptionsData, questions: updatedQuestions },
          });
        }
      }

      toast.success("문제가 수정되었습니다.");
      router.push("/questions");
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error(
        error instanceof Error ? error.message : "문제 수정에 실패했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================================================
  // 삭제 핸들러
  // ==========================================================================
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await api.delete(`/api/questions/${id}`);

      if (error) {
        throw new Error(error);
      }

      toast.success("문제가 삭제되었습니다.");
      router.push("/questions");
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("문제 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return {
    isSaving,
    isDeleting,
    showDeleteDialog,
    setShowDeleteDialog,
    handleSave,
    handleDelete,
  };
}
