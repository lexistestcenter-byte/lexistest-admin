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
import { MoreHorizontal, Eye, Download, Pencil } from "lucide-react";

interface ScoreRow {
  id: string;
  user_name: string;
  exam_title: string;
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  overall: number;
  adjusted?: boolean;
  scored_at: string;
}

// Mock data
const mockScores: ScoreRow[] = [
  {
    id: "1",
    user_name: "김철수",
    exam_title: "IELTS Academic Mock Test 1",
    listening: 7.0,
    reading: 7.5,
    writing: 6.5,
    speaking: 7.0,
    overall: 7.0,
    scored_at: "2026-01-27 15:00",
  },
  {
    id: "2",
    user_name: "이영희",
    exam_title: "IELTS Academic Mock Test 1",
    listening: 6.5,
    reading: 6.0,
    writing: 6.0,
    speaking: 6.5,
    overall: 6.5,
    adjusted: true,
    scored_at: "2026-01-26 16:30",
  },
  {
    id: "3",
    user_name: "박민수",
    exam_title: "IELTS Academic Mock Test 2",
    listening: 8.0,
    reading: 7.5,
    writing: 7.0,
    speaking: 7.5,
    overall: 7.5,
    scored_at: "2026-01-25 14:00",
  },
  {
    id: "4",
    user_name: "정수연",
    exam_title: "IELTS Academic Mock Test 1",
    listening: 5.5,
    reading: 6.0,
    writing: 5.5,
    speaking: 6.0,
    overall: 5.5,
    scored_at: "2026-01-24 11:00",
  },
];

const getScoreColor = (score: number) => {
  if (score >= 7.5) return "text-green-600";
  if (score >= 6.5) return "text-blue-600";
  if (score >= 5.5) return "text-yellow-600";
  return "text-red-600";
};

const columns: Column<ScoreRow>[] = [
  {
    key: "user",
    header: "응시자",
    cell: (score) => <span className="font-medium">{score.user_name}</span>,
  },
  {
    key: "exam",
    header: "시험",
    cell: (score) => score.exam_title,
  },
  {
    key: "listening",
    header: "L",
    cell: (score) => (
      <span className={getScoreColor(score.listening)}>
        {score.listening.toFixed(1)}
      </span>
    ),
    className: "text-center",
  },
  {
    key: "reading",
    header: "R",
    cell: (score) => (
      <span className={getScoreColor(score.reading)}>
        {score.reading.toFixed(1)}
      </span>
    ),
    className: "text-center",
  },
  {
    key: "writing",
    header: "W",
    cell: (score) => (
      <span className={getScoreColor(score.writing)}>
        {score.writing.toFixed(1)}
      </span>
    ),
    className: "text-center",
  },
  {
    key: "speaking",
    header: "S",
    cell: (score) => (
      <span className={getScoreColor(score.speaking)}>
        {score.speaking.toFixed(1)}
      </span>
    ),
    className: "text-center",
  },
  {
    key: "overall",
    header: "Overall",
    cell: (score) => (
      <div className="flex items-center gap-2">
        <span className={`font-bold ${getScoreColor(score.overall)}`}>
          {score.overall.toFixed(1)}
        </span>
        {score.adjusted && (
          <Badge variant="outline" className="text-xs">
            보정
          </Badge>
        )}
      </div>
    ),
    className: "text-center",
  },
  {
    key: "scored_at",
    header: "채점일",
    cell: (score) => (
      <span className="text-muted-foreground">{score.scored_at}</span>
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
            점수 보정
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Download className="mr-2 h-4 w-4" />
            리포트 다운로드
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    className: "w-[50px]",
  },
];

export default function ScoresPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="성적 관리"
        description="응시자 성적을 조회하고 관리합니다."
        actions={
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            전체 내보내기
          </Button>
        }
      />

      <div className="flex gap-4">
        <Select defaultValue="all">
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="시험 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 시험</SelectItem>
            <SelectItem value="1">IELTS Academic Mock Test 1</SelectItem>
            <SelectItem value="2">IELTS Academic Mock Test 2</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="점수대" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 점수</SelectItem>
            <SelectItem value="8-9">8.0 - 9.0</SelectItem>
            <SelectItem value="7-8">7.0 - 7.5</SelectItem>
            <SelectItem value="6-7">6.0 - 6.5</SelectItem>
            <SelectItem value="0-6">6.0 미만</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={mockScores}
        searchPlaceholder="응시자 이름으로 검색..."
        totalItems={5678}
      />
    </div>
  );
}
