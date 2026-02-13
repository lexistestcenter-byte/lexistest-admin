"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useBreadcrumb } from "@/components/layout/breadcrumb-context";
import type { QuestionFormat } from "@/components/questions/types";
import { api } from "@/lib/api/client";
import type { EditQuestionForm } from "./use-edit-question-form";

export function useEditQuestionLoad(id: string, form: EditQuestionForm) {
  const router = useRouter();
  const { setOverride, clearOverride } = useBreadcrumb();
  const [isLoading, setIsLoading] = useState(true);

  // Speaking 데이터 (Part 2 목록)
  const [part2Questions, setPart2Questions] = useState<{ id: string; question_code: string; topic: string }[]>([]);
  const [isLoadingSpeakingData, setIsLoadingSpeakingData] = useState(false);

  // ==========================================================================
  // 데이터 로드
  // ==========================================================================
  useEffect(() => {
    const loadQuestion = async () => {
      try {
        const { data: result, error } = await api.get<{ question: any }>(`/api/questions/${id}`);
        if (error) {
          if (error.includes("404") || error.includes("not found")) {
            toast.error("문제를 찾을 수 없습니다.");
            router.push("/questions");
            return;
          }
          throw new Error(error);
        }
        const data = result?.question;

        if (!data) {
          toast.error("문제 데이터가 없습니다.");
          router.push("/questions");
          return;
        }

        // 기본 정보
        form.setQuestionCode(data.question_code);
        form.setSelectedQuestionType(data.question_type);
        form.setSelectedFormat(data.question_format);
        form.setInstructions(data.instructions || "");
        form.setTags(data.tags?.join(", ") || "");
        form.setIsPractice(data.is_practice);
        form.setGenerateFollowup(data.generate_followup);

        // 브레드크럼 설정
        setOverride(`/questions/${id}`, data.question_code);

        // 형식별 데이터 파싱
        const format = data.question_format;
        const content = data.content;
        const optionsData = data.options_data;
        const answerData = data.answer_data;

        // Fill blank
        if (format === "fill_blank_typing" || format === "fill_blank_drag") {
          form.setContentTitle(data.title || "");
          form.setContentHtml(content);
          if (answerData?.blanks) {
            form.setBlanks(answerData.blanks.map((b: { number: number; answer: string; alternatives?: string[] }, idx: number) => ({
              id: `b${idx}`,
              number: b.number,
              answer: b.answer,
              alternatives: b.alternatives || [],
            })));
          }
          if (optionsData) {
            form.setBlankMode(optionsData.blank_mode || "word");

            if (format === "fill_blank_drag") {
              if (optionsData.word_bank) {
                form.setWordBank(optionsData.word_bank);
              }
              form.setFillBlankDragAllowDuplicate(optionsData.allow_duplicate || false);
            }
          }
        }
        // MCQ (단일/복수선택 → 통합 mcq로 변환)
        else if (format === "mcq_single" || format === "mcq_multiple") {
          // UI에서는 통합 mcq로 표시
          form.setSelectedFormat("mcq" as QuestionFormat);
          form.setMcqIsMultiple(format === "mcq_multiple");
          form.setMcqQuestion(content);
          if (optionsData) {
            if (optionsData.maxSelections) {
              form.setMcqMaxSelections(optionsData.maxSelections);
            }
            form.setMcqDisplayAlphabet(optionsData.displayMode === "alphabet");
            if (Array.isArray(optionsData.options)) {
              form.setMcqOptions(optionsData.options.map((o: { label: string; text: string; isCorrect: boolean }, idx: number) => ({
                id: `o${idx}`,
                label: o.label,
                text: o.text,
                isCorrect: o.isCorrect,
              })));
            }
          }
        }
        // T/F/NG
        else if (format === "true_false_ng") {
          form.setTfngStatement(content || "");
          if (answerData?.answer) {
            form.setTfngAnswer(answerData.answer as "true" | "false" | "not_given");
          }
        }
        // 매칭
        else if (format === "matching") {
          form.setContentHtml(content || "");
          if (optionsData) {
            form.setMatchingTitle(optionsData.title || "");
            form.setMatchingAllowDuplicate(optionsData.allowDuplicate || false);
            if (Array.isArray(optionsData.options)) {
              form.setMatchingOptions(optionsData.options.map((o: { label: string; text: string }, idx: number) => ({
                id: `o${idx}`,
                label: o.label,
                text: o.text,
              })));
            }
            if (Array.isArray(optionsData.items)) {
              form.setMatchingItems(optionsData.items.map((i: { number: number; statement: string; correctLabel: string }, idx: number) => ({
                id: `m${idx}`,
                number: i.number,
                statement: i.statement,
                correctLabel: i.correctLabel,
              })));
            }
          }
        }
        // Flowchart
        else if (format === "flowchart") {
          try {
            const parsed = JSON.parse(content);
            form.setFlowchartTitle(parsed.title || "");
            form.setFlowchartNodes(parsed.nodes || []);
          } catch {
            console.error("Failed to parse flowchart content");
          }
          if (answerData?.blanks) {
            form.setFlowchartBlanks(answerData.blanks.map((b: { number: number; answer: string; alternatives?: string[] }, idx: number) => ({
              id: `fb${idx}`,
              number: b.number,
              answer: b.answer,
              alternatives: b.alternatives || [],
            })));
          }
        }
        // Table Completion
        else if (format === "table_completion") {
          form.setContentTitle(data.title || "");
          form.setContentHtml(content);
          if (answerData?.blanks) {
            form.setBlanks(answerData.blanks.map((b: { number: number; answer: string; alternatives?: string[] }, idx: number) => ({
              id: `b${idx}`,
              number: b.number,
              answer: b.answer,
              alternatives: b.alternatives || [],
            })));
          }
          if (optionsData) {
            form.setBlankMode(optionsData.blank_mode || "word");
            form.setTableInputMode(optionsData.input_mode || "typing");
            if (optionsData.word_bank) {
              form.setWordBank(optionsData.word_bank);
            }
          }
        }
        // Writing
        else if (format === "essay") {
          form.setWritingPrompt(content || "");
          if (optionsData) {
            form.setWritingTitle(optionsData.title || "");
            form.setWritingCondition(optionsData.condition || "");
            form.setWritingMinWords(optionsData.min_words ? String(optionsData.min_words) : "");
          }
        }
        // Speaking Part 1
        else if (format === "speaking_part1") {
          if (optionsData?.questions && Array.isArray(optionsData.questions)) {
            form.setSpeakingQuestions(optionsData.questions.map((q: any, i: number) => ({
              id: `sq-${i}`,
              text: q.text || "",
              timeLimitSeconds: q.time_limit_seconds ? String(q.time_limit_seconds) : "30",
              allowResponseReset: q.allow_response_reset !== false,
              audioUrl: q.audio_url || "",
              audioFile: null,
            })));
          } else {
            // Legacy single question format
            form.setSpeakingQuestions([{ id: "sq-0", text: content || "", timeLimitSeconds: "30", allowResponseReset: true, audioUrl: "", audioFile: null }]);
          }
        }
        // Speaking Part 2
        else if (format === "speaking_part2") {
          try {
            const parsed = JSON.parse(content);
            form.setCueCardTopic(parsed.topic || "");
            form.setCueCardPoints(parsed.points || ["", "", "", ""]);
          } catch {
            form.setCueCardTopic(content || "");
          }
        }
        // Speaking Part 3
        else if (format === "speaking_part3") {
          if (optionsData?.questions && Array.isArray(optionsData.questions)) {
            form.setSpeakingQuestions(optionsData.questions.map((q: any, i: number) => ({
              id: `sq-${i}`,
              text: q.text || "",
              timeLimitSeconds: q.time_limit_seconds ? String(q.time_limit_seconds) : "30",
              allowResponseReset: q.allow_response_reset !== false,
              audioUrl: q.audio_url || "",
              audioFile: null,
            })));
          } else {
            form.setSpeakingQuestions([{ id: "sq-0", text: content || "", timeLimitSeconds: "30", allowResponseReset: true, audioUrl: "", audioFile: null }]);
          }
          form.setRelatedPart2Id(data.related_part2_id || "");
          form.setDepthLevel((data.depth_level || 1) as 1 | 2 | 3);
        }
        // Map Labeling
        else if (format === "map_labeling") {
          if (optionsData) {
            form.setMapLabelingTitle(String(optionsData.title || data.title || ""));
            form.setMapLabelingPassage(data.content || "");
            if (Array.isArray(optionsData.labels)) {
              form.setMapLabelingLabels(optionsData.labels);
            }
            if (Array.isArray(optionsData.items)) {
              form.setMapLabelingItems(optionsData.items.map((i: { number: number; statement: string; correctLabel: string }, idx: number) => ({
                id: `ml${idx}`,
                number: i.number,
                statement: i.statement,
                correctLabel: i.correctLabel,
              })));
            }
          }
        }

        // separateNumbers (공통)
        if (optionsData?.separateNumbers) form.setSeparateNumbers(optionsData.separateNumbers);

        // Audio data (Listening)
        if (data.audio_url) form.setAudioUrl(data.audio_url);
        if (data.audio_transcript) form.setAudioTranscript(data.audio_transcript);
      } catch (error) {
        console.error("Error loading question:", error);
        toast.error("문제를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestion();

    return () => {
      clearOverride(`/questions/${id}`);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router, setOverride, clearOverride]);

  // Speaking Part 2 질문 목록 로드
  useEffect(() => {
    if (form.selectedQuestionType === "speaking") {
      setIsLoadingSpeakingData(true);
      api.get<{ questions: any[] }>("/api/speaking/part2-questions")
        .then((res) => {
          setPart2Questions(res.data?.questions || []);
        })
        .catch(err => {
          console.error("Failed to load speaking data:", err);
        })
        .finally(() => setIsLoadingSpeakingData(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.selectedQuestionType]);

  return { isLoading, part2Questions, isLoadingSpeakingData };
}
