"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { MoreHorizontal, Pencil, Trash2, Copy, Layers, FileCheck, LayoutGrid, BookMarked, PackageOpen, Loader2 } from "lucide-react";
import Image from "next/image";
import { getCdnUrl } from "@/lib/cdn";

const typeFilters = [
  { id: "all", label: "전체", icon: null },
  { id: "full", label: "Full Test", icon: FileCheck, color: "text-blue-500" },
  { id: "section_only", label: "시험별", icon: LayoutGrid, color: "text-emerald-500" },
  { id: "practice", label: "연습", icon: BookMarked, color: "text-amber-500" },
  { id: "bundle", label: "번들", icon: PackageOpen, color: "text-purple-500" },
];

interface PackageRow {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  unique_code?: string;
  exam_type: "full" | "section_only";
  is_practice: boolean;
  is_bundle: boolean;
  section_count: number;
  is_published: boolean;
  is_free: boolean;
  created_at: string;
}

const examTypeLabels = {
  full: "Full Test",
  section_only: "시험별",
};

const examTypeColors = {
  full: "default",
  section_only: "secondary",
} as const;

export default function PackagesPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<PackageRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("limit", pageSize.toString());
      params.set("offset", ((currentPage - 1) * pageSize).toString());

      // "practice" 필터는 is_practice 기반, "bundle"은 is_bundle 기반, 나머지는 exam_type 기반
      if (selectedType === "practice") {
        params.set("is_practice", "true");
      } else if (selectedType === "bundle") {
        params.set("is_bundle", "true");
      } else if (selectedType !== "all") {
        params.set("exam_type", selectedType);
      }

      if (statusFilter === "published") {
        params.set("is_published", "true");
      } else if (statusFilter === "draft") {
        params.set("is_published", "false");
      }

      if (search) {
        params.set("search", search);
      }

      const { data, error: apiError } = await api.get<{
        packages: PackageRow[];
        pagination: { total: number };
      }>(`/api/packages?${params.toString()}`);
      if (apiError) throw new Error(apiError);
      setPackages(data?.packages || []);
      setTotalItems(data?.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [selectedType, statusFilter, search, currentPage, pageSize]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // 필터 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, statusFilter, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error: apiError } = await api.delete(`/api/packages/${deleteTarget.id}`);
      if (apiError) throw new Error(apiError);
      toast.success(`"${deleteTarget.title}" 패키지가 삭제되었습니다.`);
      setDeleteTarget(null);
      fetchPackages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  };

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
            {pkg.unique_code && (
              <div className="text-xs text-muted-foreground font-mono">
                {pkg.unique_code}
              </div>
            )}
            <div className="text-sm text-muted-foreground">{pkg.description}</div>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "유형",
      cell: (pkg) => (
        <div className="flex flex-col gap-1">
          <Badge variant={examTypeColors[pkg.exam_type]}>
            {examTypeLabels[pkg.exam_type]}
          </Badge>
          {pkg.is_bundle && (
            <Badge variant="outline" className="text-purple-600">
              번들
            </Badge>
          )}
          {pkg.is_practice && (
            <Badge variant="outline" className="text-amber-600">
              연습
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "sections",
      header: "구성",
      cell: (pkg) => (
        <div>
          <div className="font-medium">{pkg.section_count}개 시험</div>
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
        <span className="text-muted-foreground">
          {new Date(pkg.created_at).toLocaleDateString("ko-KR")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (pkg) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>작업</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/packages/${pkg.id}`)}>
              <Pencil className="mr-2 h-4 w-4" />
              수정
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              복제
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(pkg)}>
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
        title="패키지 관리"
        description="시험들을 조합하여 시험 패키지를 구성합니다."
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

        <Select value={statusFilter} onValueChange={setStatusFilter}>
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

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">불러오는 중...</span>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={packages}
          searchPlaceholder="패키지명으로 검색..."
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>패키지 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.title}&rdquo; 패키지를 삭제하시겠습니까?
              이 작업은 되돌릴 수 없으며, 연결된 시험 구성도 함께 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
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
