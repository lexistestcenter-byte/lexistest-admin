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
  Eye,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { stripHtml } from "@/lib/utils/sanitize";
import { QuestionPreviewDialog } from "@/components/questions/question-preview-dialog";

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
  options_data?: Record<string, unknown>;
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
  mcq_single: "단일선택",
  mcq_multiple: "복수선택",
  true_false_ng: "T/F/NG",
  matching: "제목 매칭",
  flowchart: "플로우차트",
  table_completion: "테이블 완성",
  map_labeling: "지도 라벨링",
  essay: "에세이",
  speaking_part1: "Part 1",
  speaking_part2: "Part 2",
  speaking_part3: "Part 3",
};

// question_type별 format 필터 옵션
const formatFilters: Record<string, { value: string; label: string }[]> = {
  reading: [
    { value: "mcq_single", label: "단일선택" },
    { value: "mcq_multiple", label: "복수선택" },
    { value: "true_false_ng", label: "T/F/NG" },
    { value: "matching", label: "제목 매칭" },
    { value: "fill_blank_typing", label: "빈칸채우기 (직접입력)" },
    { value: "fill_blank_drag", label: "빈칸채우기 (드래그)" },
    { value: "flowchart", label: "플로우차트" },
    { value: "table_completion", label: "테이블 완성" },
  ],
  listening: [
    { value: "mcq_single", label: "단일선택" },
    { value: "mcq_multiple", label: "복수선택" },
    { value: "matching", label: "제목 매칭" },
    { value: "fill_blank_typing", label: "빈칸채우기 (직접입력)" },
    { value: "fill_blank_drag", label: "빈칸채우기 (드래그)" },
    { value: "table_completion", label: "테이블 완성" },
    { value: "map_labeling", label: "지도 라벨링" },
  ],
  writing: [
    { value: "essay", label: "에세이" },
  ],
  speaking: [
    { value: "speaking_part1", label: "Part 1" },
    { value: "speaking_part2", label: "Part 2" },
    { value: "speaking_part3", label: "Part 3" },
  ],
};

const typeFilters = [
  { id: "all", label: "전체", icon: null },
  { id: "reading", label: "Reading", icon: BookOpen, color: "text-emerald-500" },
  { id: "writing", label: "Writing", icon: PenTool, color: "text-amber-500" },
  { id: "listening", label: "Listening", icon: Headphones, color: "text-sky-500" },
  { id: "speaking", label: "Speaking", icon: Mic, color: "text-violet-500" },
];

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QuestionRow | null>(null);
  const [previewQuestionId, setPreviewQuestionId] = useState<string | null>(null);

  // Filters
  const [selectedType, setSelectedType] = useState("all");
  const [selectedFormat, setSelectedFormat] = useState("all");
  const [practiceOnly, setPracticeOnly] = useState(false);
  const [search, setSearch] = useState("");

  // Pagination
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load questions
  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", pageSize.toString());
      params.set("offset", ((currentPage - 1) * pageSize).toString());

      if (selectedType !== "all") {
        params.set("question_type", selectedType);
      }
      if (selectedFormat !== "all") {
        params.set("question_format", selectedFormat);
      }
      if (practiceOnly) {
        params.set("is_practice", "true");
      }
      if (search) {
        params.set("search", search);
      }

      const { data: result, error: apiError } = await api.get<{
        questions: QuestionRow[];
        pagination: { total: number };
      }>(`/api/questions?${params.toString()}`);
      if (apiError) throw new Error(apiError);
      setQuestions(result?.questions || []);
      setTotalItems(result?.pagination?.total || 0);
    } catch (error) {
      console.error("Error loading questions:", error);
      toast.error("문제 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, selectedType, selectedFormat, practiceOnly, search]);

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
      const { error: apiError } = await api.delete(`/api/questions/${deleteTarget.id}`);
      if (apiError) throw new Error(apiError);

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
        <div className="flex items-center gap-2 min-w-0">
          {q.is_practice && (
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 shrink-0">
              연습
            </Badge>
          )}
          <span className="text-sm truncate">
            {(() => {
              let displayText = q.title || (q.options_data?.title as string) || "";
              if (!displayText && q.question_format === "flowchart") {
                try { displayText = JSON.parse(q.content).title || "Flowchart"; } catch { displayText = "Flowchart"; }
              }
              if (!displayText) displayText = stripHtml(q.content || "");
              return displayText.length > 80 ? displayText.substring(0, 80) + "..." : displayText;
            })()}
          </span>
        </div>
      ),
      className: "overflow-hidden",
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
            <DropdownMenuItem onClick={() => setPreviewQuestionId(q.id)}>
              <Eye className="mr-2 h-4 w-4" />
              미리보기
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
        description="독립적인 문제를 생성합니다. 문제는 여러 시험에서 재사용할 수 있습니다."
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
                  setSelectedFormat("all");
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

        {selectedType !== "all" && formatFilters[selectedType] && (
          <>
            <div className="h-6 w-px bg-slate-200" />
            <Select
              value={selectedFormat}
              onValueChange={(val) => {
                setSelectedFormat(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px] h-9 text-sm">
                <SelectValue placeholder="형태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 형태</SelectItem>
                {formatFilters[selectedType].map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

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
          pageSize={pageSize}
          currentPage={currentPage}
          onSearch={setSearch}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}

      {/* 문제 미리보기 다이얼로그 */}
      <QuestionPreviewDialog
        questionId={previewQuestionId}
        open={!!previewQuestionId}
        onOpenChange={(open) => { if (!open) setPreviewQuestionId(null); }}
      />

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
              -{" "}
              {(() => {
                const t = deleteTarget;
                if (!t) return "";
                if (t.title) return stripHtml(t.title);
                if (t.question_format === "flowchart") {
                  try { return JSON.parse(t.content).title || "Flowchart"; } catch { return "Flowchart"; }
                }
                return stripHtml(t.content || "");
              })()}
              <br />
              <br />
              <span className="text-amber-600">
                이 문제가 포함된 그룹이나 시험에서 제거됩니다.
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
