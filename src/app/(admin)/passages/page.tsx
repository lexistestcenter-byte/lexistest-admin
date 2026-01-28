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
import { MoreHorizontal, Pencil, Trash2, Eye, FileText } from "lucide-react";

interface PassageRow {
  id: string;
  title: string;
  exam_title: string;
  word_count?: number;
  question_count: number;
  display_order: number;
  created_at: string;
}

// Mock data
const mockPassages: PassageRow[] = [
  {
    id: "1",
    title: "The History of Coffee",
    exam_title: "IELTS Academic Mock Test 1",
    word_count: 850,
    question_count: 13,
    display_order: 1,
    created_at: "2026-01-15",
  },
  {
    id: "2",
    title: "Climate Change and Agriculture",
    exam_title: "IELTS Academic Mock Test 1",
    word_count: 920,
    question_count: 13,
    display_order: 2,
    created_at: "2026-01-15",
  },
  {
    id: "3",
    title: "The Evolution of Language",
    exam_title: "IELTS Academic Mock Test 1",
    word_count: 1050,
    question_count: 14,
    display_order: 3,
    created_at: "2026-01-15",
  },
  {
    id: "4",
    title: "Urban Planning in Modern Cities",
    exam_title: "Reading Practice Set 1",
    word_count: 780,
    question_count: 10,
    display_order: 1,
    created_at: "2026-01-10",
  },
];

const columns: Column<PassageRow>[] = [
  {
    key: "title",
    header: "지문 제목",
    cell: (passage) => (
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{passage.title}</span>
      </div>
    ),
  },
  {
    key: "exam",
    header: "시험",
    cell: (passage) => passage.exam_title,
  },
  {
    key: "word_count",
    header: "단어 수",
    cell: (passage) =>
      passage.word_count ? `${passage.word_count.toLocaleString()}자` : "-",
  },
  {
    key: "questions",
    header: "문제 수",
    cell: (passage) => (
      <Badge variant="outline">{passage.question_count}문제</Badge>
    ),
  },
  {
    key: "order",
    header: "순서",
    cell: (passage) => `Passage ${passage.display_order}`,
  },
  {
    key: "created_at",
    header: "생성일",
    cell: (passage) => (
      <span className="text-muted-foreground">{passage.created_at}</span>
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
            미리보기
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Pencil className="mr-2 h-4 w-4" />
            수정
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

export default function PassagesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="지문 관리"
        description="Reading 섹션의 지문을 관리합니다."
        createHref="/passages/new"
        createLabel="지문 등록"
      />

      <DataTable
        columns={columns}
        data={mockPassages}
        searchPlaceholder="지문 제목으로 검색..."
        totalItems={89}
      />
    </div>
  );
}
