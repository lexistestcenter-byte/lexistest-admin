"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable, Column } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Loader2 } from "lucide-react";

interface StudentInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  target_score?: number;
  avatar_url?: string;
  groups: string[];
  package_count: number;
  last_login_at?: string;
  created_at: string;
}

interface SessionRow {
  id: string;
  mode: string;
  status: string;
  scoring_status: string;
  total_score?: number;
  started_at: string;
  packages: {
    title: string;
  };
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

function getInitials(name: string) {
  return name.slice(0, 2);
}

function getModeBadgeVariant(mode: string): "default" | "secondary" | "outline" {
  switch (mode) {
    case "full":
      return "default";
    case "section":
      return "secondary";
    default:
      return "outline";
  }
}

function getModeLabel(mode: string): string {
  switch (mode) {
    case "full":
      return "풀시험";
    case "section":
      return "섹션";
    default:
      return mode;
  }
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "completed":
      return "default";
    case "in_progress":
      return "secondary";
    case "abandoned":
      return "destructive";
    default:
      return "outline";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "completed":
      return "완료";
    case "in_progress":
      return "진행중";
    case "abandoned":
      return "포기";
    case "not_started":
      return "미시작";
    default:
      return status;
  }
}

function getScoringBadgeVariant(scoringStatus: string): "default" | "secondary" | "outline" | "destructive" {
  switch (scoringStatus) {
    case "scored":
      return "default";
    case "pending":
      return "secondary";
    case "scoring":
      return "outline";
    case "error":
      return "destructive";
    default:
      return "outline";
  }
}

function getScoringLabel(scoringStatus: string): string {
  switch (scoringStatus) {
    case "scored":
      return "채점완료";
    case "pending":
      return "대기중";
    case "scoring":
      return "채점중";
    case "error":
      return "오류";
    case "not_scored":
      return "미채점";
    default:
      return scoringStatus;
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StudentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: 10,
    offset: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = useCallback(
    async (page: number, size: number) => {
      try {
        setLoading(true);
        const offset = (page - 1) * size;
        const res = await fetch(
          `/api/students/${id}/sessions?limit=${size}&offset=${offset}`
        );
        if (!res.ok) {
          throw new Error("데이터를 불러오는데 실패했습니다.");
        }
        const data = await res.json();
        setStudent(data.student);
        setSessions(data.sessions || []);
        setPagination(
          data.pagination || { total: 0, limit: size, offset }
        );
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "데이터를 불러오는데 실패했습니다."
        );
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, [fetchData, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const sessionColumns: Column<SessionRow>[] = [
    {
      key: "title",
      header: "시험명",
      cell: (session) => (
        <span className="font-medium">{session.packages?.title || "-"}</span>
      ),
    },
    {
      key: "mode",
      header: "모드",
      cell: (session) => (
        <Badge variant={getModeBadgeVariant(session.mode)}>
          {getModeLabel(session.mode)}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "응시상태",
      cell: (session) => (
        <Badge variant={getStatusBadgeVariant(session.status)}>
          {getStatusLabel(session.status)}
        </Badge>
      ),
    },
    {
      key: "scoring_status",
      header: "채점상태",
      cell: (session) => (
        <Badge variant={getScoringBadgeVariant(session.scoring_status)}>
          {getScoringLabel(session.scoring_status)}
        </Badge>
      ),
    },
    {
      key: "total_score",
      header: "점수",
      cell: (session) => (
        <span className="font-medium">
          {session.total_score != null ? session.total_score : "-"}
        </span>
      ),
    },
    {
      key: "started_at",
      header: "응시일",
      cell: (session) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(session.started_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (session) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/sessions/${session.id}`)}
        >
          상세
        </Button>
      ),
      className: "w-[80px]",
    },
  ];

  if (loading && !student) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => router.push("/students")}
        >
          <ArrowLeft className="h-4 w-4" />
          학생 관리
        </Button>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">학생 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="gap-2"
        onClick={() => router.push("/students")}
      >
        <ArrowLeft className="h-4 w-4" />
        학생 관리
      </Button>

      {/* Student Info Card */}
      <div className="rounded-lg border p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={student.avatar_url} />
            <AvatarFallback className="text-lg">
              {getInitials(student.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">{student.name}</h2>
            <p className="text-muted-foreground">{student.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div>
            <Label className="text-muted-foreground text-xs">전화번호</Label>
            <p className="font-medium">{student.phone || "-"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">목표 점수</Label>
            <p className="font-medium">
              {student.target_score ? `Band ${student.target_score}` : "-"}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">가입일</Label>
            <p className="font-medium">{formatDate(student.created_at)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">마지막 접속</Label>
            <p className="font-medium">
              {student.last_login_at ? formatDate(student.last_login_at) : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">시험 내역</TabsTrigger>
          <TabsTrigger value="info">기본 정보</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="mt-4">
          <DataTable
            columns={sessionColumns}
            data={sessions}
            searchPlaceholder="시험명으로 검색..."
            totalItems={pagination.total}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </TabsContent>

        <TabsContent value="info" className="mt-4">
          <div className="rounded-lg border p-6 space-y-6">
            <div>
              <Label className="text-muted-foreground text-xs">이름</Label>
              <p className="font-medium">{student.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">이메일</Label>
              <p className="font-medium">{student.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">전화번호</Label>
              <p className="font-medium">{student.phone || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">목표 점수</Label>
              <p className="font-medium">
                {student.target_score ? `Band ${student.target_score}` : "-"}
              </p>
            </div>

            <div className="pt-4 border-t">
              <Label className="text-muted-foreground text-xs">소속 그룹</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {student.groups && student.groups.length > 0 ? (
                  student.groups.map((group, idx) => (
                    <Badge key={idx} variant="secondary">
                      {group}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">소속 그룹 없음</span>
                )}
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label className="text-muted-foreground text-xs">
                패키지 접근권한
              </Label>
              <p className="font-medium">
                {student.package_count}개 패키지 이용 가능
              </p>
            </div>

            <div className="pt-4 border-t">
              <Label className="text-muted-foreground text-xs">가입일</Label>
              <p className="font-medium">{formatDate(student.created_at)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">
                마지막 접속
              </Label>
              <p className="font-medium">
                {student.last_login_at
                  ? formatDate(student.last_login_at)
                  : "-"}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
