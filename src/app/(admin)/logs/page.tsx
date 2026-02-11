"use client";

import { PageHeader } from "@/components/common/page-header";
import { DataTable, Column } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Eye, Download } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useState } from "react";

interface LogRow {
  id: string;
  user_name: string;
  log_type: "auth" | "test_activity";
  event_type: string;
  ip_address?: string;
  timestamp: string;
}

// Mock data
const mockLogs: LogRow[] = [
  {
    id: "1",
    user_name: "김철수",
    log_type: "auth",
    event_type: "login",
    ip_address: "192.168.1.100",
    timestamp: "2026-01-27 14:30:25",
  },
  {
    id: "2",
    user_name: "이영희",
    log_type: "test_activity",
    event_type: "section_start",
    ip_address: "192.168.1.105",
    timestamp: "2026-01-27 14:28:10",
  },
  {
    id: "3",
    user_name: "이영희",
    log_type: "test_activity",
    event_type: "answer_submit",
    ip_address: "192.168.1.105",
    timestamp: "2026-01-27 14:25:30",
  },
  {
    id: "4",
    user_name: "박민수",
    log_type: "test_activity",
    event_type: "tab_leave",
    ip_address: "192.168.1.110",
    timestamp: "2026-01-27 14:20:15",
  },
  {
    id: "5",
    user_name: "박민수",
    log_type: "test_activity",
    event_type: "tab_return",
    ip_address: "192.168.1.110",
    timestamp: "2026-01-27 14:20:45",
  },
  {
    id: "6",
    user_name: "정수연",
    log_type: "auth",
    event_type: "logout",
    ip_address: "192.168.1.115",
    timestamp: "2026-01-27 14:15:00",
  },
  {
    id: "7",
    user_name: "최동현",
    log_type: "auth",
    event_type: "login_failed",
    ip_address: "192.168.1.120",
    timestamp: "2026-01-27 14:10:30",
  },
];

const logTypeLabels = {
  auth: "인증",
  test_activity: "시험 활동",
};

const eventTypeLabels: Record<string, string> = {
  login: "로그인",
  logout: "로그아웃",
  login_failed: "로그인 실패",
  session_expired: "세션 만료",
  tab_leave: "탭 이탈",
  tab_return: "탭 복귀",
  pause: "일시정지",
  resume: "재개",
  answer_submit: "답안 제출",
  section_start: "시험 시작",
  section_end: "시험 종료",
};

const eventTypeColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  login: "default",
  logout: "secondary",
  login_failed: "destructive",
  session_expired: "destructive",
  tab_leave: "destructive",
  tab_return: "default",
  pause: "secondary",
  resume: "default",
  answer_submit: "outline",
  section_start: "default",
  section_end: "secondary",
};

const columns: Column<LogRow>[] = [
  {
    key: "timestamp",
    header: "시간",
    cell: (log) => (
      <span className="text-muted-foreground font-mono text-sm">
        {log.timestamp}
      </span>
    ),
  },
  {
    key: "user",
    header: "사용자",
    cell: (log) => <span className="font-medium">{log.user_name}</span>,
  },
  {
    key: "log_type",
    header: "분류",
    cell: (log) => (
      <Badge variant="outline">{logTypeLabels[log.log_type]}</Badge>
    ),
  },
  {
    key: "event_type",
    header: "이벤트",
    cell: (log) => (
      <Badge variant={eventTypeColors[log.event_type] || "outline"}>
        {eventTypeLabels[log.event_type] || log.event_type}
      </Badge>
    ),
  },
  {
    key: "ip",
    header: "IP 주소",
    cell: (log) => (
      <span className="text-muted-foreground font-mono text-sm">
        {log.ip_address || "-"}
      </span>
    ),
  },
  {
    key: "actions",
    header: "",
    cell: () => (
      <Button variant="ghost" size="sm">
        <Eye className="h-4 w-4" />
      </Button>
    ),
    className: "w-[50px]",
  },
];

export default function LogsPage() {
  const [date, setDate] = useState<Date>();

  return (
    <div className="space-y-6">
      <PageHeader
        title="활동 로그"
        description="사용자 인증 및 시험 활동 로그를 조회합니다."
        actions={
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            내보내기
          </Button>
        }
      />

      <div className="flex gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: ko }) : "날짜 선택"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="분류" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 분류</SelectItem>
            <SelectItem value="auth">인증</SelectItem>
            <SelectItem value="test_activity">시험 활동</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="이벤트" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 이벤트</SelectItem>
            <SelectItem value="login">로그인</SelectItem>
            <SelectItem value="logout">로그아웃</SelectItem>
            <SelectItem value="login_failed">로그인 실패</SelectItem>
            <SelectItem value="tab_leave">탭 이탈</SelectItem>
            <SelectItem value="answer_submit">답안 제출</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={mockLogs}
        searchPlaceholder="사용자명 또는 IP로 검색..."
        totalItems={45678}
      />
    </div>
  );
}
