"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, Column } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
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
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { Loader2, RefreshCw } from "lucide-react";

type ScoringStatus = "not_scored" | "auto_scored" | "under_review" | "finalized";
type SessionStatus = "not_started" | "in_progress" | "paused" | "completed" | "abandoned";
type SessionMode = "real" | "practice";

interface SessionRow {
  id: string;
  mode: SessionMode;
  status: SessionStatus;
  scoring_status: ScoringStatus;
  total_score: number | null;
  started_at: string | null;
  users: { name: string; email: string };
  packages: { title: string };
}

interface ScoringCounts {
  all: number;
  not_scored: number;
  auto_scored: number;
  under_review: number;
  finalized: number;
}

const scoringStatusLabels: Record<ScoringStatus, string> = {
  not_scored: "미채점",
  auto_scored: "자동채점",
  under_review: "리뷰중",
  finalized: "채점완료",
};

const scoringStatusColors: Record<ScoringStatus, string> = {
  not_scored: "bg-slate-100 text-slate-700",
  auto_scored: "bg-blue-100 text-blue-700",
  under_review: "bg-yellow-100 text-yellow-700",
  finalized: "bg-green-100 text-green-700",
};

const sessionStatusLabels: Record<SessionStatus, string> = {
  not_started: "시작전",
  in_progress: "진행중",
  paused: "일시정지",
  completed: "완료",
  abandoned: "중단",
};

const sessionStatusVariants: Record<SessionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  not_started: "secondary",
  in_progress: "default",
  paused: "outline",
  completed: "default",
  abandoned: "destructive",
};

const sessionStatusExtraClass: Record<SessionStatus, string> = {
  not_started: "",
  in_progress: "bg-blue-600 text-white",
  paused: "",
  completed: "bg-green-600 text-white",
  abandoned: "",
};

const modeLabels: Record<SessionMode, string> = {
  real: "실전",
  practice: "연습",
};

const scoringTabs = [
  { value: "all", label: "전체" },
  { value: "not_scored", label: "채점대기" },
  { value: "auto_scored", label: "자동채점" },
  { value: "under_review", label: "리뷰중" },
  { value: "finalized", label: "채점완료" },
] as const;

export default function SessionsPage() {
  const router = useRouter();
  const [scoringFilter, setScoringFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [scoringCounts, setScoringCounts] = useState<ScoringCounts>({
    all: 0,
    not_scored: 0,
    auto_scored: 0,
    under_review: 0,
    finalized: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("limit", pageSize.toString());
      params.set("offset", ((currentPage - 1) * pageSize).toString());

      if (scoringFilter !== "all") {
        params.set("scoring_status", scoringFilter);
      }
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (modeFilter !== "all") {
        params.set("mode", modeFilter);
      }
      if (search) {
        params.set("search", search);
      }

      const { data, error: apiError } = await api.get<{
        sessions: SessionRow[];
        scoringCounts: ScoringCounts;
        pagination: { total: number };
      }>(`/api/sessions?${params.toString()}`);
      if (apiError) throw new Error(apiError);
      setSessions(data?.sessions || []);
      setScoringCounts(data?.scoringCounts || { all: 0, not_scored: 0, auto_scored: 0, under_review: 0, finalized: 0 });
      setTotalItems(data?.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      toast.error("시험 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [scoringFilter, statusFilter, modeFilter, search, currentPage, pageSize]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [scoringFilter, statusFilter, modeFilter, search]);

  // Search debounce
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const columns: Column<SessionRow>[] = [
    {
      key: "user",
      header: "응시자",
      cell: (session) => (
        <div>
          <div className="font-medium">{session.users.name}</div>
          <div className="text-sm text-muted-foreground">{session.users.email}</div>
        </div>
      ),
    },
    {
      key: "package",
      header: "시험명",
      cell: (session) => session.packages.title,
    },
    {
      key: "mode",
      header: "모드",
      cell: (session) => (
        <Badge variant={session.mode === "real" ? "default" : "secondary"}>
          {modeLabels[session.mode]}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "응시상태",
      cell: (session) => (
        <Badge
          variant={sessionStatusVariants[session.status]}
          className={sessionStatusExtraClass[session.status]}
        >
          {sessionStatusLabels[session.status]}
        </Badge>
      ),
    },
    {
      key: "scoring_status",
      header: "채점상태",
      cell: (session) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${scoringStatusColors[session.scoring_status]}`}
        >
          {scoringStatusLabels[session.scoring_status]}
        </span>
      ),
    },
    {
      key: "total_score",
      header: "점수",
      cell: (session) => (
        <span className="font-medium">
          {session.total_score !== null ? session.total_score.toFixed(1) : "-"}
        </span>
      ),
    },
    {
      key: "started_at",
      header: "응시일",
      cell: (session) => (
        <span className="text-muted-foreground">
          {session.started_at
            ? new Date(session.started_at).toLocaleDateString("ko-KR")
            : "-"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "작업",
      cell: (session) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/sessions/${session.id}`);
          }}
        >
          상세
        </Button>
      ),
      className: "w-[80px]",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="성적 관리"
        description="학생들의 시험 응시 내역을 조회하고 채점합니다."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSessions}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        }
      />

      {/* Scoring Status Tabs + Additional Filters */}
      <div className="flex items-center gap-4">
        <Tabs value={scoringFilter} onValueChange={setScoringFilter}>
          <TabsList>
            {scoringTabs.map((tab) => {
              const count = scoringCounts[tab.value as keyof ScoringCounts];
              const isNotScored = tab.value === "not_scored";
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                  {tab.label}
                  <Badge
                    variant="secondary"
                    className={`ml-1 h-5 min-w-[20px] px-1.5 text-[10px] ${isNotScored && count > 0
                        ? "bg-yellow-200 text-yellow-800"
                        : ""
                      }`}
                  >
                    {count}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <div className="h-6 w-px bg-slate-200" />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px] h-9 text-sm">
            <SelectValue placeholder="응시상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="in_progress">진행중</SelectItem>
            <SelectItem value="completed">완료</SelectItem>
            <SelectItem value="abandoned">중단</SelectItem>
          </SelectContent>
        </Select>

        <Select value={modeFilter} onValueChange={setModeFilter}>
          <SelectTrigger className="w-[120px] h-9 text-sm">
            <SelectValue placeholder="모드" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="real">실전</SelectItem>
            <SelectItem value="practice">연습</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">불러오는 중...</span>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={sessions}
          searchPlaceholder="응시자 또는 시험명으로 검색..."
          totalItems={totalItems}
          pageSize={pageSize}
          currentPage={currentPage}
          onSearch={setSearchInput}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
}
