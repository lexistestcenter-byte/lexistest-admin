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
  MoreHorizontal,
  Pencil,
  Trash2,
  FileText,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  RefreshCw,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { getCdnUrl } from "@/lib/cdn";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { SectionPreview, type PreviewQuestion } from "./new/section-preview";

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

  // Preview
  const [previewSection, setPreviewSection] = useState<SectionRow | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{
    contentBlocks: { id: string; content_type: "passage" | "audio"; passage_title?: string; passage_content?: string; passage_footnotes?: string; audio_url?: string; audio_transcript?: string }[];
    questionGroups: { id: string; title: string; instructions: string | null; contentBlockId: string | null; startNum: number; endNum: number; questionIds: string[] }[];
    questions: PreviewQuestion[];
  }>({ contentBlocks: [], questionGroups: [], questions: [] });

  // Filters
  const [selectedType, setSelectedType] = useState("all");
  const [search, setSearch] = useState("");

  // Pagination
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load sections
  const loadSections = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", pageSize.toString());
      params.set("offset", ((currentPage - 1) * pageSize).toString());

      if (selectedType !== "all") {
        params.set("section_type", selectedType);
      }
      if (search) {
        params.set("search", search);
      }

      const { data: result, error: apiError } = await api.get<{
        sections: SectionRow[];
        pagination: { total: number };
      }>(`/api/sections?${params.toString()}`);
      if (apiError) throw new Error(apiError);
      setSections(result?.sections || []);
      setTotalItems(result?.pagination?.total || 0);
    } catch (error) {
      console.error("Error loading sections:", error);
      toast.error("섹션 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, selectedType, search]);

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

  // Delete handler (toast-based confirmation)
  const confirmDelete = (section: SectionRow) => {
    toast.warning(`"${section.title}" 섹션을 삭제하시겠습니까?`, {
      description: "이 섹션에 연결된 문제나 그룹은 삭제되지 않습니다.",
      actionButtonStyle: { backgroundColor: "hsl(0 84% 60%)", color: "white" },
      action: {
        label: "삭제",
        onClick: async () => {
          try {
            const { error: apiError } = await api.delete(`/api/sections/${section.id}`);
            if (apiError) throw new Error(apiError);
            toast.success("섹션이 삭제되었습니다.");
            loadSections();
          } catch (error) {
            console.error("Error deleting section:", error);
            toast.error(
              error instanceof Error ? error.message : "섹션 삭제에 실패했습니다."
            );
          }
        },
      },
      cancel: {
        label: "취소",
        onClick: () => {},
      },
    });
  };

  // Preview handler
  const openPreview = async (section: SectionRow) => {
    setPreviewSection(section);
    setIsLoadingPreview(true);
    setShowPreview(true);
    try {
      const { data: structData, error: structError } = await api.get<{
        content_blocks: Record<string, unknown>[];
        question_groups: { id: string; title?: string; instructions?: string; content_block_id?: string; items?: { question_id: string }[] }[];
      }>(`/api/sections/${section.id}/structure`);
      if (structError || !structData) throw new Error(structError || "Failed to load structure");

      const blocks = (structData.content_blocks || []).map((b: Record<string, unknown>) => ({
        id: b.id as string,
        content_type: b.content_type as "passage" | "audio",
        passage_title: (b.passage_title as string) || undefined,
        passage_content: (b.passage_content as string) || undefined,
        passage_footnotes: (b.passage_footnotes as string) || undefined,
        audio_url: (b.audio_url as string) || undefined,
        audio_transcript: (b.audio_transcript as string) || undefined,
      }));

      const groups = structData.question_groups || [];
      const allQuestionIds: string[] = groups.flatMap(
        (g: { items?: { question_id: string }[] }) =>
          (g.items || []).map((i) => i.question_id)
      );

      let questions: PreviewQuestion[] = [];
      if (allQuestionIds.length > 0) {
        const uniqueIds = [...new Set(allQuestionIds)];
        const details = await Promise.all(
          uniqueIds.map(async (qId) => {
            const { data, error } = await api.get<{ question: PreviewQuestion }>(`/api/questions/${qId}`);
            if (error || !data) return null;
            return data.question;
          })
        );
        const detailMap = new Map(
          details.filter((d): d is PreviewQuestion => d !== null).map((d) => [d.id, d])
        );
        questions = allQuestionIds
          .map((qId) => detailMap.get(qId))
          .filter((q): q is PreviewQuestion => q !== undefined);
      }

      // Build numbered groups
      let num = 1;
      const questionMap = new Map(questions.map((q) => [q.id, q]));
      const numberedGroups = groups.map(
        (g: { id: string; title?: string; instructions?: string; content_block_id?: string; items?: { question_id: string }[] }) => {
          const qIds = (g.items || []).map((i) => i.question_id);
          const startNum = num;
          for (const qId of qIds) {
            const q = questionMap.get(qId);
            num += q ? q.item_count || 1 : 1;
          }
          return {
            id: g.id,
            title: g.title || "",
            instructions: g.instructions || null,
            contentBlockId: g.content_block_id || null,
            startNum,
            endNum: num - 1,
            questionIds: qIds,
          };
        }
      );

      setPreviewData({ contentBlocks: blocks, questionGroups: numberedGroups, questions });
    } catch (error) {
      console.error("Error loading preview:", error);
      toast.error("미리보기 데이터를 불러오는데 실패했습니다.");
      setShowPreview(false);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const columns: Column<SectionRow>[] = [
    {
      key: "section",
      header: "섹션",
      cell: (section) => (
        <div className="flex items-center gap-3 min-w-0">
          {section.image_url ? (
            <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
              <Image
                src={getCdnUrl(section.image_url)}
                alt={section.title}
                width={48}
                height={48}
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <button
              type="button"
              className="font-medium text-left hover:text-blue-600 hover:underline transition-colors truncate block max-w-full"
              onClick={() => openPreview(section)}
            >
              {section.title}
            </button>
            <div className="text-sm text-muted-foreground truncate">
              {section.description || "-"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "유형",
      className: "w-[100px]",
      cell: (section) => (
        <span className={`px-2 py-1 text-xs rounded ${sectionTypeColors[section.section_type]}`}>
          {sectionTypeLabels[section.section_type]}
        </span>
      ),
    },
    {
      key: "time",
      header: "제한시간",
      className: "w-[90px]",
      cell: (section) => (
        <span className="text-muted-foreground">
          {section.time_limit_minutes ? `${section.time_limit_minutes}분` : "-"}
        </span>
      ),
    },
    {
      key: "practice",
      header: "연습",
      className: "w-[80px]",
      cell: (section) =>
        section.is_practice ? (
          <Badge variant="outline">연습용</Badge>
        ) : null,
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
              <Pencil className="mr-2 h-4 w-4" />
              편집
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => confirmDelete(section)}
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

      {/* 섹션 미리보기 */}
      <SectionPreview
        open={showPreview}
        onOpenChange={(open) => {
          setShowPreview(open);
          if (!open) setPreviewSection(null);
        }}
        sectionType={previewSection?.section_type || "reading"}
        title={previewSection?.title || ""}
        timeLimit={previewSection?.time_limit_minutes?.toString() || ""}
        isPractice={previewSection?.is_practice || false}
        isLoading={isLoadingPreview}
        contentBlocks={isLoadingPreview ? [] : previewData.contentBlocks}
        questionGroups={isLoadingPreview ? [] : previewData.questionGroups}
        questions={isLoadingPreview ? [] : previewData.questions}
      />
    </div>
  );
}
