"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, Column } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Copy,
  RefreshCw,
  Loader2,
  Plus,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

interface CouponRow {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  package_ids: string[];
  usage_limit?: number | null;
  used_count: number;
  is_active: boolean;
  expires_at?: string | null;
  created_at: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 20;

  // Create/Edit dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CouponRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    usage_limit: "",
    is_active: true,
    expires_at: "",
  });

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<CouponRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      params.set("offset", ((currentPage - 1) * limit).toString());
      if (search) params.set("search", search);

      const { data, error } = await api.get<{
        coupons: CouponRow[];
        pagination: { total: number };
      }>(`/api/coupons?${params.toString()}`);

      if (error) throw new Error(error);

      setCoupons(data?.coupons || []);
      setTotalItems(data?.pagination?.total || 0);
    } catch (error) {
      console.error("Error loading coupons:", error);
      toast.error("쿠폰 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentPage(1), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      usage_limit: "",
      is_active: true,
      expires_at: "",
    });
    setEditTarget(null);
  };

  const openCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEdit = (coupon: CouponRow) => {
    setEditTarget(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || "",
      usage_limit: coupon.usage_limit?.toString() || "",
      is_active: coupon.is_active,
      expires_at: coupon.expires_at
        ? new Date(coupon.expires_at).toISOString().slice(0, 16)
        : "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error("코드와 이름은 필수입니다.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        usage_limit: formData.usage_limit
          ? parseInt(formData.usage_limit)
          : null,
        is_active: formData.is_active,
        expires_at: formData.expires_at || null,
      };

      let result;
      if (editTarget) {
        result = await api.put(`/api/coupons/${editTarget.id}`, payload);
      } else {
        result = await api.post(`/api/coupons`, payload);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success(editTarget ? "쿠폰이 수정되었습니다." : "쿠폰이 생성되었습니다.");
      setIsDialogOpen(false);
      resetForm();
      loadCoupons();
    } catch (error) {
      console.error("Error saving coupon:", error);
      toast.error(
        error instanceof Error ? error.message : "쿠폰 저장에 실패했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const { error } = await api.delete(`/api/coupons/${deleteTarget.id}`);

      if (error) {
        throw new Error(error);
      }

      toast.success("쿠폰이 비활성화되었습니다.");
      loadCoupons();
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast.error(
        error instanceof Error ? error.message : "쿠폰 비활성화에 실패했습니다."
      );
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("쿠폰 코드가 복사되었습니다.");
  };

  const columns: Column<CouponRow>[] = [
    {
      key: "coupon",
      header: "쿠폰",
      cell: (coupon) => (
        <div>
          <div className="font-medium">{coupon.name}</div>
          <div className="text-sm text-muted-foreground font-mono">
            {coupon.code}
          </div>
        </div>
      ),
    },
    {
      key: "packages",
      header: "패키지 수",
      cell: (coupon) => (
        <Badge variant="outline">{coupon.package_ids?.length || 0}개</Badge>
      ),
    },
    {
      key: "usage",
      header: "사용 현황",
      cell: (coupon) => (
        <div className="space-y-1 min-w-[120px]">
          <div className="flex justify-between text-sm">
            <span>{coupon.used_count}회</span>
            <span className="text-muted-foreground">
              {coupon.usage_limit ? `/ ${coupon.usage_limit}` : "무제한"}
            </span>
          </div>
          {coupon.usage_limit && (
            <Progress
              value={(coupon.used_count / coupon.usage_limit) * 100}
              className="h-2"
            />
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "상태",
      cell: (coupon) => (
        <Badge variant={coupon.is_active ? "default" : "secondary"}>
          {coupon.is_active ? "활성" : "비활성"}
        </Badge>
      ),
    },
    {
      key: "expires",
      header: "만료일",
      cell: (coupon) => (
        <span className="text-muted-foreground text-sm">
          {coupon.expires_at
            ? new Date(coupon.expires_at).toLocaleDateString("ko-KR")
            : "없음"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (coupon) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>작업</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openEdit(coupon)}>
              <Pencil className="mr-2 h-4 w-4" />
              수정
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCopyCode(coupon.code)}>
              <Copy className="mr-2 h-4 w-4" />
              코드 복사
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteTarget(coupon)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              비활성화
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
        title="쿠폰 관리"
        description="시험 접근 쿠폰을 관리합니다."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => loadCoupons()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              쿠폰 생성
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={coupons}
          searchPlaceholder="쿠폰 코드 또는 이름으로 검색..."
          totalItems={totalItems}
          pageSize={limit}
          currentPage={currentPage}
          onSearch={setSearch}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) resetForm();
          setIsDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "쿠폰 수정" : "쿠폰 생성"}
            </DialogTitle>
            <DialogDescription>
              {editTarget
                ? "쿠폰 정보를 수정합니다."
                : "새로운 쿠폰을 생성합니다."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">쿠폰 코드 <span className="text-red-500">*</span></Label>
              <Input
                id="code"
                placeholder="PREMIUM-2026-001"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">쿠폰 이름 <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                placeholder="프리미엄 패키지 쿠폰"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                placeholder="쿠폰에 대한 설명"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usage_limit">사용 제한 (비워두면 무제한)</Label>
              <Input
                id="usage_limit"
                type="number"
                min={1}
                placeholder="100"
                value={formData.usage_limit}
                onChange={(e) =>
                  setFormData({ ...formData, usage_limit: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires_at">만료일 (선택)</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) =>
                  setFormData({ ...formData, expires_at: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                활성화
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
            >
              취소
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : editTarget ? (
                "수정"
              ) : (
                "생성"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>쿠폰 비활성화</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 쿠폰을 비활성화하시겠습니까?
              <br />
              <strong className="text-foreground">{deleteTarget?.code}</strong> -{" "}
              {deleteTarget?.name}
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
                  처리 중...
                </>
              ) : (
                "비활성화"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
