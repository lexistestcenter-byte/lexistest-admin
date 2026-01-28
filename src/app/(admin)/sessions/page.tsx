"use client";

import { PageHeader } from "@/components/common/page-header";
import { DataTable, Column } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, Eye, BarChart3, Clock, RefreshCw } from "lucide-react";

interface SessionRow {
  id: string;
  user_name: string;
  exam_title: string;
  mode: "practice" | "real";
  status: "not_started" | "in_progress" | "paused" | "completed" | "abandoned";
  current_section?: string;
  time_remaining?: string;
  started_at?: string;
  score?: number;
}

// Mock data
const mockSessions: SessionRow[] = [
  {
    id: "1",
    user_name: "김철수",
    exam_title: "IELTS Academic Mock Test 1",
    mode: "real",
    status: "completed",
    started_at: "2026-01-27 14:00",
    score: 7.0,
  },
  {
    id: "2",
    user_name: "이영희",
    exam_title: "Listening Practice Set 3",
    mode: "practice",
    status: "in_progress",
    current_section: "Listening",
    time_remaining: "15:30",
    started_at: "2026-01-27 14:15",
  },
  {
    id: "3",
    user_name: "박민수",
    exam_title: "Writing Task 2 Practice",
    mode: "practice",
    status: "paused",
    current_section: "Writing",
    time_remaining: "35:00",
    started_at: "2026-01-27 13:00",
  },
  {
    id: "4",
    user_name: "정수연",
    exam_title: "Speaking Practice Set 1",
    mode: "real",
    status: "abandoned",
    started_at: "2026-01-27 12:00",
  },
  {
    id: "5",
    user_name: "최동현",
    exam_title: "Reading Passage Practice",
    mode: "practice",
    status: "completed",
    started_at: "2026-01-27 11:00",
    score: 7.5,
  },
];

const statusLabels = {
  not_started: "시작 전",
  in_progress: "진행 중",
  paused: "일시정지",
  completed: "완료",
  abandoned: "중단",
};

const statusColors = {
  not_started: "secondary",
  in_progress: "default",
  paused: "outline",
  completed: "default",
  abandoned: "destructive",
} as const;

const modeLabels = {
  practice: "연습",
  real: "실전",
};

const columns: Column<SessionRow>[] = [
  {
    key: "user",
    header: "응시자",
    cell: (session) => <span className="font-medium">{session.user_name}</span>,
  },
  {
    key: "exam",
    header: "시험",
    cell: (session) => session.exam_title,
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
    header: "상태",
    cell: (session) => (
      <Badge variant={statusColors[session.status]}>
        {statusLabels[session.status]}
      </Badge>
    ),
  },
  {
    key: "progress",
    header: "진행 상황",
    cell: (session) => (
      <div className="text-sm">
        {session.status === "in_progress" || session.status === "paused" ? (
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span>{session.current_section}</span>
            <span className="text-muted-foreground">
              ({session.time_remaining} 남음)
            </span>
          </div>
        ) : session.score !== undefined ? (
          <div className="flex items-center gap-2">
            <BarChart3 className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">{session.score.toFixed(1)}</span>
          </div>
        ) : (
          "-"
        )}
      </div>
    ),
  },
  {
    key: "started_at",
    header: "시작 시간",
    cell: (session) => (
      <span className="text-muted-foreground">{session.started_at || "-"}</span>
    ),
  },
  {
    key: "actions",
    header: "",
    cell: (session) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>작업</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Eye className="mr-2 h-4 w-4" />
            상세 보기
          </DropdownMenuItem>
          {session.status === "completed" && (
            <DropdownMenuItem>
              <BarChart3 className="mr-2 h-4 w-4" />
              성적 확인
            </DropdownMenuItem>
          )}
          {(session.status === "in_progress" ||
            session.status === "paused") && (
            <DropdownMenuItem>
              <RefreshCw className="mr-2 h-4 w-4" />
              세션 초기화
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    className: "w-[50px]",
  },
];

export default function SessionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="응시 현황"
        description="시험 응시 세션을 조회하고 관리합니다."
      />

      <div className="flex gap-4">
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="in_progress">진행 중</SelectItem>
            <SelectItem value="completed">완료</SelectItem>
            <SelectItem value="paused">일시정지</SelectItem>
            <SelectItem value="abandoned">중단</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="모드" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 모드</SelectItem>
            <SelectItem value="real">실전</SelectItem>
            <SelectItem value="practice">연습</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={mockSessions}
        searchPlaceholder="응시자 또는 시험명으로 검색..."
        totalItems={8456}
      />
    </div>
  );
}
