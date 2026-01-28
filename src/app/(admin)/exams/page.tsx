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
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  Eye,
  FileQuestion,
  Package,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface ExamRow {
  id: string;
  title: string;
  exam_type: "full" | "section_only";
  difficulty?: "easy" | "medium" | "hard";
  is_package: boolean;
  is_published: boolean;
  is_free: boolean;
  sections: string[];
  question_count: number;
  created_at: string;
}

// Mock data
const mockExams: ExamRow[] = [
  {
    id: "1",
    title: "IELTS Academic Mock Test 1",
    exam_type: "full",
    difficulty: "medium",
    is_package: false,
    is_published: true,
    is_free: false,
    sections: ["L", "R", "W", "S"],
    question_count: 80,
    created_at: "2026-01-15",
  },
  {
    id: "2",
    title: "Listening Practice Set 1",
    exam_type: "section_only",
    difficulty: "easy",
    is_package: false,
    is_published: true,
    is_free: true,
    sections: ["L"],
    question_count: 40,
    created_at: "2026-01-10",
  },
  {
    id: "3",
    title: "IELTS 풀패키지 10회분",
    exam_type: "full",
    is_package: true,
    is_published: true,
    is_free: false,
    sections: ["L", "R", "W", "S"],
    question_count: 800,
    created_at: "2026-01-01",
  },
  {
    id: "4",
    title: "Writing Task 2 Practice",
    exam_type: "section_only",
    difficulty: "hard",
    is_package: false,
    is_published: false,
    is_free: false,
    sections: ["W"],
    question_count: 10,
    created_at: "2025-12-20",
  },
  {
    id: "5",
    title: "Speaking Practice Set 1",
    exam_type: "section_only",
    difficulty: "medium",
    is_package: false,
    is_published: true,
    is_free: false,
    sections: ["S"],
    question_count: 15,
    created_at: "2025-12-15",
  },
];

const difficultyColors = {
  easy: "secondary",
  medium: "default",
  hard: "destructive",
} as const;

const difficultyLabels = {
  easy: "쉬움",
  medium: "보통",
  hard: "어려움",
};

const sectionBadgeColors = {
  L: "bg-white text-sky-500 border border-sky-300",
  R: "bg-white text-emerald-500 border border-emerald-300",
  W: "bg-white text-amber-500 border border-amber-300",
  S: "bg-white text-violet-500 border border-violet-300",
};

const columns: Column<ExamRow>[] = [
  {
    key: "title",
    header: "시험명",
    cell: (exam) => (
      <div className="flex items-center gap-2">
        {exam.is_package && <Package className="h-4 w-4 text-muted-foreground" />}
        <div>
          <div className="font-medium">{exam.title}</div>
          <div className="flex items-center gap-1 mt-1">
            {exam.sections.map((section) => (
              <span
                key={section}
                className={`px-1.5 py-0.5 text-xs rounded ${
                  sectionBadgeColors[section as keyof typeof sectionBadgeColors]
                }`}
              >
                {section}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "type",
    header: "유형",
    cell: (exam) => (
      <Badge variant="outline">
        {exam.is_package ? "패키지" : exam.exam_type === "full" ? "풀시험" : "섹션"}
      </Badge>
    ),
  },
  {
    key: "difficulty",
    header: "난이도",
    cell: (exam) =>
      exam.difficulty ? (
        <Badge variant={difficultyColors[exam.difficulty]}>
          {difficultyLabels[exam.difficulty]}
        </Badge>
      ) : (
        "-"
      ),
  },
  {
    key: "questions",
    header: "문제 수",
    cell: (exam) => (
      <div className="flex items-center gap-2">
        <FileQuestion className="h-4 w-4 text-muted-foreground" />
        {exam.question_count}문제
      </div>
    ),
  },
  {
    key: "status",
    header: "상태",
    cell: (exam) => (
      <div className="flex flex-col gap-1">
        <Badge variant={exam.is_published ? "default" : "secondary"}>
          {exam.is_published ? "공개" : "비공개"}
        </Badge>
        {exam.is_free && (
          <Badge variant="outline" className="text-green-600">
            무료
          </Badge>
        )}
      </div>
    ),
  },
  {
    key: "created_at",
    header: "생성일",
    cell: (exam) => (
      <span className="text-muted-foreground">{exam.created_at}</span>
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
          <DropdownMenuItem>
            <Copy className="mr-2 h-4 w-4" />
            복제
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

export default function ExamsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="시험 관리"
        description="IELTS 시험 및 패키지를 관리합니다."
        createHref="/exams/new"
        createLabel="시험 등록"
      />

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="full">풀시험</TabsTrigger>
          <TabsTrigger value="section">섹션별</TabsTrigger>
          <TabsTrigger value="package">패키지</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <div className="flex gap-4 mb-4">
            <Select defaultValue="all">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="섹션" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 섹션</SelectItem>
                <SelectItem value="L">Listening</SelectItem>
                <SelectItem value="R">Reading</SelectItem>
                <SelectItem value="W">Writing</SelectItem>
                <SelectItem value="S">Speaking</SelectItem>
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
            data={mockExams}
            searchPlaceholder="시험명으로 검색..."
            totalItems={156}
          />
        </TabsContent>
        <TabsContent value="full" className="mt-4">
          <DataTable
            columns={columns}
            data={mockExams.filter((e) => e.exam_type === "full" && !e.is_package)}
            searchPlaceholder="시험명으로 검색..."
          />
        </TabsContent>
        <TabsContent value="section" className="mt-4">
          <DataTable
            columns={columns}
            data={mockExams.filter((e) => e.exam_type === "section_only")}
            searchPlaceholder="시험명으로 검색..."
          />
        </TabsContent>
        <TabsContent value="package" className="mt-4">
          <DataTable
            columns={columns}
            data={mockExams.filter((e) => e.is_package)}
            searchPlaceholder="패키지명으로 검색..."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
