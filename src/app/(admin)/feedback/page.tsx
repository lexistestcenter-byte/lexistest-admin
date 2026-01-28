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
import { MoreHorizontal, Eye, Pencil, MessageSquare } from "lucide-react";

interface FeedbackRow {
  id: string;
  user_name: string;
  exam_title: string;
  section_type: "writing" | "speaking";
  feedback_type: "ai_writing" | "ai_speaking" | "teacher";
  task?: string;
  band_score: number;
  has_teacher_comment: boolean;
  created_at: string;
}

// Mock data
const mockFeedback: FeedbackRow[] = [
  {
    id: "1",
    user_name: "김철수",
    exam_title: "IELTS Academic Mock Test 1",
    section_type: "writing",
    feedback_type: "ai_writing",
    task: "Task 2",
    band_score: 6.5,
    has_teacher_comment: true,
    created_at: "2026-01-27 15:30",
  },
  {
    id: "2",
    user_name: "이영희",
    exam_title: "Writing Task 2 Practice",
    section_type: "writing",
    feedback_type: "ai_writing",
    task: "Task 2",
    band_score: 6.0,
    has_teacher_comment: false,
    created_at: "2026-01-27 14:00",
  },
  {
    id: "3",
    user_name: "박민수",
    exam_title: "Speaking Practice Set 1",
    section_type: "speaking",
    feedback_type: "ai_speaking",
    band_score: 7.0,
    has_teacher_comment: true,
    created_at: "2026-01-26 16:00",
  },
  {
    id: "4",
    user_name: "정수연",
    exam_title: "IELTS Academic Mock Test 1",
    section_type: "writing",
    feedback_type: "teacher",
    task: "Task 1",
    band_score: 5.5,
    has_teacher_comment: true,
    created_at: "2026-01-25 11:00",
  },
];

const sectionColors = {
  writing: "bg-white text-amber-500 border border-amber-300",
  speaking: "bg-white text-violet-500 border border-violet-300",
};

const feedbackTypeLabels = {
  ai_writing: "AI (Writing)",
  ai_speaking: "AI (Speaking)",
  teacher: "강사",
};

const columns: Column<FeedbackRow>[] = [
  {
    key: "user",
    header: "응시자",
    cell: (feedback) => (
      <span className="font-medium">{feedback.user_name}</span>
    ),
  },
  {
    key: "exam",
    header: "시험",
    cell: (feedback) => (
      <div>
        <div>{feedback.exam_title}</div>
        {feedback.task && (
          <div className="text-sm text-muted-foreground">{feedback.task}</div>
        )}
      </div>
    ),
  },
  {
    key: "section",
    header: "섹션",
    cell: (feedback) => (
      <span
        className={`px-2 py-1 text-xs rounded ${
          sectionColors[feedback.section_type]
        }`}
      >
        {feedback.section_type === "writing" ? "Writing" : "Speaking"}
      </span>
    ),
  },
  {
    key: "type",
    header: "피드백 유형",
    cell: (feedback) => (
      <Badge
        variant={feedback.feedback_type === "teacher" ? "default" : "secondary"}
      >
        {feedbackTypeLabels[feedback.feedback_type]}
      </Badge>
    ),
  },
  {
    key: "score",
    header: "점수",
    cell: (feedback) => (
      <span className="font-medium">{feedback.band_score.toFixed(1)}</span>
    ),
  },
  {
    key: "teacher",
    header: "강사 첨삭",
    cell: (feedback) => (
      <Badge variant={feedback.has_teacher_comment ? "default" : "outline"}>
        {feedback.has_teacher_comment ? "있음" : "없음"}
      </Badge>
    ),
  },
  {
    key: "created_at",
    header: "생성일",
    cell: (feedback) => (
      <span className="text-muted-foreground">{feedback.created_at}</span>
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
            <Eye className="mr-2 h-4 w-4" />
            상세 보기
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Pencil className="mr-2 h-4 w-4" />
            피드백 수정
          </DropdownMenuItem>
          <DropdownMenuItem>
            <MessageSquare className="mr-2 h-4 w-4" />
            강사 코멘트 추가
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    className: "w-[50px]",
  },
];

export default function FeedbackPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="피드백 관리"
        description="Writing/Speaking 피드백을 조회하고 관리합니다."
      />

      <div className="flex gap-4">
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="섹션" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 섹션</SelectItem>
            <SelectItem value="writing">Writing</SelectItem>
            <SelectItem value="speaking">Speaking</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="피드백 유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 유형</SelectItem>
            <SelectItem value="ai">AI 피드백</SelectItem>
            <SelectItem value="teacher">강사 피드백</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="강사 첨삭" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="yes">첨삭 완료</SelectItem>
            <SelectItem value="no">첨삭 대기</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={mockFeedback}
        searchPlaceholder="응시자 이름으로 검색..."
        totalItems={3456}
      />
    </div>
  );
}
