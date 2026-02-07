"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Save,
  Trash2,
  Loader2,
  Users,
  User,
  Package,
  Calendar,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { PackageAssignment } from "@/types";
import { useBreadcrumb } from "@/components/layout/breadcrumb-context";

export default function AssignmentDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { setOverride, clearOverride } = useBreadcrumb();

  // Data
  const [assignment, setAssignment] = useState<PackageAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Edit fields
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [memo, setMemo] = useState("");

  // Save/Delete states
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load assignment
  const loadAssignment = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await api.get<PackageAssignment>(
        `/api/assignments/${id}`
      );
      if (error) throw new Error(error);
      if (!data) throw new Error("데이터가 없습니다.");

      setAssignment(data);
      setScheduledStart(
        data.scheduled_start
          ? new Date(data.scheduled_start).toISOString().slice(0, 16)
          : ""
      );
      setScheduledEnd(
        data.scheduled_end
          ? new Date(data.scheduled_end).toISOString().slice(0, 16)
          : ""
      );
      setIsActive(data.is_active);
      setMemo(data.memo || "");

      // Breadcrumb override
      const label =
        data.assignment_type === "group"
          ? data.group_name || "그룹 할당"
          : data.user_name || "개인 할당";
      setOverride(`/assignments/${id}`, label);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "로드 실패");
    } finally {
      setLoading(false);
    }
  }, [id, setOverride]);

  useEffect(() => {
    loadAssignment();
    return () => clearOverride(`/assignments/${id}`);
  }, [loadAssignment, clearOverride, id]);

  // Save handler
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        scheduled_start: scheduledStart || null,
        scheduled_end: scheduledEnd || null,
        is_active: isActive,
        memo: memo.trim() || null,
      };

      const { error } = await api.put(`/api/assignments/${id}`, payload);
      if (error) throw new Error(error);

      toast.success("할당이 수정되었습니다.");
      loadAssignment();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "수정 실패");
    } finally {
      setSaving(false);
    }
  };

  // Delete (deactivate) handler
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await api.delete(`/api/assignments/${id}`);
      if (error) throw new Error(error);

      toast.success("할당이 비활성화되었습니다.");
      router.push("/assignments");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "비활성화 실패");
    } finally {
      setDeleting(false);
    }
  };

  // Format date
  const formatDate = (d?: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">불러오는 중...</span>
      </div>
    );
  }

  if (loadError || !assignment) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive font-medium">
            {loadError || "할당을 찾을 수 없습니다."}
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/assignments">목록으로 돌아가기</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="할당 상세"
        description="할당 정보를 확인하고 수정합니다."
        actions={
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  {deleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  비활성화
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>할당을 비활성화하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    이 할당을 비활성화하면 대상 학생의 패키지 접근 권한이 해제됩니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    비활성화
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="outline" asChild>
              <Link href="/assignments">
                <ArrowLeft className="mr-2 h-4 w-4" />
                목록으로
              </Link>
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Assignment Info (read-only) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>할당 정보</CardTitle>
              <CardDescription>할당의 기본 정보입니다. (읽기 전용)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">패키지</p>
                  <p className="font-medium">{assignment.package_title}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {assignment.assignment_type === "group" ? (
                  <Users className="h-5 w-5 text-blue-500" />
                ) : (
                  <User className="h-5 w-5 text-violet-500" />
                )}
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">대상</p>
                  <p className="font-medium">
                    {assignment.assignment_type === "group"
                      ? assignment.group_name
                      : assignment.user_name}
                  </p>
                  {assignment.assignment_type === "individual" &&
                    assignment.user_email && (
                      <p className="text-sm text-muted-foreground">
                        {assignment.user_email}
                      </p>
                    )}
                </div>
                <Badge
                  variant="outline"
                  className={
                    assignment.assignment_type === "group"
                      ? "bg-blue-100 text-blue-700 border-blue-200"
                      : "bg-violet-100 text-violet-700 border-violet-200"
                  }
                >
                  {assignment.assignment_type === "group" ? "그룹" : "개인"}
                </Badge>
              </div>

              {assignment.assignment_type === "group" &&
                assignment.member_count !== undefined && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">그룹 인원</p>
                      <p className="font-medium">
                        {assignment.member_count}명
                      </p>
                    </div>
                  </div>
                )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">할당자</p>
                  <p className="font-medium text-sm">
                    {assignment.assigned_by_name || "-"}
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">생성일</p>
                  <p className="font-medium text-sm">
                    {formatDate(assignment.created_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Editable fields */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>시험 기간</CardTitle>
              <CardDescription>시험 응시 가능 기간을 설정합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>시작일시</Label>
                <div className="relative">
                  <Input
                    type="datetime-local"
                    value={scheduledStart}
                    onChange={(e) => setScheduledStart(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>종료일시</Label>
                <div className="relative">
                  <Input
                    type="datetime-local"
                    value={scheduledEnd}
                    onChange={(e) => setScheduledEnd(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>활성 상태</Label>
                  <p className="text-xs text-muted-foreground">
                    비활성 시 대상 학생의 접근 권한이 해제됩니다.
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>메모</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="할당에 대한 메모를 입력하세요..."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
