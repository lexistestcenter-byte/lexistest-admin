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
import { MoreHorizontal, Pencil, Copy, History, Eye } from "lucide-react";

interface PromptRow {
  id: string;
  name: string;
  section_type: "writing" | "speaking";
  prompt_type: "scoring" | "feedback" | "correction" | "followup";
  model_name?: string;
  temperature: number;
  is_active: boolean;
  version: number;
  updated_at: string;
}

// Mock data
const mockPrompts: PromptRow[] = [
  {
    id: "1",
    name: "Writing Task 2 채점 프롬프트",
    section_type: "writing",
    prompt_type: "scoring",
    model_name: "gpt-4o",
    temperature: 0.3,
    is_active: true,
    version: 3,
    updated_at: "2026-01-25",
  },
  {
    id: "2",
    name: "Writing 피드백 생성 프롬프트",
    section_type: "writing",
    prompt_type: "feedback",
    model_name: "gpt-4o",
    temperature: 0.7,
    is_active: true,
    version: 2,
    updated_at: "2026-01-20",
  },
  {
    id: "3",
    name: "Writing 교정 프롬프트",
    section_type: "writing",
    prompt_type: "correction",
    model_name: "gpt-4o",
    temperature: 0.5,
    is_active: true,
    version: 1,
    updated_at: "2026-01-15",
  },
  {
    id: "4",
    name: "Speaking 채점 프롬프트",
    section_type: "speaking",
    prompt_type: "scoring",
    model_name: "gpt-4o",
    temperature: 0.3,
    is_active: true,
    version: 2,
    updated_at: "2026-01-22",
  },
  {
    id: "5",
    name: "Speaking Part 2 심화질문 생성",
    section_type: "speaking",
    prompt_type: "followup",
    model_name: "gpt-4o",
    temperature: 0.8,
    is_active: true,
    version: 1,
    updated_at: "2026-01-10",
  },
];

const sectionColors = {
  writing: "bg-white text-amber-500 border border-amber-300",
  speaking: "bg-white text-violet-500 border border-violet-300",
};

const promptTypeLabels = {
  scoring: "채점",
  feedback: "피드백",
  correction: "교정",
  followup: "심화질문",
};

const columns: Column<PromptRow>[] = [
  {
    key: "name",
    header: "프롬프트명",
    cell: (prompt) => <span className="font-medium">{prompt.name}</span>,
  },
  {
    key: "section",
    header: "섹션",
    cell: (prompt) => (
      <span
        className={`px-2 py-1 text-xs rounded ${
          sectionColors[prompt.section_type]
        }`}
      >
        {prompt.section_type === "writing" ? "Writing" : "Speaking"}
      </span>
    ),
  },
  {
    key: "type",
    header: "유형",
    cell: (prompt) => (
      <Badge variant="outline">{promptTypeLabels[prompt.prompt_type]}</Badge>
    ),
  },
  {
    key: "model",
    header: "모델",
    cell: (prompt) => (
      <span className="text-muted-foreground font-mono text-sm">
        {prompt.model_name || "-"}
      </span>
    ),
  },
  {
    key: "temperature",
    header: "Temperature",
    cell: (prompt) => prompt.temperature.toFixed(1),
  },
  {
    key: "version",
    header: "버전",
    cell: (prompt) => (
      <Badge variant="secondary">v{prompt.version}</Badge>
    ),
  },
  {
    key: "status",
    header: "상태",
    cell: (prompt) => (
      <Badge variant={prompt.is_active ? "default" : "secondary"}>
        {prompt.is_active ? "활성" : "비활성"}
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
            <Eye className="mr-2 h-4 w-4" />
            내용 보기
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Pencil className="mr-2 h-4 w-4" />
            수정
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Copy className="mr-2 h-4 w-4" />
            복제
          </DropdownMenuItem>
          <DropdownMenuItem>
            <History className="mr-2 h-4 w-4" />
            버전 히스토리
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    className: "w-[50px]",
  },
];

export default function AIPromptsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI 프롬프트"
        description="Writing/Speaking AI 채점 프롬프트를 관리합니다."
        createHref="/ai-prompts/new"
        createLabel="프롬프트 추가"
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
            <SelectValue placeholder="유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 유형</SelectItem>
            <SelectItem value="scoring">채점</SelectItem>
            <SelectItem value="feedback">피드백</SelectItem>
            <SelectItem value="correction">교정</SelectItem>
            <SelectItem value="followup">심화질문</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={mockPrompts}
        searchPlaceholder="프롬프트명으로 검색..."
        totalItems={12}
      />
    </div>
  );
}
