import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";

// --- Zod schemas ---

// Request validation
const TaskItemSchema = z.object({
  question: z.string().min(1, "question is required"),
  answer: z.string().min(1, "answer is required"),
});

const WritingGradeRequestSchema = z.object({
  tasks: z
    .array(TaskItemSchema)
    .min(1, "At least one task is required")
    .max(2, "Maximum 2 tasks allowed"),
  lang: z.enum(["en", "ko"]).optional().default("en"),
});

// Response validation (GPT 응답 검증)
const SentenceCorrectionSchema = z.object({
  original: z.string(),
  corrected: z.string(),
  reason: z.string(),
  band_upgrade_tip: z.string(),
});

const TaskScoresSchema = z.object({
  task_achievement: z.number().min(0).max(9),
  coherence_cohesion: z.number().min(0).max(9),
  lexical_resource: z.number().min(0).max(9),
  grammar: z.number().min(0).max(9),
  overall_band: z.number().min(0).max(9),
});

const TaskFeedbackSchema = z.object({
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  improvement: z.array(z.string()),
});

const TaskResultSchema = z.object({
  task_number: z.number(),
  scores: TaskScoresSchema,
  feedback: TaskFeedbackSchema,
  sentence_corrections: z.array(SentenceCorrectionSchema),
});

const WritingGradeResponseSchema = z.object({
  tasks: z.array(TaskResultSchema),
  overall_band: z.number().min(0).max(9),
});

// --- System prompts ---

const SYSTEM_PROMPT_EN = `
You are a certified IELTS Writing examiner.

Evaluate each task strictly based on IELTS band descriptors.

For each task:

1. Give scores:
- Task Achievement
- Coherence and Cohesion
- Lexical Resource
- Grammatical Range and Accuracy

2. Provide feedback:
- strengths (2-3 items)
- weaknesses (2-3 items)
- improvement suggestions (2-3 items)

3. Provide sentence corrections:
- Select 3 to 5 sentences that need improvement
- Provide corrected version
- Explain the reason
- Explain how it improves the band score

Rules:
- Scores must be 0-9 (0.5 allowed)
- Be strict and objective
- Do NOT rewrite entire essay
- Corrections must be meaningful
- Keep feedback concise

Return ONLY valid JSON.
`;

const SYSTEM_PROMPT_KO = `
You are a certified IELTS Writing examiner.

Evaluate each task strictly based on IELTS band descriptors.

For each task:

1. Give scores:
- Task Achievement
- Coherence and Cohesion
- Lexical Resource
- Grammatical Range and Accuracy

2. Provide feedback:
- strengths (2-3 items)
- weaknesses (2-3 items)
- improvement suggestions (2-3 items)

3. Provide sentence corrections:
- Select 3 to 5 sentences that need improvement
- Provide corrected version
- Explain the reason
- Explain how it improves the band score

Rules:
- Scores must be 0-9 (0.5 allowed)
- Be strict and objective
- Do NOT rewrite entire essay
- Corrections must be meaningful
- Keep feedback concise

IMPORTANT language rules:
- feedback.strengths, feedback.weaknesses, feedback.improvement: Write in Korean (한글)
- sentence_corrections.original, sentence_corrections.corrected: Keep in English (원문/교정문은 영어 유지)
- sentence_corrections.reason, sentence_corrections.band_upgrade_tip: Write in Korean (한글)

Return ONLY valid JSON.
`;

// --- Helper: IELTS 0.5 단위 반올림 ---

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

// --- OpenAI client ---

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// --- Route handler ---

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Zod request validation
    const parsed = WritingGradeRequestSchema.safeParse(body);
    if (!parsed.success) {
      const messages = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return NextResponse.json(
        { success: false, error: messages },
        { status: 400 }
      );
    }

    const { tasks, lang } = parsed.data;

    const formattedTasks = tasks
      .map(
        (t, i) => `
Task ${i + 1} Question:
${t.question}

Task ${i + 1} Answer:
${t.answer}
`
      )
      .join("\n");

    const systemPrompt = lang === "ko" ? SYSTEM_PROMPT_KO : SYSTEM_PROMPT_EN;

    const response = await client.chat.completions.create({
      // model: "ft:gpt-4o-mini-2024-07-18:lexislab:ielts-v2:D3y9KhTd",
      model: "gpt-4o",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: formattedTasks,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ielts_writing_feedback",
          strict: true,
          schema: {
            type: "object",
            properties: {
              tasks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    task_number: { type: "number" },
                    scores: {
                      type: "object",
                      properties: {
                        task_achievement: { type: "number" },
                        coherence_cohesion: { type: "number" },
                        lexical_resource: { type: "number" },
                        grammar: { type: "number" },
                        overall_band: { type: "number" },
                      },
                      required: [
                        "task_achievement",
                        "coherence_cohesion",
                        "lexical_resource",
                        "grammar",
                        "overall_band",
                      ],
                      additionalProperties: false,
                    },
                    feedback: {
                      type: "object",
                      properties: {
                        strengths: {
                          type: "array",
                          items: { type: "string" },
                        },
                        weaknesses: {
                          type: "array",
                          items: { type: "string" },
                        },
                        improvement: {
                          type: "array",
                          items: { type: "string" },
                        },
                      },
                      required: ["strengths", "weaknesses", "improvement"],
                      additionalProperties: false,
                    },
                    sentence_corrections: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          original: { type: "string" },
                          corrected: { type: "string" },
                          reason: { type: "string" },
                          band_upgrade_tip: { type: "string" },
                        },
                        required: [
                          "original",
                          "corrected",
                          "reason",
                          "band_upgrade_tip",
                        ],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: [
                    "task_number",
                    "scores",
                    "feedback",
                    "sentence_corrections",
                  ],
                  additionalProperties: false,
                },
              },
              overall_band: { type: "number" },
            },
            required: ["tasks", "overall_band"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;

    let gptResult: unknown;
    try {
      gptResult = content ? JSON.parse(content) : null;
    } catch {
      return NextResponse.json(
        { success: false, error: "JSON parse failed", raw: content },
        { status: 500 }
      );
    }

    // Zod response validation
    const responseParsed = WritingGradeResponseSchema.safeParse(gptResult);
    if (!responseParsed.success) {
      console.error(
        "GPT response validation failed:",
        responseParsed.error.issues
      );
      return NextResponse.json(
        { success: false, error: "Invalid AI response structure" },
        { status: 502 }
      );
    }

    const resultData = responseParsed.data;

    // 각 task의 overall_band 재계산: 4개 점수 평균 → 0.5 단위 반올림
    resultData.tasks.forEach((task) => {
      const { task_achievement, coherence_cohesion, lexical_resource, grammar } =
        task.scores;
      const avg =
        (task_achievement + coherence_cohesion + lexical_resource + grammar) / 4;
      task.scores.overall_band = roundToHalf(avg);
    });

    // 최상위 overall_band 재계산
    if (resultData.tasks.length === 1) {
      resultData.overall_band = resultData.tasks[0].scores.overall_band;
    } else if (resultData.tasks.length === 2) {
      // Task 2 가중치 2배: (T1 + T2×2) / 3 → 0.5 단위 반올림
      const t1 = resultData.tasks[0].scores.overall_band;
      const t2 = resultData.tasks[1].scores.overall_band;
      resultData.overall_band = roundToHalf((t1 + t2 * 2) / 3);
    }

    return NextResponse.json({ success: true, data: resultData });
  } catch (error: unknown) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
