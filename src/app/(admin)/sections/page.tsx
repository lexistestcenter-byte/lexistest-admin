"use client";

import { useState, useEffect, useCallback } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  Eye,
  FileText,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  RefreshCw,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const typeFilters = [
  { id: "all", label: "전체", icon: null },
  { id: "listening", label: "Listening", icon: Headphones, color: "text-sky-500" },
  { id: "reading", label: "Reading", icon: BookOpen, color: "text-emerald-500" },
  { id: "writing", label: "Writing", icon: PenTool, color: "text-amber-500" },
  { id: "speaking", label: "Speaking", icon: Mic, color: "text-violet-500" },
];

interface SectionRow {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  section_type: "listening" | "reading" | "writing" | "speaking";
  time_limit_minutes: number | null;
  difficulty: "easy" | "medium" | "hard" | null;
  is_practice: boolean;
  is_active: boolean;
  created_at: string;
}

const sectionTypeLabels = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
};

const sectionTypeColors = {
  listening: "bg-white text-sky-500 border border-sky-300",
  reading: "bg-white text-emerald-500 border border-emerald-300",
  writing: "bg-white text-amber-500 border border-amber-300",
  speaking: "bg-white text-violet-500 border border-violet-300",
};

export default function SectionsPage() {
  const router = useRouter();
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SectionRow | null>(null);

  // Filters
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [search, setSearch] = useState("");

  // Pagination
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  // Load sections
  const loadSections = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      params.set("offset", ((currentPage - 1) * limit).toString());

      if (selectedType !== "all") {
        params.set("section_type", selectedType);
      }
      if (selectedStatus !== "all") {
        params.set("is_active", selectedStatus === "active" ? "true" : "false");
      }
      if (search) {
        params.set("search", search);
      }

      const response = await fetch(`/api/sections?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch sections");
      }

      const result = await response.json();
      setSections(result.sections || []);
      setTotalItems(result.pagination?.total || 0);
    } catch (error) {
      console.error("Error loading sections:", error);
      toast.error("섹션 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, selectedType, selectedStatus, search]);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Delete handler
  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/sections/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete");
      }

      toast.success("섹션이 삭제되었습니다.");
      loadSections();
    } catch (error) {
      console.error("Error deleting section:", error);
      toast.error(
        error instanceof Error ? error.message : "섹션 삭제에 실패했습니다."
      );
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const columns: Column<SectionRow>[] = [
    {
      key: "section",
      header: "섹션",
      cell: (section) => (
        <div className="flex items-center gap-3">
          {section.image_url ? (
            <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden">
              <Image
                src={section.image_url}
                alt={section.title}
                width={48}
                height={48}
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div>
            <div className="font-medium">{section.title}</div>
            <div className="text-sm text-muted-foreground line-clamp-1">
              {section.description || "-"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "유형",
      cell: (section) => (
        <span className={`px-2 py-1 text-xs rounded ${sectionTypeColors[section.section_type]}`}>
          {sectionTypeLabels[section.section_type]}
        </span>
      ),
    },
    {
      key: "time",
      header: "제한시간",
      cell: (section) => (
        <span className="text-muted-foreground">
          {section.time_limit_minutes ? `${section.time_limit_minutes}분` : "-"}
        </span>
      ),
    },
    {
      key: "practice",
      header: "연습",
      cell: (section) =>
        section.is_practice ? (
          <Badge variant="outline">연습용</Badge>
        ) : null,
    },
    {
      key: "status",
      header: "상태",
      cell: (section) => (
        <Badge variant={section.is_active ? "default" : "secondary"}>
          {section.is_active ? "활성" : "비활성"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (section) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>작업</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/sections/${section.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              상세보기
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/sections/${section.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              수정
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              복제
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteTarget(section)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-[50px]",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="섹션 관리"
        description="문제들을 조합하여 섹션을 구성합니다. 섹션은 여러 패키지에서 재사용할 수 있습니다."
        createHref="/sections/new"
        createLabel="섹션 생성"
        actions={
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadSections()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        }
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
                onClick={() => {
                  setSelectedType(filter.id);
                  setCurrentPage(1);
                }}
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

        <Select
          value={selectedStatus}
          onValueChange={(v) => {
            setSelectedStatus(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[120px] h-9 text-sm">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="active">활성</SelectItem>
            <SelectItem value="inactive">비활성</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={sections}
          searchPlaceholder="섹션명으로 검색..."
          totalItems={totalItems}
          onSearch={setSearch}
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>섹션 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 섹션을 삭제하시겠습니까?
              <br />
              <strong className="text-foreground">{deleteTarget?.title}</strong>
              <br />
              <br />
              <span className="text-amber-600">
                이 섹션에 연결된 문제나 그룹은 삭제되지 않습니다.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                "삭제"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
