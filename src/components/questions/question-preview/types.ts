// =============================================================================
// 통합 데이터 인터페이스
// =============================================================================
export interface QuestionPreviewData {
  question_type: string;
  question_format: string;
  content: string;
  title?: string;
  instructions?: string;
  subInstructions?: string;
  audioUrl?: string;

  // options_data (normalized)
  options_data: Record<string, unknown>;

  // speaking specific
  relatedPart2Code?: string;
  relatedPart2Id?: string;
  depthLevel?: number;
}

// =============================================================================
// 변환 함수: QuestionTab → QuestionPreviewData
// =============================================================================
export interface QuestionTabLike {
  format: string | null;
  // MCQ
  mcqQuestion: string;
  mcqOptions: { id: string; label: string; text: string; isCorrect: boolean }[];
  mcqIsMultiple: boolean;
  mcqMaxSelections: number;
  mcqDisplayAlphabet?: boolean;
  // TFNG
  tfngStatement: string;
  // Matching
  matchingTitle: string;
  matchingAllowDuplicate: boolean;
  matchingOptions: { id: string; label: string; text: string }[];
  // Fill blank
  contentTitle: string;
  contentHtml: string;
  blanks: { id: string; number: number; answer: string; alternatives: string[] }[];
  wordBank: string[];
  blankMode: "word" | "sentence";
  fillBlankDragAllowDuplicate: boolean;
  bankLabel: string;
  bankLayout: "row" | "column";
  // Table
  tableInputMode: "typing" | "drag";
  // Flowchart
  flowchartTitle: string;
  flowchartNodes: { id: string; type: string; content: string; row: number; col: number; label?: string }[];
  // Writing
  writingTitle: string;
  writingCondition: string;
  writingPrompt: string;
  writingMinWords: string;
  // Speaking (Part 1 & Part 3: multi-question groups)
  speakingQuestions: { id: string; text: string; timeLimitSeconds: string; allowResponseReset: boolean; audioUrl: string }[];
  cueCardTopic: string;
  cueCardPoints: string[];
  relatedPart2Id: string;
  depthLevel: number;
  // Audio
  audioUrl: string;
  // Map labeling
  mapLabelingTitle: string;
  mapLabelingPassage: string;
  mapLabelingLabels: string[];
  mapLabelingItems: { id: string; number: number; statement: string; correctLabel: string }[];
  // Short answer
  shortAnswerQuestion: string;
  shortAnswerAnswer: string;
  shortAnswerAlternatives: string[];
  // Common
  instructions: string;
  subInstructions?: string;
}

