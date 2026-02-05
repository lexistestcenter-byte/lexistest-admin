"use client";

import { useState } from "react";
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
import { MoreHorizontal, Pencil, Trash2, Copy, Eye, Layers, FileCheck, LayoutGrid, BookMarked } from "lucide-react";
import Image from "next/image";
import { getCdnUrl } from "@/lib/cdn";

const typeFilters = [
  { id: "all", label: "전체", icon: null },
  { id: "full", label: "Full Test", icon: FileCheck, color: "text-blue-500" },
  { id: "section_only", label: "섹션별", icon: LayoutGrid, color: "text-emerald-500" },
  { id: "practice", label: "연습", icon: BookMarked, color: "text-amber-500" },
];

interface PackageRow {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  exam_type: "full" | "section_only" | "practice";
  section_count: number;
  sections_summary: string;
  is_published: boolean;
  is_free: boolean;
  created_at: string;
}

// Mock data
const mockPackages: PackageRow[] = [
  {
    id: "1",
    title: "IELTS Academic Full Test 1",
    description: "실전 모의고사 1회 - L/R/W/S 전체",
    image_url: "/placeholder.jpg",
    exam_type: "full",
    section_count: 6,
    sections_summary: "L×1, R×3, W×1, S×1",
    is_published: true,
    is_free: false,
    created_at: "2026-01-15",
  },
  {
    id: "2",
    title: "IELTS Academic Full Test 2",
    description: "실전 모의고사 2회 - L/R/W/S 전체",
    exam_type: "full",
    section_count: 6,
    sections_summary: "L×1, R×3, W×1, S×1",
    is_published: true,
    is_free: false,
    created_at: "2026-01-14",
  },
  {
    id: "3",
    title: "Reading Practice Set 1",
    description: "리딩 연습 세트 - Passage 3개",
    exam_type: "section_only",
    section_count: 3,
    sections_summary: "R×3",
    is_published: true,
    is_free: true,
    created_at: "2026-01-10",
  },
  {
    id: "4",
    title: "Writing Task 2 Practice",
    description: "라이팅 Task 2 연습",
    exam_type: "practice",
    section_count: 1,
    sections_summary: "W×1",
    is_published: false,
    is_free: false,
    created_at: "2026-01-08",
  },
  {
    id: "5",
    title: "Speaking Mock Test",
    description: "스피킹 모의고사",
    exam_type: "section_only",
    section_count: 1,
    sections_summary: "S×1",
    is_published: true,
    is_free: false,
    created_at: "2026-01-05",
  },
];

const examTypeLabels = {
  full: "Full Test",
  section_only: "섹션별",
  practice: "연습",
};

const examTypeColors = {
  full: "default",
  section_only: "secondary",
  practice: "outline",
} as const;

const columns: Column<PackageRow>[] = [
  {
    key: "package",
    header: "패키지",
    cell: (pkg) => (
      <div className="flex items-center gap-3">
        {pkg.image_url ? (
          <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden">
            <Image
              src={getCdnUrl(pkg.image_url)}
              alt={pkg.title}
              width={48}
              height={48}
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
            <Layers className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div>
          <div className="font-medium">{pkg.title}</div>
          <div className="text-sm text-muted-foreground">{pkg.description}</div>
        </div>
      </div>
    ),
  },
  {
    key: "type",
    header: "유형",
    cell: (pkg) => (
      <Badge variant={examTypeColors[pkg.exam_type]}>
        {examTypeLabels[pkg.exam_type]}
      </Badge>
    ),
  },
  {
    key: "sections",
    header: "구성",
    cell: (pkg) => (
      <div>
        <div className="font-medium">{pkg.section_count}개 섹션</div>
        <div className="text-sm text-muted-foreground">{pkg.sections_summary}</div>
      </div>
    ),
  },
  {
    key: "status",
    header: "상태",
    cell: (pkg) => (
      <div className="flex flex-col gap-1">
        <Badge variant={pkg.is_published ? "default" : "secondary"}>
          {pkg.is_published ? "공개" : "비공개"}
        </Badge>
        {pkg.is_free && (
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
    cell: (pkg) => (
      <span className="text-muted-foreground">{pkg.created_at}</span>
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

export default function PackagesPage() {
  const [selectedType, setSelectedType] = useState("all");

  const filteredPackages = selectedType === "all"
    ? mockPackages
    : mockPackages.filter(p => p.exam_type === selectedType);

  return (
    <div className="space-y-6">
      <PageHeader
        title="패키지 관리"
        description="섹션들을 조합하여 시험 패키지를 구성합니다."
        createHref="/packages/new"
        createLabel="패키지 생성"
      />

      {/* 유형 필터 */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {typeFilters.map((filter) => {
            const isSelected = selectedType === filter.id;
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setSelectedType(filter.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                  ${isSelected
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                  }
                `}
              >
                {Icon && <Icon className={`h-3.5 w-3.5 ${isSelected ? filter.color : ""}`} />}
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>

        <div className="h-6 w-px bg-slate-200" />

        <Select defaultValue="all">
          <SelectTrigger className="w-[120px] h-9 text-sm">
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
        data={filteredPackages}
        searchPlaceholder="패키지명으로 검색..."
        totalItems={25}
      />
    </div>
  );
}
