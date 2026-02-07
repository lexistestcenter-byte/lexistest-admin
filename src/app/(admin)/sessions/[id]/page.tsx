"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Clock,
  Save,
  Send,
  Mail,
  FileText,
  MessageSquare,
} from "lucide-react";
import { api } from "@/lib/api/client";

// --- Types ---

interface QuestionSnapshot {
  question_code: string;
  question_type: string;
  question_format: string;
  content: string;
  title: string;
  points: number;
}

interface SessionResponse {
  id: string;
  question_id: string;
  response_type: string;
  answer_content: string | null;
  selected_options: { label: string }[] | null;
  auto_score: number | null;
  admin_score: number | null;
  final_score: number | null;
  admin_feedback: string | null;
  time_spent_seconds: number | null;
  question_snapshot: QuestionSnapshot;
}

interface SessionData {
  id: string;
  user_id: string;
  package_id: string;
  mode: string;
  status: string;
  scoring_status: string;
  total_score: number | null;
  started_at: string | null;
  ended_at: string | null;
  reviewer_notes: string | null;
  users: { name: string; email: string };
  packages: { title: string };
  responses: SessionResponse[];
}

// --- Label / Color Maps ---

const statusLabels: Record<string, string> = {
  not_started: "시작 전",
  in_progress: "진행 중",
  paused: "일시정지",
  completed: "완료",
  abandoned: "중단",
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  not_started: "secondary",
  in_progress: "default",
  paused: "outline",
  completed: "default",
  abandoned: "destructive",
};

const scoringStatusLabels: Record<string, string> = {
  pending: "채점 대기",
  auto_scored: "자동 채점 완료",
  under_review: "검토 중",
  finalized: "채점 완료",
};

const scoringStatusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  auto_scored: "outline",
  under_review: "default",
  finalized: "default",
};

const modeLabels: Record<string, string> = {
  practice: "연습",
  real: "실전",
};

const questionTypeLabels: Record<string, string> = {
  listening: "듣기",
  reading: "읽기",
  writing: "쓰기",
  speaking: "말하기",
};

const questionFormatLabels: Record<string, string> = {
  mcq_single: "객관식(단일)",
  mcq_multiple: "객관식(복수)",
  fill_blank: "빈칸 채우기",
  short_answer: "단답형",
  long_answer: "서술형",
  matching: "매칭",
  ordering: "순서 배열",
  true_false_ng: "참/거짓/NG",
  essay: "에세이",
};

