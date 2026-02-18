"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, Column } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  RefreshCw,
  Loader2,
  Undo2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

type CouponStatus = "paid" | "expired" | "refunded";

interface CouponRow {
  id: string;
  user_id: string;
  package_id: string;
  wp_order_id: string;
  amount: number;
  status: CouponStatus;
  expires_at?: string | null;
  created_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  package?: {
    id: string;
    title: string;
    unique_code: string;
  } | null;
}

const statusConfig: Record<
  CouponStatus,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  paid: { label: "결제완료", variant: "default" },
  expired: { label: "만료", variant: "secondary" },
  refunded: { label: "환불", variant: "destructive" },
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Refund dialog
  const [refundTarget, setRefundTarget] = useState<CouponRow | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);

  const loadCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", pageSize.toString());
      params.set("offset", ((currentPage - 1) * pageSize).toString());
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const { data, error } = await api.get<{
        coupons: CouponRow[];
        pagination: { total: number };
      }>(`/api/coupons?${params.toString()}`);

      if (error) throw new Error(error);

      setCoupons(data?.coupons || []);
      setTotalItems(data?.pagination?.total || 0);
    } catch (error) {
      console.error("Error loading coupons:", error);
      toast.error("이용권 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, search, statusFilter]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentPage(1), 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleRefund = async () => {
    if (!refundTarget) return;

    setIsRefunding(true);
    try {
      const { error } = await api.patch(`/api/coupons/${refundTarget.id}`, {
        status: "refunded",
      });

      if (error) throw new Error(error);

      toast.success("환불 처리가 완료되었습니다.");
      loadCoupons();
    } catch (error) {
      console.error("Error refunding coupon:", error);
      toast.error(
        error instanceof Error ? error.message : "환불 처리에 실패했습니다."
      );
    } finally {
      setIsRefunding(false);
      setRefundTarget(null);
    }
  };

  const handleCopyOrderId = (orderId: string) => {
    navigator.clipboard.writeText(orderId);
    toast.success("주문번호가 복사되었습니다.");
  };

  const columns: Column<CouponRow>[] = [
    {
      key: "user",
      header: "사용자",
      cell: (coupon) => (
        <div>
          <div className="font-medium">{coupon.user?.name || "-"}</div>
          <div className="text-sm text-muted-foreground">
            {coupon.user?.email || "-"}
          </div>
        </div>
      ),
    },
    {
      key: "package",
      header: "패키지",
      cell: (coupon) => (
        <div>
          <div className="font-medium">{coupon.package?.title || "-"}</div>
          <div className="text-sm text-muted-foreground font-mono">
            {coupon.package?.unique_code || "-"}
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      header: "결제금액",
      cell: (coupon) => (
        <span className="font-medium tabular-nums">
          {coupon.amount?.toLocaleString("ko-KR") || 0}원
        </span>
      ),
    },
    {
      key: "status",
      header: "상태",
      cell: (coupon) => {
        const config = statusConfig[coupon.status];
        return (
          <Badge variant={config?.variant || "secondary"}>
            {config?.label || coupon.status}
          </Badge>
        );
      },
    },
    {
      key: "wp_order_id",
      header: "WP 주문번호",
      cell: (coupon) => (
        <span className="text-sm font-mono text-muted-foreground">
          {coupon.wp_order_id || "-"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "결제일",
      cell: (coupon) => (
        <span className="text-sm text-muted-foreground">
          {coupon.created_at
            ? new Date(coupon.created_at).toLocaleDateString("ko-KR")
            : "-"}
        </span>
      ),
    },
    {
      key: "expires_at",
      header: "만료일",
      cell: (coupon) => (
        <span className="text-sm text-muted-foreground">
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
            <DropdownMenuItem
              onClick={() => handleCopyOrderId(coupon.wp_order_id)}
            >
              <Copy className="mr-2 h-4 w-4" />
              주문번호 복사
            </DropdownMenuItem>
            {coupon.status === "paid" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setRefundTarget(coupon)}
                >
                  <Undo2 className="mr-2 h-4 w-4" />
                  환불 처리
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-[50px]",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="이용권 관리"
        description="결제된 이용권(쿠폰) 내역을 관리합니다."
        actions={
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadCoupons()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        }
      />

      {/* 상태 필터 */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="paid">결제완료</SelectItem>
            <SelectItem value="expired">만료</SelectItem>
            <SelectItem value="refunded">환불</SelectItem>
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
          data={coupons}
          searchPlaceholder="사용자명, 이메일 또는 주문번호로 검색..."
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

      {/* Refund Confirmation */}
      <AlertDialog
        open={!!refundTarget}
        onOpenChange={() => setRefundTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>환불 처리</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 이용권을 환불 처리하시겠습니까?
              <br />
              환불 시 해당 패키지 접근 권한이 회수됩니다.
              <br />
              <br />
              <span className="text-foreground font-medium">
                사용자: {refundTarget?.user?.name || "-"}
              </span>
              <br />
              <span className="text-foreground font-medium">
                패키지: {refundTarget?.package?.title || "-"}
              </span>
              <br />
              <span className="text-foreground font-medium">
                금액: {refundTarget?.amount?.toLocaleString("ko-KR") || 0}원
              </span>
              <br />
              <span className="text-foreground font-medium">
                주문번호: {refundTarget?.wp_order_id || "-"}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRefunding}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefund}
              disabled={isRefunding}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRefunding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                "환불 처리"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
