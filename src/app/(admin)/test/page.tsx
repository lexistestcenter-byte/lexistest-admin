"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Send, ArrowRight, Lightbulb } from "lucide-react";

interface WritingGradeResponse {
  success: boolean;
  data?: {
    tasks: Array<{
      task_number: number;
      scores: {
        task_achievement: number;
        coherence_cohesion: number;
        lexical_resource: number;
        grammar: number;
        overall_band: number;
      };
      feedback: {
        strengths: string[];
        weaknesses: string[];
        improvement: string[];
      };
      sentence_corrections: Array<{
        original: string;
        corrected: string;
        reason: string;
        band_upgrade_tip: string;
      }>;
    }>;
    overall_band: number;
  };
  error?: string;
}

const criteriaLabels: Record<string, string> = {
  task_achievement: "Task Achievement",
  coherence_cohesion: "Coherence & Cohesion",
  lexical_resource: "Lexical Resource",
  grammar: "Grammatical Range & Accuracy",
};

export default function TestPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WritingGradeResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<"en" | "ko">("en");

  const handleGrade = async () => {
    if (!question.trim() || !answer.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/writing-grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: [{ question: question.trim(), answer: answer.trim() }],
          lang,
        }),
      });

      const data: WritingGradeResponse = await res.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || `채점 요청 실패 (${res.status})`);
      }

      setResult(data);
      setModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "채점 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = question.trim().length > 0 && answer.trim().length > 0 && !loading;
  const taskResult = result?.data?.tasks?.[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Writing 채점 테스트"
        description="IELTS Writing 답안을 AI로 채점합니다."
      />

      <Card>
        <CardHeader>
          <CardTitle>채점 요청</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="question">Question (문제)</Label>
            <Textarea
              id="question"
              placeholder="IELTS Writing 문제를 입력하세요..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[120px] resize-y"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer">Answer (답안)</Label>
            <Textarea
              id="answer"
              placeholder="학생의 답안을 입력하세요..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="min-h-[200px] resize-y"
            />
          </div>

          <div className="space-y-2">
            <Label>피드백 언어</Label>
            <Select value={lang} onValueChange={(v) => setLang(v as "en" | "ko")}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ko">English + 한글</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleGrade} disabled={!canSubmit}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  채점 중...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  채점 요청
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>채점 결과</DialogTitle>
          </DialogHeader>

          {taskResult && (
            <ScrollArea className="flex-1 overflow-auto">
              <div className="space-y-6 pr-4">
                {/* Overall Band Score */}
                <div className="flex flex-col items-center gap-2 py-4">
                  <span className="text-muted-foreground text-sm font-medium">
                    Overall Band Score
                  </span>
                  <Badge className="text-3xl px-5 py-2 font-bold">
                    {result?.data?.overall_band?.toFixed(1)}
                  </Badge>
                </div>

                <Separator />

                {/* Criteria Scores Table */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    세부 점수
                  </h3>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left py-2 px-3 font-medium">평가 기준</th>
                          <th className="text-center py-2 px-3 font-medium w-[80px]">점수</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(taskResult.scores)
                          .filter(([key]) => key !== "overall_band")
                          .map(([key, score]) => (
                            <tr key={key} className="border-b last:border-b-0">
                              <td className="py-2 px-3">{criteriaLabels[key] || key}</td>
                              <td className="py-2 px-3 text-center">
                                <Badge variant="outline" className="font-semibold">
                                  {score.toFixed(1)}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        <tr className="bg-muted/30">
                          <td className="py-2 px-3 font-semibold">Overall</td>
                          <td className="py-2 px-3 text-center">
                            <Badge className="font-semibold">
                              {taskResult.scores.overall_band.toFixed(1)}
                            </Badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <Separator />

                {/* Feedback Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Feedback
                  </h3>

                  {/* Strengths */}
                  {taskResult.feedback?.strengths?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-green-600 dark:text-green-400">
                        Strengths
                      </h4>
                      <ul className="space-y-1">
                        {taskResult.feedback.strengths.map((item, idx) => (
                          <li
                            key={idx}
                            className="text-sm pl-4 border-l-2 border-green-500 py-1 text-green-700 dark:text-green-300"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {taskResult.feedback?.weaknesses?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-red-600 dark:text-red-400">
                        Weaknesses
                      </h4>
                      <ul className="space-y-1">
                        {taskResult.feedback.weaknesses.map((item, idx) => (
                          <li
                            key={idx}
                            className="text-sm pl-4 border-l-2 border-red-500 py-1 text-red-700 dark:text-red-300"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvement */}
                  {taskResult.feedback?.improvement?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        Improvement Suggestions
                      </h4>
                      <ul className="space-y-1">
                        {taskResult.feedback.improvement.map((item, idx) => (
                          <li
                            key={idx}
                            className="text-sm pl-4 border-l-2 border-blue-500 py-1 text-blue-700 dark:text-blue-300"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Sentence Corrections */}
                {taskResult.sentence_corrections?.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        Sentence Corrections
                      </h3>
                      {taskResult.sentence_corrections.map((correction, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border p-3 space-y-2"
                        >
                          <div className="text-sm">
                            <span className="text-destructive line-through">
                              {correction.original}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            <span className="text-sm text-green-600 dark:text-green-400">
                              {correction.corrected}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground pl-5">
                            {correction.reason}
                          </p>
                          {correction.band_upgrade_tip && (
                            <div className="flex items-start gap-1.5 pl-5">
                              <Lightbulb className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                              <p className="text-xs text-amber-600 dark:text-amber-400">
                                {correction.band_upgrade_tip}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
