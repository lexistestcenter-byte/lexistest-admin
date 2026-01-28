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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface QuestionRow {
  id: string;
  question_code: string;
  title: string | null;
  question_type: "listening" | "reading" | "writing" | "speaking";
  question_format: string;
  content: string;
  points: number;
  is_practice: boolean;
  is_active: boolean;
  created_at: string;
}

const typeColors = {
  listening: "bg-white text-sky-500 border border-sky-300",
  reading: "bg-white text-emerald-500 border border-emerald-300",
  writing: "bg-white text-amber-500 border border-amber-300",
  speaking: "bg-white text-violet-500 border border-violet-300",
};

const typeLabels = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
};

const formatLabels: Record<string, string> = {
  fill_blank_typing: "빈칸채우기 (직접입력)",
  fill_blank_drag: "빈칸채우기 (드래그)",
  heading_matching: "제목 매칭",
  mcq: "4지선다",
  mcq_multiple: "복수선택",
  true_false_ng: "T/F/NG",
  flowchart: "플로우차트",
  map_labeling: "지도라벨링",
  essay_task1: "Task 1",
  essay_task2: "Task 2",
  speaking_part1: "Part 1",
  speaking_part2: "Part 2",
  speaking_part3: "Part 3",
};

const typeFilters = [
  { id: "all", label: "전체", icon: null },
  { id: "listening", label: "Listening", icon: Headphones, color: "text-sky-500" },
  { id: "reading", label: "Reading", icon: BookOpen, color: "text-emerald-500" },
  { id: "writing", label: "Writing", icon: PenTool, color: "text-amber-500" },
  { id: "speaking", label: "Speaking", icon: Mic, color: "text-violet-500" },
];

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QuestionRow | null>(null);

  // Filters
  const [selectedType, setSelectedType] = useState("all");
  const [practiceOnly, setPracticeOnly] = useState(false);
  const [search, setSearch] = useState("");

  // Pagination
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  // Load questions
  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      params.set("offset", ((currentPage - 1) * limit).toString());

      if (selectedType !== "all") {
        params.set("question_type", selectedType);
      }
      if (practiceOnly) {
        params.set("is_practice", "true");
      }
      if (search) {
        params.set("search", search);
      }

      const response = await fetch(`/api/questions?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }

      const result = await response.json();
      setQuestions(result.questions || []);
      setTotalItems(result.pagination?.total || 0);
    } catch (error) {
      console.error("Error loading questions:", error);
      toast.error("문제 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, selectedType, practiceOnly, search]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

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
      const response = await fetch(`/api/questions/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete");
      }

      toast.success("문제가 삭제되었습니다.");
      loadQuestions();
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error(
        error instanceof Error ? error.message : "문제 삭제에 실패했습니다."
      );
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const columns: Column<QuestionRow>[] = [
    {
      key: "id",
      header: "코드",
      cell: (q) => (
        <button
          onClick={() => router.push(`/questions/${q.id}`)}
          className="font-mono text-sm text-primary hover:underline"
        >
          {q.question_code}
        </button>
      ),
      className: "w-[100px]",
    },
    {
      key: "type",
      header: "유형",
      cell: (q) => (
        <span className={`px-2 py-1 text-xs rounded ${typeColors[q.question_type]}`}>
          {typeLabels[q.question_type]}
        </span>
      ),
    },
    {
      key: "format",
      header: "형태",
      cell: (q) => (
        <Badge variant="outline">{formatLabels[q.question_format] || q.question_format}</Badge>
      ),
    },
    {
      key: "content",
      header: "내용",
      cell: (q) => (
        <div className="flex items-center gap-2">
          {q.is_practice && (
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 shrink-0">
              연습
            </Badge>
          )}
          <span className="text-sm line-clamp-1 max-w-[300px]">
            {q.title || q.content}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (q) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>작업</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/questions/${q.id}`)}>
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
              onClick={() => setDeleteTarget(q)}
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
        title="문제 관리"
        description="독립적인 문제를 생성합니다. 문제는 여러 섹션에서 재사용할 수 있습니다."
        createHref="/questions/new"
        createLabel="문제 생성"
        actions={
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadQuestions()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        }
      />

      {/* 유형 필터 (pill 스타일) */}
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

        {/* 연습문제 필터 */}
        <div className="flex items-center gap-2">
          <Switch
            id="practice-filter"
            checked={practiceOnly}
            onCheckedChange={(checked) => {
              setPracticeOnly(checked);
              setCurrentPage(1);
            }}
          />
          <Label htmlFor="practice-filter" className="text-sm cursor-pointer">
            연습문제만
          </Label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={questions}
          searchPlaceholder="문제 내용으로 검색..."
          totalItems={totalItems}
          onSearch={setSearch}
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>문제 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 문제를 삭제하시겠습니까?
              <br />
              <strong className="text-foreground">
                {deleteTarget?.question_code}
              </strong>{" "}
              - {deleteTarget?.title || deleteTarget?.content?.slice(0, 50)}
              <br />
              <br />
              <span className="text-amber-600">
                이 문제가 포함된 그룹이나 섹션에서 제거됩니다.
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
