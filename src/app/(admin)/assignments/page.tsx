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
import { MoreHorizontal, Pencil, Trash2, Link2, Users, Bell } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AssignmentRow {
  id: string;
  title: string;
  exam_title: string;
  group_name?: string;
  assignment_type: "homework" | "mock_test";
  mode: "practice" | "real";
  due_date?: string;
  completed_count: number;
  total_count: number;
  is_published: boolean;
  created_at: string;
}

// Mock data
const mockAssignments: AssignmentRow[] = [
  {
    id: "1",
    title: "1월 4주차 모의고사",
    exam_title: "IELTS Academic Mock Test 1",
    group_name: "2026년 1월 기초반",
    assignment_type: "mock_test",
    mode: "real",
    due_date: "2026-01-31",
    completed_count: 10,
    total_count: 15,
    is_published: true,
    created_at: "2026-01-20",
  },
  {
    id: "2",
    title: "Writing Task 2 숙제",
    exam_title: "Writing Task 2 Practice",
    group_name: "Writing 특강반",
    assignment_type: "homework",
    mode: "practice",
    due_date: "2026-01-28",
    completed_count: 15,
    total_count: 20,
    is_published: true,
    created_at: "2026-01-15",
  },
  {
    id: "3",
    title: "Listening 집중 연습",
    exam_title: "Listening Practice Set 1",
    group_name: "2026년 1월 중급반",
    assignment_type: "homework",
    mode: "practice",
    completed_count: 8,
    total_count: 12,
    is_published: true,
    created_at: "2026-01-10",
  },
  {
    id: "4",
    title: "2월 진단 테스트",
    exam_title: "IELTS Academic Mock Test 2",
    assignment_type: "mock_test",
    mode: "real",
    due_date: "2026-02-05",
    completed_count: 0,
    total_count: 30,
    is_published: false,
    created_at: "2026-01-25",
  },
];

const typeLabels = {
  homework: "숙제",
  mock_test: "모의고사",
};

const columns: Column<AssignmentRow>[] = [
  {
    key: "assignment",
    header: "과제",
    cell: (assignment) => (
      <div>
        <div className="font-medium">{assignment.title}</div>
        <div className="text-sm text-muted-foreground">
          {assignment.exam_title}
        </div>
      </div>
    ),
  },
  {
    key: "group",
    header: "대상 그룹",
    cell: (assignment) => (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        {assignment.group_name || "전체"}
      </div>
    ),
  },
  {
    key: "type",
    header: "유형",
    cell: (assignment) => (
      <div className="flex flex-col gap-1">
        <Badge
          variant={
            assignment.assignment_type === "mock_test" ? "default" : "secondary"
          }
        >
          {typeLabels[assignment.assignment_type]}
        </Badge>
        <Badge variant="outline">
          {assignment.mode === "real" ? "실전" : "연습"}
        </Badge>
      </div>
    ),
  },
  {
    key: "progress",
    header: "진행률",
    cell: (assignment) => {
      const progress =
        (assignment.completed_count / assignment.total_count) * 100;
      return (
        <div className="space-y-1 min-w-[100px]">
          <div className="flex justify-between text-sm">
            <span>{assignment.completed_count}명</span>
            <span className="text-muted-foreground">
              / {assignment.total_count}명
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      );
    },
  },
  {
    key: "due_date",
    header: "마감일",
    cell: (assignment) => (
      <span className="text-muted-foreground">
        {assignment.due_date || "없음"}
      </span>
    ),
  },
  {
    key: "status",
    header: "상태",
    cell: (assignment) => (
      <Badge variant={assignment.is_published ? "default" : "secondary"}>
        {assignment.is_published ? "공개" : "비공개"}
      </Badge>
    ),
  },
  {
    key: "actions",
    header: "",
    cell: () => (
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
            <Pencil className="mr-2 h-4 w-4" />
            수정
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link2 className="mr-2 h-4 w-4" />
            응시 링크 관리
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell className="mr-2 h-4 w-4" />
            알림 발송
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    className: "w-[50px]",
  },
];

export default function AssignmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="숙제/모의고사"
        description="학생 그룹별 숙제와 모의고사를 배포하고 관리합니다."
        createHref="/assignments/new"
        createLabel="과제 배포"
      />

      <div className="flex gap-4">
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 유형</SelectItem>
            <SelectItem value="homework">숙제</SelectItem>
            <SelectItem value="mock_test">모의고사</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="published">공개</SelectItem>
            <SelectItem value="draft">비공개</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={mockAssignments}
        searchPlaceholder="과제명 또는 시험명으로 검색..."
        totalItems={89}
      />
    </div>
  );
}