export function tabToPreviewData(
  tab: QuestionTabLike,
  questionType: string,
): QuestionPreviewData {
  const fmt = tab.format || "";
  let content = "";
  const options_data: Record<string, unknown> = {};

  if (fmt === "mcq" || fmt === "mcq_single" || fmt === "mcq_multiple") {
    content = tab.mcqQuestion;
    options_data.question = tab.mcqQuestion;
    options_data.isMultiple = tab.mcqIsMultiple;
    options_data.maxSelections = tab.mcqMaxSelections;
    options_data.options = tab.mcqOptions.map((o) => ({
      id: o.id,
      label: o.label,
      text: o.text,
    }));
    if (tab.mcqDisplayAlphabet) {
      options_data.displayMode = "alphabet";
    }
  } else if (fmt === "true_false_ng" || fmt === "yes_no_ng") {
    content = tab.tfngStatement;
  } else if (fmt === "matching") {
    content = tab.contentHtml;
    options_data.title = tab.matchingTitle;
    options_data.allowDuplicate = tab.matchingAllowDuplicate;
    options_data.options = tab.matchingOptions.map((o) => ({
      id: o.id,
      label: o.label,
      text: o.text,
    }));
  } else if (fmt === "fill_blank_typing") {
    content = tab.contentHtml;
    options_data.title = tab.contentTitle;
  } else if (fmt === "fill_blank_drag") {
    content = tab.contentHtml;
    options_data.title = tab.contentTitle;
    options_data.word_bank = tab.wordBank;
    options_data.blank_mode = tab.blankMode;
    options_data.allowDuplicate = tab.fillBlankDragAllowDuplicate;
    options_data.bank_label = tab.bankLabel;
    options_data.bank_layout = tab.bankLayout;
  } else if (fmt === "table_completion") {
    content = tab.contentHtml;
    options_data.title = tab.contentTitle;
    options_data.input_mode = tab.tableInputMode;
    options_data.word_bank = tab.wordBank;
  } else if (fmt === "flowchart") {
    options_data.title = tab.flowchartTitle;
    options_data.nodes = tab.flowchartNodes;
  } else if (fmt === "map_labeling") {
    content = tab.mapLabelingPassage;
    options_data.title = tab.mapLabelingTitle;
    options_data.labels = tab.mapLabelingLabels;
    options_data.items = tab.mapLabelingItems.map((i) => ({
      id: i.id,
      number: i.number,
      statement: i.statement,
    }));
  } else if (fmt === "short_answer") {
    content = tab.shortAnswerQuestion || "";
  } else if (fmt === "essay") {
    content = tab.writingPrompt;
    options_data.title = tab.writingTitle;
    options_data.condition = tab.writingCondition;
    options_data.min_words = tab.writingMinWords ? parseInt(tab.writingMinWords) : 0;
  } else if (fmt === "speaking_part1" || fmt === "speaking_part3") {
    const filledQs = tab.speakingQuestions.filter((q) => q.text.trim());
    content = filledQs[0]?.text || "";
    options_data.questions = filledQs.map((q, i) => ({
      number: i + 1,
      text: q.text,
      time_limit_seconds: q.timeLimitSeconds ? parseInt(q.timeLimitSeconds) : 30,
      allow_response_reset: q.allowResponseReset,
    }));
  } else if (fmt === "speaking_part2") {
    content = tab.cueCardTopic;
    options_data.topic = tab.cueCardTopic;
    options_data.points = tab.cueCardPoints;
  }

  return {
    question_type: questionType,
    question_format: fmt,
    content,
    title: tab.contentTitle || tab.writingTitle || tab.flowchartTitle || tab.mapLabelingTitle || undefined,
    instructions: tab.instructions || undefined,
    subInstructions: tab.subInstructions || undefined,
    audioUrl: tab.audioUrl || undefined,
    options_data,
    relatedPart2Id: tab.relatedPart2Id || undefined,
    depthLevel: tab.depthLevel || undefined,
  };
}

// =============================================================================
// 변환 함수: API QuestionData → QuestionPreviewData
// =============================================================================
export interface ApiQuestionData {
  id: string;
  question_code: string;
  question_type: string;
  question_format: string;
  content: string;
  title: string | null;
  instructions: string | null;
  sub_instructions: string | null;
  options_data: Record<string, unknown> | null;
  answer_data: Record<string, unknown> | null;
  image_url?: string | null;
  audio_url?: string | null;
  speaking_category?: string | null;
  related_part2_id?: string | null;
  related_part2_code?: string | null;
  depth_level?: number | null;
  target_band_min?: number | null;
  target_band_max?: number | null;
}

export function apiToPreviewData(q: ApiQuestionData): QuestionPreviewData {
  return {
    question_type: q.question_type,
    question_format: q.question_format,
    content: q.content || "",
    title: q.title || undefined,
    instructions: q.instructions || undefined,
    subInstructions: q.sub_instructions || undefined,
    audioUrl: q.audio_url || undefined,
    options_data: q.options_data || {},
    relatedPart2Id: q.related_part2_id || undefined,
    relatedPart2Code: q.related_part2_code || undefined,
    depthLevel: q.depth_level || undefined,
  };
}
