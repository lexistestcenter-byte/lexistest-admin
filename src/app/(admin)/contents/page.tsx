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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreHorizontal, Pencil, Eye, Star } from "lucide-react";

interface ContentRow {
  id: string;
  name: string;
  title?: string;
  content_type: "instruction" | "report_template";
  section_type?: string;
  is_default: boolean;
  is_active: boolean;
  updated_at: string;
}

// Mock data
const mockContents: ContentRow[] = [
  {
    id: "1",
    name: "welcome_page",
    title: "Welcome to IELTS Practice Test",
    content_type: "instruction",
    section_type: "general",
    is_default: true,
    is_active: true,
    updated_at: "2026-01-20",
  },
  {
    id: "2",
    name: "listening_instruction",
    title: "Listening Test Instructions",
    content_type: "instruction",
    section_type: "listening",
    is_default: true,
    is_active: true,
    updated_at: "2026-01-15",
  },
  {
    id: "3",
    name: "reading_instruction",
    title: "Reading Test Instructions",
    content_type: "instruction",
    section_type: "reading",
    is_default: true,
    is_active: true,
    updated_at: "2026-01-15",
  },
  {
    id: "4",
    name: "writing_instruction",
    title: "Writing Test Instructions",
    content_type: "instruction",
    section_type: "writing",
    is_default: true,
    is_active: true,
    updated_at: "2026-01-15",
  },
  {
    id: "5",
    name: "speaking_instruction",
    title: "Speaking Test Instructions",
    content_type: "instruction",
    section_type: "speaking",
    is_default: true,
    is_active: true,
    updated_at: "2026-01-15",
  },
  {
    id: "6",
    name: "score_report_default",
    title: "IELTS Score Report",
    content_type: "report_template",
    section_type: "general",
    is_default: true,
    is_active: true,
    updated_at: "2026-01-10",
  },
];

const sectionLabels: Record<string, string> = {
  general: "일반",
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
};

const contentTypeLabels = {
  instruction: "안내 페이지",
  report_template: "리포트 템플릿",
};

const columns: Column<ContentRow>[] = [
  {
    key: "content",
    header: "콘텐츠",
    cell: (content) => (
      <div className="flex items-center gap-2">
        {content.is_default && (
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
        )}
        <div>
          <div className="font-medium">{content.title || content.name}</div>
          <div className="text-sm text-muted-foreground font-mono">
            {content.name}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "type",
    header: "유형",
    cell: (content) => (
      <Badge variant="outline">
        {contentTypeLabels[content.content_type]}
      </Badge>
    ),
  },
  {
    key: "section",
    header: "섹션",
    cell: (content) =>
      content.section_type ? sectionLabels[content.section_type] : "-",
  },
  {
    key: "status",
    header: "상태",
    cell: (content) => (
      <Badge variant={content.is_active ? "default" : "secondary"}>
        {content.is_active ? "활성" : "비활성"}
      </Badge>
    ),
  },
  {
    key: "updated_at",
    header: "수정일",
    cell: (content) => (
      <span className="text-muted-foreground">{content.updated_at}</span>
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
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    className: "w-[50px]",
  },
];

export default function ContentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="콘텐츠 관리"
        description="안내 페이지와 리포트 템플릿을 관리합니다."
        createHref="/contents/new"
        createLabel="콘텐츠 추가"
      />

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="instruction">안내 페이지</TabsTrigger>
          <TabsTrigger value="report">리포트 템플릿</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <DataTable
            columns={columns}
            data={mockContents}
            searchPlaceholder="콘텐츠명으로 검색..."
            totalItems={12}
          />
        </TabsContent>
        <TabsContent value="instruction" className="mt-4">
          <DataTable
            columns={columns}
            data={mockContents.filter((c) => c.content_type === "instruction")}
            searchPlaceholder="안내 페이지 검색..."
          />
        </TabsContent>
        <TabsContent value="report" className="mt-4">
          <DataTable
            columns={columns}
            data={mockContents.filter(
              (c) => c.content_type === "report_template"
            )}
            searchPlaceholder="템플릿 검색..."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
