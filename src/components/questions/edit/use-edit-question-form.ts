"use client";

import { useState } from "react";
import { toast } from "sonner";
import type {
  QuestionType,
  QuestionFormat,
  Blank,
  MCQOption,
  MatchingOption,
  MatchingItem,
  FlowchartNode,
} from "@/components/questions/types";
import type { SpeakingSubQ, MapLabelingItem } from "@/components/questions/types";

export function useEditQuestionForm() {
  const [questionCode, setQuestionCode] = useState("");

  // 문제 유형/형태 (수정 시에는 변경 불가)
  const [selectedQuestionType, setSelectedQuestionType] = useState<QuestionType | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<QuestionFormat | null>(null);

  // 공통 필드
  const [instructions, setInstructions] = useState("");
  const [tags, setTags] = useState("");
  const [isPractice, setIsPractice] = useState(false);

  // 빈칸채우기 (직접입력 & 드래그앤드랍)
  const [contentHtml, setContentHtml] = useState("");
  const [blanks, setBlanks] = useState<Blank[]>([]);
  const [wordBank, setWordBank] = useState<string[]>([]);
  const [contentTitle, setContentTitle] = useState("");
  const [blankMode, setBlankMode] = useState<"word" | "sentence">("word");
  const [fillBlankDragAllowDuplicate, setFillBlankDragAllowDuplicate] = useState(false);

  // Table Completion
  const [tableInputMode, setTableInputMode] = useState<"typing" | "drag">("typing");

  // MCQ (통합: 단일/복수)
  const [mcqQuestion, setMcqQuestion] = useState("");
  const [mcqOptions, setMcqOptions] = useState<MCQOption[]>([
    { id: "a", label: "A", text: "", isCorrect: false },
    { id: "b", label: "B", text: "", isCorrect: false },
    { id: "c", label: "C", text: "", isCorrect: false },
    { id: "d", label: "D", text: "", isCorrect: false },
  ]);
  const [mcqIsMultiple, setMcqIsMultiple] = useState(false);
  const [mcqMaxSelections, setMcqMaxSelections] = useState(2);

  // T/F/NG (단일 진술문)
  const [tfngStatement, setTfngStatement] = useState("");
  const [tfngAnswer, setTfngAnswer] = useState<"true" | "false" | "not_given">("true");

  // 매칭 (드래그앤드랍)
  const [matchingTitle, setMatchingTitle] = useState("");
  const [matchingAllowDuplicate, setMatchingAllowDuplicate] = useState(false);
  const [separateNumbers, setSeparateNumbers] = useState(false);
  const [matchingOptions, setMatchingOptions] = useState<MatchingOption[]>([
    { id: "o1", label: "A", text: "" },
    { id: "o2", label: "B", text: "" },
  ]);
  const [matchingItems, setMatchingItems] = useState<MatchingItem[]>([
    { id: "m1", number: 1, statement: "", correctLabel: "" },
  ]);

  // 플로우차트
  const [flowchartTitle, setFlowchartTitle] = useState("");
  const [flowchartNodes, setFlowchartNodes] = useState<FlowchartNode[]>([]);
  const [flowchartBlanks, setFlowchartBlanks] = useState<Blank[]>([]);

  // Writing
  const [writingTitle, setWritingTitle] = useState("");
  const [writingCondition, setWritingCondition] = useState("");
  const [writingPrompt, setWritingPrompt] = useState("");
  const [writingMinWords, setWritingMinWords] = useState("");

  // Speaking
  const [speakingQuestions, setSpeakingQuestions] = useState<SpeakingSubQ[]>(
    Array.from({ length: 5 }, (_, i) => ({ id: `sq-${i}`, text: "", timeLimitSeconds: "30", allowResponseReset: true, audioUrl: "", audioFile: null }))
  );
  const [cueCardTopic, setCueCardTopic] = useState("");
  const [cueCardPoints, setCueCardPoints] = useState<string[]>(["", "", "", ""]);
  const [generateFollowup, setGenerateFollowup] = useState(false);
  const [relatedPart2Id, setRelatedPart2Id] = useState("");
  const [depthLevel, setDepthLevel] = useState<1 | 2 | 3>(1);

  // Audio (Listening)
  const [audioUrl, setAudioUrl] = useState("");
  const [audioTranscript, setAudioTranscript] = useState("");

  // Map Labeling
  const [mapLabelingTitle, setMapLabelingTitle] = useState("");
  const [mapLabelingPassage, setMapLabelingPassage] = useState("");
  const [mapLabelingLabels, setMapLabelingLabels] = useState<string[]>(["A", "B", "C", "D", "E", "F", "G", "H"]);
  const [mapLabelingItems, setMapLabelingItems] = useState<MapLabelingItem[]>([
    { id: "ml1", number: 1, statement: "", correctLabel: "" }
  ]);

  // 미리보기 모달
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // ==========================================================================
  // 빈칸 관련 함수
  // ==========================================================================
  const addBlank = () => {
    const nextNumber = blanks.length > 0 ? Math.max(...blanks.map(b => b.number)) + 1 : 1;
    setBlanks([...blanks, { id: `b${Date.now()}`, number: nextNumber, answer: "", alternatives: [] }]);
  };

  const updateBlank = (id: string, field: keyof Blank, value: unknown) => {
    setBlanks(blanks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const removeBlank = (id: string) => {
    setBlanks(blanks.filter(b => b.id !== id));
  };

  // ==========================================================================
  // Word Bank 관련 함수
  // ==========================================================================
  const addWord = () => setWordBank([...wordBank, ""]);
  const cleanWord = (s: string) => s.trim();
  const updateWord = (index: number, value: string) => {
    const allowSpaces = selectedFormat === "table_completion";
    // 쉼표가 있으면 분리해서 각각 개별 단어로 추가
    const parts = value.split(",").map(cleanWord).filter(Boolean);
    if (parts.length > 1) {
      const valid = allowSpaces ? parts : parts.filter(p => !/\s/.test(p));
      const invalid = allowSpaces ? [] : parts.filter(p => /\s/.test(p));
      if (invalid.length > 0) toast.warning(`공백이 포함된 단어는 추가할 수 없습니다: ${invalid.join(", ")}`);
      if (valid.length > 0) {
        const newBank = [...wordBank];
        newBank[index] = valid[0];
        const extra = valid.slice(1).filter(w => !newBank.includes(w));
        setWordBank([...newBank, ...extra]);
      }
      return;
    }
    // 단일 단어: trim + 공백 검증
    const cleaned = cleanWord(value);
    if (!allowSpaces && cleaned && /\s/.test(cleaned)) {
      toast.warning("공백이 포함된 단어는 추가할 수 없습니다. 단일 단어만 입력해주세요.");
      return;
    }
    const newBank = [...wordBank];
    newBank[index] = cleaned;
    setWordBank(newBank);
  };
  const removeWord = (index: number) => setWordBank(wordBank.filter((_, i) => i !== index));

  // ==========================================================================
  // MCQ 관련 함수
  // ==========================================================================
  const addMcqOption = () => {
    const labels = "ABCDEFGHIJ";
    const nextLabel = labels[mcqOptions.length] || `O${mcqOptions.length + 1}`;
    setMcqOptions([...mcqOptions, { id: `o${Date.now()}`, label: nextLabel, text: "", isCorrect: false }]);
  };

  const removeMcqOption = (id: string) => {
    if (mcqOptions.length <= 2) {
      toast.error("최소 2개의 선택지가 필요합니다.");
      return;
    }
    const newOptions = mcqOptions.filter(o => o.id !== id);
    const labels = "ABCDEFGHIJ";
    setMcqOptions(newOptions.map((o, i) => ({ ...o, label: labels[i] || `O${i + 1}` })));
  };

  const updateMcqOption = (id: string, field: keyof MCQOption, value: unknown) => {
    setMcqOptions(mcqOptions.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const toggleMcqCorrect = (id: string, isMultiple: boolean) => {
    if (isMultiple) {
      setMcqOptions(mcqOptions.map(o => o.id === id ? { ...o, isCorrect: !o.isCorrect } : o));
    } else {
      setMcqOptions(mcqOptions.map(o => ({ ...o, isCorrect: o.id === id })));
    }
  };

  // MCQ 모드 전환 시 입력 데이터 초기화
  const toggleMcqMode = (isMultiple: boolean) => {
    const hasData = mcqQuestion.trim() || mcqOptions.some(o => o.text.trim() || o.isCorrect);
    setMcqIsMultiple(isMultiple);
    if (hasData) {
      setMcqQuestion("");
      setMcqOptions([
        { id: "a", label: "A", text: "", isCorrect: false },
        { id: "b", label: "B", text: "", isCorrect: false },
        { id: "c", label: "C", text: "", isCorrect: false },
        { id: "d", label: "D", text: "", isCorrect: false },
      ]);
      setMcqMaxSelections(2);
      toast.info("선택 방식이 변경되어 입력 내용이 초기화되었습니다.");
    }
  };

  // ==========================================================================
  // 매칭 관련 함수
  // ==========================================================================
  const addMatchingOption = () => {
    const labels = "ABCDEFGHIJ";
    const nextLabel = labels[matchingOptions.length] || `O${matchingOptions.length + 1}`;
    setMatchingOptions([...matchingOptions, { id: `o${Date.now()}`, label: nextLabel, text: "" }]);
  };

  const removeMatchingOption = (id: string) => {
    if (matchingOptions.length <= 2) {
      toast.error("최소 2개의 보기가 필요합니다.");
      return;
    }
    const newOptions = matchingOptions.filter(o => o.id !== id);
    const labels = "ABCDEFGHIJ";
    setMatchingOptions(newOptions.map((o, i) => ({ ...o, label: labels[i] || `O${i + 1}` })));
  };

  const updateMatchingOption = (id: string, text: string) => {
    setMatchingOptions(matchingOptions.map(o => o.id === id ? { ...o, text } : o));
  };

  const addMatchingItem = () => {
    const nextNum = matchingItems.length > 0 ? Math.max(...matchingItems.map(i => i.number)) + 1 : 1;
    setMatchingItems([...matchingItems, { id: `m${Date.now()}`, number: nextNum, statement: "", correctLabel: "" }]);
  };

  const updateMatchingItem = (id: string, field: keyof MatchingItem, value: unknown) => {
    setMatchingItems(matchingItems.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeMatchingItem = (id: string) => {
    if (matchingItems.length <= 1) {
      toast.error("최소 1개의 문항이 필요합니다.");
      return;
    }
    setMatchingItems(matchingItems.filter(i => i.id !== id));
  };

  // ==========================================================================
  // 플로우차트 관련 함수
  // ==========================================================================
  const addFlowchartNode = (type: "box" | "branch") => {
    const maxRow = flowchartNodes.reduce((max, n) => Math.max(max, n.row), -1);
    setFlowchartNodes([...flowchartNodes, {
      id: `n${Date.now()}`,
      type,
      content: "",
      row: maxRow + 1,
      col: 0,
      label: "",
    }]);
  };

  return {
    questionCode, setQuestionCode,
    selectedQuestionType, setSelectedQuestionType,
    selectedFormat, setSelectedFormat,
    instructions, setInstructions,
    tags, setTags,
    isPractice, setIsPractice,
    contentHtml, setContentHtml,
    blanks, setBlanks,
    wordBank, setWordBank,
    contentTitle, setContentTitle,
    blankMode, setBlankMode,
    fillBlankDragAllowDuplicate, setFillBlankDragAllowDuplicate,
    tableInputMode, setTableInputMode,
    mcqQuestion, setMcqQuestion,
    mcqOptions, setMcqOptions,
    mcqIsMultiple, setMcqIsMultiple,
    mcqMaxSelections, setMcqMaxSelections,
    tfngStatement, setTfngStatement,
    tfngAnswer, setTfngAnswer,
    matchingTitle, setMatchingTitle,
    matchingAllowDuplicate, setMatchingAllowDuplicate,
    separateNumbers, setSeparateNumbers,
    matchingOptions, setMatchingOptions,
    matchingItems, setMatchingItems,
    flowchartTitle, setFlowchartTitle,
    flowchartNodes, setFlowchartNodes,
    flowchartBlanks, setFlowchartBlanks,
    writingTitle, setWritingTitle,
    writingCondition, setWritingCondition,
    writingPrompt, setWritingPrompt,
    writingMinWords, setWritingMinWords,
    speakingQuestions, setSpeakingQuestions,
    cueCardTopic, setCueCardTopic,
    cueCardPoints, setCueCardPoints,
    generateFollowup, setGenerateFollowup,
    relatedPart2Id, setRelatedPart2Id,
    depthLevel, setDepthLevel,
    audioUrl, setAudioUrl,
    audioTranscript, setAudioTranscript,
    mapLabelingTitle, setMapLabelingTitle,
    mapLabelingPassage, setMapLabelingPassage,
    mapLabelingLabels, setMapLabelingLabels,
    mapLabelingItems, setMapLabelingItems,
    isPreviewOpen, setIsPreviewOpen,
    // Helpers
    addBlank, updateBlank, removeBlank,
    addWord, updateWord, removeWord,
    addMcqOption, removeMcqOption, updateMcqOption, toggleMcqCorrect, toggleMcqMode,
    addMatchingOption, removeMatchingOption, updateMatchingOption,
    addMatchingItem, updateMatchingItem, removeMatchingItem,
    addFlowchartNode,
  };
}

export type EditQuestionForm = ReturnType<typeof useEditQuestionForm>;