// --- Helpers ---

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSeconds(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}분 ${s}초`;
}

// --- Main Component ---

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review tab state
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [scoringStatus, setScoringStatus] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  // Response scoring state: { [responseId]: { admin_score, admin_feedback } }
  const [responseEdits, setResponseEdits] = useState<
    Record<string, { admin_score: string; admin_feedback: string }>
  >({});
  const [savingResponseId, setSavingResponseId] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: apiError } = await api.get<{ session: SessionData }>(`/api/sessions/${id}`);
      if (apiError || !data?.session) throw new Error(apiError || "세션 정보를 불러올 수 없습니다.");
      const s = data.session;
      setSession(s);
      setReviewerNotes(s.reviewer_notes || "");
      setScoringStatus(s.scoring_status || "pending");

      // Initialize response edits
      const edits: Record<string, { admin_score: string; admin_feedback: string }> = {};
      for (const r of s.responses) {
        edits[r.id] = {
          admin_score: r.admin_score !== null ? String(r.admin_score) : "",
          admin_feedback: r.admin_feedback || "",
        };
      }
      setResponseEdits(edits);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Save reviewer notes + scoring_status
  const handleSaveReview = async () => {
    setSavingReview(true);
    try {
      const { error: apiError } = await api.patch(`/api/sessions/${id}`, {
        reviewer_notes: reviewerNotes,
        scoring_status: scoringStatus,
      });
      if (apiError) throw new Error(apiError);
      toast.success("리뷰가 저장되었습니다.");
      await fetchSession();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSavingReview(false);
    }
  };

  // Save individual response scoring
  const handleSaveResponse = async (responseId: string) => {
    const edit = responseEdits[responseId];
    if (!edit) return;

    setSavingResponseId(responseId);
    try {
      const { error: apiError } = await api.patch(`/api/sessions/${id}/responses/${responseId}`, {
        admin_score: edit.admin_score !== "" ? parseFloat(edit.admin_score) : null,
        admin_feedback: edit.admin_feedback || null,
      });
      if (apiError) throw new Error(apiError);
      toast.success("채점이 저장되었습니다.");
      await fetchSession();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "채점 저장에 실패했습니다.");
    } finally {
      setSavingResponseId(null);
    }
  };

  // Finalize scoring
  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      const { error: apiError } = await api.post(`/api/sessions/${id}/finalize`, {});
      if (apiError) throw new Error(apiError);
      toast.success("채점이 완료되었습니다.");
      await fetchSession();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "채점 완료 처리에 실패했습니다.");
    } finally {
      setFinalizing(false);
    }
  };

  // Update a single response edit field
  const updateResponseEdit = (
    responseId: string,
    field: "admin_score" | "admin_feedback",
    value: string
  ) => {
    setResponseEdits((prev) => ({
      ...prev,
      [responseId]: {
        ...prev[responseId],
        [field]: value,
      },
    }));
  };

  // Check if all answer-type responses have a final_score
  const answerResponses = session?.responses.filter((r) => r.response_type === "answer") || [];
  const allScored = answerResponses.length > 0 && answerResponses.every((r) => r.final_score !== null);

  // --- Render ---

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="space-y-6">
        <Link
          href="/sessions"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          시험 목록
        </Link>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground">{error || "세션을 찾을 수 없습니다."}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/sessions")}>
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/sessions"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        시험 목록
      </Link>

      {/* Session Summary Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            {/* Left */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold">{session.users.name}</h1>
                <Badge variant={session.mode === "real" ? "default" : "secondary"}>
                  {modeLabels[session.mode] || session.mode}
                </Badge>
                <Badge variant={statusColors[session.status] || "secondary"}>
                  {statusLabels[session.status] || session.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {session.users.email}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  {session.packages.title}
                </span>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-start gap-8">
              <div className="text-right space-y-1">
                <Badge
                  variant={scoringStatusColors[session.scoring_status] || "secondary"}
                  className="text-sm px-3 py-1"
                >
                  {scoringStatusLabels[session.scoring_status] || session.scoring_status}
                </Badge>
                <div className="text-3xl font-bold tabular-nums">
                  {session.total_score !== null ? session.total_score : "-"}
                </div>
                <div className="text-xs text-muted-foreground">총점</div>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>시작: {formatDate(session.started_at)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>종료: {formatDate(session.ended_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="review">
        <TabsList>
          <TabsTrigger value="review">
            <MessageSquare className="h-4 w-4 mr-1.5" />
            전체 리뷰
          </TabsTrigger>
          <TabsTrigger value="responses">
            <FileText className="h-4 w-4 mr-1.5" />
            문제별 채점
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overall Review */}
        <TabsContent value="review" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>전체 리뷰</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>채점 상태</Label>
                <Select value={scoringStatus} onValueChange={setScoringStatus}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="채점 상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">채점 대기</SelectItem>
                    <SelectItem value="auto_scored">자동 채점 완료</SelectItem>
                    <SelectItem value="under_review">검토 중</SelectItem>
                    <SelectItem value="finalized">채점 완료</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>리뷰어 메모</Label>
                <Textarea
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="전체적인 리뷰 내용을 작성하세요..."
                  rows={6}
                />
              </div>

              <Button onClick={handleSaveReview} disabled={savingReview}>
                {savingReview ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                저장
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Response Scoring */}
        <TabsContent value="responses" className="mt-4 space-y-4">
          {answerResponses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              채점할 응답이 없습니다.
            </div>
          ) : (
            answerResponses.map((response, idx) => {
              const snapshot = response.question_snapshot;
              const edit = responseEdits[response.id];
              const isReviewed = response.final_score !== null;

              return (
                <Card
                  key={response.id}
                  className={
                    isReviewed
                      ? "border-green-200 dark:border-green-800"
                      : "border-yellow-200 dark:border-yellow-800"
                  }
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold">#{idx + 1}</span>
                        <Badge variant="outline">
                          {questionTypeLabels[snapshot.question_type] || snapshot.question_type}
                        </Badge>
                        <Badge variant="secondary">
                          {questionFormatLabels[snapshot.question_format] || snapshot.question_format}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {snapshot.points}점
                        </span>
                        {snapshot.question_code && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {snapshot.question_code}
                          </span>
                        )}
                      </div>
                      <div>
                        {isReviewed ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                            채점 완료
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-sm text-yellow-600 dark:text-yellow-400">
                            <Clock className="h-4 w-4" />
                            채점 대기
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Question Content */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">문제 내용</Label>
                      <div className="rounded-md bg-muted/50 p-3 text-sm whitespace-pre-wrap">
                        {snapshot.content || snapshot.title || "-"}
                      </div>
                    </div>

                    {/* Student Answer */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">학생 답변</Label>
                      <div className="rounded-md border bg-background p-3 text-sm whitespace-pre-wrap">
                        {response.answer_content
                          ? response.answer_content
                          : response.selected_options && response.selected_options.length > 0
                          ? response.selected_options.map((o) => o.label).join(", ")
                          : "-"}
                      </div>
                      {response.time_spent_seconds !== null && (
                        <p className="text-xs text-muted-foreground">
                          소요 시간: {formatSeconds(response.time_spent_seconds)}
                        </p>
                      )}
                    </div>

                    {/* Scoring Row */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 items-start rounded-md border p-4 bg-muted/30">
                      {/* Auto Score */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">자동 점수</Label>
                        <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm tabular-nums">
                          {response.auto_score !== null ? response.auto_score : "-"}
                        </div>
                      </div>

                      {/* Admin Score */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">관리자 점수</Label>
                        <Input
                          type="number"
                          step={0.5}
                          min={0}
                          max={snapshot.points}
                          value={edit?.admin_score ?? ""}
                          onChange={(e) =>
                            updateResponseEdit(response.id, "admin_score", e.target.value)
                          }
                          placeholder={`0 ~ ${snapshot.points}`}
                        />
                      </div>

                      {/* Final Score Display */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">최종 점수</Label>
                        <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm font-semibold tabular-nums">
                          {response.final_score !== null ? response.final_score : "-"}
                          <span className="ml-1 font-normal text-muted-foreground">
                            / {snapshot.points}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Feedback */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">피드백</Label>
                      <Textarea
                        value={edit?.admin_feedback ?? ""}
                        onChange={(e) =>
                          updateResponseEdit(response.id, "admin_feedback", e.target.value)
                        }
                        placeholder="학생에게 전달할 피드백을 작성하세요..."
                        rows={3}
                      />
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleSaveResponse(response.id)}
                        disabled={savingResponseId === response.id}
                      >
                        {savingResponseId === response.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        채점 저장
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}

          {/* Finalize Button */}
          {answerResponses.length > 0 && (
            <div className="flex justify-end pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="lg" disabled={!allScored || finalizing}>
                    {finalizing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    채점 완료
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>채점을 완료하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                      채점을 완료하면 최종 점수가 확정되고 학생에게 결과가 공개됩니다.
                      이 작업은 되돌리기 어렵습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={handleFinalize}>
                      채점 완료
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
