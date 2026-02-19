import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { uploadFile } from "@/components/ui/file-upload";
import { uploadEditorImages, stripBlobImages } from "@/components/ui/rich-text-editor";
import type { QuestionType } from "@/components/questions/types";
import type { QuestionTab } from "./types";

export function useQuestionSave(
  tabs: QuestionTab[],
  setTabs: React.Dispatch<React.SetStateAction<QuestionTab[]>>,
  setActiveTabIndex: (index: number) => void,
  selectedQuestionType: QuestionType | null,
) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // ==========================================================================
  // 유효성 검사
  // ==========================================================================
  const validateTab = (tab: QuestionTab, index: number): { valid: boolean; message: string } => {
    const format = tab.format;

    if (!format) {
      return { valid: false, message: `탭 ${index + 1}: 문제 형태를 선택하세요.` };
    }

    // MCQ 검증
    if (format === "mcq") {
      if (!tab.mcqQuestion.trim()) {
        return { valid: false, message: `탭 ${index + 1}: 문제를 입력하세요.` };
      }
      const hasCorrect = tab.mcqOptions.some(o => o.isCorrect);
      if (!hasCorrect) {
        return { valid: false, message: `탭 ${index + 1}: 정답을 선택하세요.` };
      }
      const emptyOptions = tab.mcqOptions.filter(o => !o.text.trim());
      if (emptyOptions.length > 0) {
        return { valid: false, message: `탭 ${index + 1}: 모든 선택지를 입력하세요.` };
      }
      if (tab.mcqIsMultiple) {
        const correctCount = tab.mcqOptions.filter(o => o.isCorrect).length;
        if (correctCount !== tab.mcqMaxSelections) {
          return { valid: false, message: `탭 ${index + 1}: 정답 개수(${tab.mcqMaxSelections}개)에 맞게 선택하세요. (현재 ${correctCount}개)` };
        }
      }
    }

    // T/F/NG 검증
    if (format === "true_false_ng") {
      if (!tab.tfngStatement.trim()) {
        return { valid: false, message: `탭 ${index + 1}: 진술문을 입력하세요.` };
      }
    }

    // 매칭 검증
    if (format === "matching") {
      if (!tab.contentHtml.trim()) {
        return { valid: false, message: `탭 ${index + 1}: 지문을 입력하세요.` };
      }
      const emptyOptions = tab.matchingOptions.filter(o => !o.text.trim());
      if (emptyOptions.length > 0) {
        const labels = emptyOptions.map(o => o.label).join(", ");
        return { valid: false, message: `탭 ${index + 1}: 제목 ${labels}의 텍스트를 입력하세요.` };
      }
      const sectionText = tab.contentHtml.replace(/<[^>]*>/g, "");
      const sectionNums: number[] = [];
      const sectionRe = /\[(\d+)\]/g;
      let sm;
      while ((sm = sectionRe.exec(sectionText)) !== null) sectionNums.push(parseInt(sm[1]));
      const uniqueSections = [...new Set(sectionNums)];
      if (uniqueSections.length === 0) {
        return { valid: false, message: `탭 ${index + 1}: 지문에 섹션 마커 [1], [2] 등을 추가하세요.` };
      }
      const assignedSections = new Set(tab.matchingItems.map(i => i.number));
      const unassigned = uniqueSections.filter(n => !assignedSections.has(n));
      if (unassigned.length > 0) {
        return { valid: false, message: `탭 ${index + 1}: 섹션 [${unassigned.join("], [")}]에 정답 제목을 지정하세요.` };
      }
    }

    // 빈칸채우기 검증
    if (format === "fill_blank_typing" || format === "fill_blank_drag" || format === "table_completion") {
      if (!tab.contentHtml.trim()) {
        return { valid: false, message: `탭 ${index + 1}: 지문을 입력하세요.` };
      }
      if (tab.blanks.length === 0) {
        return { valid: false, message: `탭 ${index + 1}: 빈칸을 추가하세요.` };
      }
      const emptyBlanks = tab.blanks.filter(b => !b.answer.trim());
      if (emptyBlanks.length > 0) {
        return { valid: false, message: `탭 ${index + 1}: 모든 빈칸의 정답을 입력하세요.` };
      }
    }

    // 플로우차트 검증
    if (format === "flowchart") {
      if (!tab.flowchartTitle.trim()) {
        return { valid: false, message: `탭 ${index + 1}: 플로우차트 제목을 입력하세요.` };
      }
    }

    // Writing 검증
    if (format === "essay") {
      if (!tab.writingTitle.trim()) {
        return { valid: false, message: `탭 ${index + 1}: 제목을 입력하세요.` };
      }
      if (!tab.writingMinWords.trim()) {
        return { valid: false, message: `탭 ${index + 1}: 최소 단어 수를 입력하세요.` };
      }
      if (!tab.writingPrompt.trim()) {
        return { valid: false, message: `탭 ${index + 1}: 작문 주제를 입력하세요.` };
      }
    }

    // Speaking 검증
    if (format === "speaking_part1" || format === "speaking_part3") {
      const filledQuestions = tab.speakingQuestions.filter((q) => q.text.trim());
      if (filledQuestions.length === 0) {
        return { valid: false, message: `탭 ${index + 1}: 질문을 1개 이상 입력하세요.` };
      }
    }

    if (format === "speaking_part2") {
      if (!tab.cueCardTopic.trim()) {
        return { valid: false, message: `탭 ${index + 1}: 큐카드 주제를 입력하세요.` };
      }
    }

    // Map Labeling 검증
    if (format === "map_labeling") {
      if (tab.mapLabelingItems.length === 0) {
        return { valid: false, message: `탭 ${index + 1}: 문제 항목을 추가하세요.` };
      }
      const emptyItems = tab.mapLabelingItems.filter(i => !i.statement.trim() || !i.correctLabel);
      if (emptyItems.length > 0) {
        return { valid: false, message: `탭 ${index + 1}: 모든 문제 항목과 정답 라벨을 입력하세요.` };
      }
    }

    return { valid: true, message: "" };
  };

  // ==========================================================================
  // 저장
  // ==========================================================================
  const handleSave = async () => {
    // 모든 탭 검증
    let hasErrors = false;
    const validatedTabs = tabs.map((tab, index) => {
      const result = validateTab(tab, index);
      if (!result.valid) {
        hasErrors = true;
        return { ...tab, hasError: true, errorMessage: result.message };
      }
      return { ...tab, hasError: false, errorMessage: "" };
    });

    if (hasErrors) {
      setTabs(validatedTabs);
      const firstErrorTab = validatedTabs.findIndex(t => t.hasError);
      if (firstErrorTab !== -1) {
        setActiveTabIndex(firstErrorTab);
        toast.error(validatedTabs[firstErrorTab].errorMessage);
      }
      return;
    }

    // Confirmation via toast action
    toast.warning(`${tabs.length}개의 문제를 저장하시겠습니까?`, {
      action: {
        label: "저장",
        onClick: async () => {
          setIsSaving(true);

          try {
            const results = await Promise.all(tabs.map(async (tab) => {
              // 실제 저장 형식 결정 (MCQ의 경우)
              let actualFormat = tab.format;
              if (tab.format === "mcq") {
                actualFormat = tab.mcqIsMultiple ? "mcq_multiple" : "mcq_single";
              }

              // 데이터 구성
              let content = "";
              let optionsData: Record<string, unknown> = {};
              let answerData: Record<string, unknown> = {};

              if (tab.format === "mcq") {
                content = tab.mcqQuestion;
                optionsData = {
                  isMultiple: tab.mcqIsMultiple,
                  maxSelections: tab.mcqIsMultiple ? tab.mcqMaxSelections : undefined,
                  separateNumbers: tab.mcqIsMultiple ? tab.mcqSeparateNumbers : undefined,
                  options: tab.mcqOptions.map(o => ({
                    label: o.label,
                    text: o.text,
                    isCorrect: o.isCorrect,
                  })),
                };
              } else if (tab.format === "true_false_ng") {
                content = tab.tfngStatement;
                optionsData = {
                  separateNumbers: tab.separateNumbers,
                };
                answerData = {
                  answer: tab.tfngAnswer,
                };
              } else if (tab.format === "matching") {
                content = tab.contentHtml;
                optionsData = {
                  title: tab.matchingTitle || undefined,
                  separateNumbers: tab.separateNumbers,
                  allowDuplicate: tab.matchingAllowDuplicate,
                  options: tab.matchingOptions.map(o => ({
                    label: o.label,
                    text: o.text,
                  })),
                  items: tab.matchingItems.map(i => ({
                    number: i.number,
                    statement: i.statement,
                    correctLabel: i.correctLabel,
                  })),
                };
                answerData = {
                  matches: tab.matchingItems.map(i => ({ number: i.number, correctLabel: i.correctLabel })),
                };
              } else if (tab.format === "fill_blank_typing" || tab.format === "fill_blank_drag") {
                content = tab.contentHtml;
                optionsData = {
                  title: tab.contentTitle || undefined,
                  separateNumbers: tab.separateNumbers,
                  blank_mode: tab.blankMode,
                  ...(tab.format === "fill_blank_drag" ? { word_bank: tab.wordBank, allow_duplicate: tab.fillBlankDragAllowDuplicate } : {}),
                };
                answerData = {
                  blanks: tab.blanks.map(b => ({
                    number: b.number,
                    answer: b.answer,
                    alternatives: b.alternatives,
                  })),
                };
              } else if (tab.format === "table_completion") {
                content = tab.contentHtml;
                optionsData = {
                  title: tab.contentTitle || undefined,
                  separateNumbers: tab.separateNumbers,
                  blank_mode: tab.blankMode,
                  input_mode: tab.tableInputMode,
                  ...(tab.tableInputMode === "drag" ? { word_bank: tab.wordBank } : {}),
                };
                answerData = {
                  blanks: tab.blanks.map(b => ({
                    number: b.number,
                    answer: b.answer,
                    alternatives: b.alternatives,
                  })),
                };
              } else if (tab.format === "flowchart") {
                content = JSON.stringify({
                  title: tab.flowchartTitle,
                  nodes: tab.flowchartNodes,
                });
                optionsData = {
                  separateNumbers: tab.separateNumbers,
                };
                answerData = {
                  blanks: tab.flowchartBlanks.map(b => ({
                    number: b.number,
                    answer: b.answer,
                    alternatives: b.alternatives,
                  })),
                };
              } else if (tab.format === "essay") {
                content = tab.writingPrompt;
                optionsData = {
                  title: tab.writingTitle || undefined,
                  condition: tab.writingCondition || undefined,
                  min_words: tab.writingMinWords ? parseInt(tab.writingMinWords) : undefined,
                };
              } else if (tab.format === "speaking_part1") {
                const filledQuestions = tab.speakingQuestions.filter((q) => q.text.trim());
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
              } else if (tab.format === "speaking_part2") {
                content = JSON.stringify({
                  topic: stripBlobImages(tab.cueCardTopic),
                  points: tab.cueCardPoints.filter(p => p.trim()),
                });
                optionsData = {
                  generate_followup: tab.generateFollowup,
                };
              } else if (tab.format === "speaking_part3") {
                const filledQuestions = tab.speakingQuestions.filter((q) => q.text.trim());
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
              } else if (tab.format === "map_labeling") {
                content = tab.mapLabelingPassage || " ";
                optionsData = {
                  title: tab.mapLabelingTitle || undefined,
                  labels: tab.mapLabelingLabels,
                  items: tab.mapLabelingItems.map(i => ({
                    number: i.number,
                    statement: i.statement,
                    correctLabel: i.correctLabel,
                  })),
                  separateNumbers: tab.separateNumbers,
                };
                answerData = {
                  items: tab.mapLabelingItems.map(i => ({
                    number: i.number,
                    correctLabel: i.correctLabel,
                  })),
                };
              }

              // 1단계: blob URL 제거하고 문제 저장
              const payload = {
                question_type: selectedQuestionType,
                question_format: actualFormat,
                content: stripBlobImages(content),
                title: tab.format === "fill_blank_typing" || tab.format === "fill_blank_drag" || tab.format === "table_completion"
                  ? tab.contentTitle
                  : tab.format === "essay"
                    ? tab.writingTitle
                    : tab.format === "map_labeling"
                      ? tab.mapLabelingTitle || undefined
                      : undefined,
                instructions: (tab.format !== "mcq" && tab.format !== "true_false_ng") ? tab.instructions || undefined : undefined,
                options_data: Object.keys(optionsData).length > 0 ? optionsData : undefined,
                answer_data: Object.keys(answerData).length > 0 ? answerData : undefined,
                tags: (tab.format !== "mcq" && tab.format !== "true_false_ng" && tab.tags) ? tab.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
                is_practice: tab.isPractice,
                generate_followup: tab.format === "speaking_part2" ? tab.generateFollowup : undefined,
                audio_url: (selectedQuestionType === "listening" || tab.format === "speaking_part2") && tab.audioUrl && !tab.audioFile ? tab.audioUrl : undefined,
                audio_transcript: (selectedQuestionType === "listening" || tab.format === "speaking_part2") && tab.audioTranscript ? tab.audioTranscript : undefined,
              };

              // options_data에서 blob URL 제거
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

              const { data: result, error } = await api.post<{ id: string; question_code: string }>("/api/questions", payload);

              if (error || !result) throw new Error(error || "저장 실패");
              const questionId = result.id;
              const questionCode = result.question_code;

              // 2단계: pending 파일이 있으면 코드 기반 경로로 R2 업로드
              if (questionId && questionCode) {
                const context = `questions/${questionCode}`;
                const updatePayload: Record<string, unknown> = {};

                // 오디오 파일 업로드 (Part 2 / listening)
                if (tab.audioFile) {
                  const uploaded = await uploadFile(tab.audioFile, "audio", context);
                  updatePayload.audio_url = uploaded.path;
                }

                // Per-sub-question audio upload for Part 1 / Part 3
                if (tab.format === "speaking_part1" || tab.format === "speaking_part3") {
                  const filledQuestions = tab.speakingQuestions.filter((q) => q.text.trim());
                  const questionsWithAudio = filledQuestions.filter((q) => q.audioFile);
                  if (questionsWithAudio.length > 0) {
                    const existingOd = (payload.options_data || {}) as Record<string, unknown>;
                    const questions = (existingOd.questions || []) as Record<string, unknown>[];
                    for (const sq of questionsWithAudio) {
                      const idx = filledQuestions.indexOf(sq);
                      if (idx >= 0 && questions[idx]) {
                        try {
                          const uploaded = await uploadFile(sq.audioFile!, "audio", `${context}/q${idx + 1}`);
                          questions[idx].audio_url = uploaded.path;
                        } catch {
                          toast.error("일부 질문 오디오 업로드에 실패했습니다.");
                        }
                      }
                    }
                    updatePayload.options_data = { ...existingOd, questions };
                  }
                }

                // 에디터 이미지 업로드 (blob URL → R2 상대 경로)
                try {
                  if (tab.format === "essay" && tab.writingPrompt.includes("blob:")) {
                    updatePayload.content = await uploadEditorImages(tab.writingPrompt, context);
                  } else if (tab.format === "speaking_part2" && tab.cueCardTopic.includes("blob:")) {
                    const uploadedTopic = await uploadEditorImages(tab.cueCardTopic, context);
                    updatePayload.content = JSON.stringify({
                      topic: uploadedTopic,
                      points: tab.cueCardPoints.filter(p => p.trim()),
                    });
                  } else if (tab.format === "map_labeling" && tab.mapLabelingPassage.includes("blob:")) {
                    updatePayload.content = await uploadEditorImages(tab.mapLabelingPassage, context);
                  }
                } catch {
                  toast.error("이미지 업로드에 실패했습니다. 상세 페이지에서 다시 저장해주세요.");
                }

                // 업데이트할 내용이 있으면 PUT 요청
                if (Object.keys(updatePayload).length > 0) {
                  const { error: updateError } = await api.put(`/api/questions/${questionId}`, updatePayload);
                  if (updateError) {
                    console.error("파일 URL 업데이트 실패:", updateError);
                    toast.error("파일 URL 업데이트에 실패했습니다. 상세 페이지에서 다시 저장해주세요.");
                  }
                }
              }

              return result;
            }));

            toast.success(`${results.length}개의 문제가 저장되었습니다.`);
            router.push("/questions");
          } catch (error) {
            console.error("Save error:", error);
            toast.error(error instanceof Error ? error.message : "저장에 실패했습니다.");
          } finally {
            setIsSaving(false);
          }
        },
      },
      cancel: { label: "취소", onClick: () => {} },
    });
  };

  return { isSaving, handleSave };
}
