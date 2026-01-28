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
import { MoreHorizontal, Pencil, Trash2, Copy, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CouponRow {
  id: string;
  code: string;
  name: string;
  exam_count: number;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

// Mock data
const mockCoupons: CouponRow[] = [
  {
    id: "1",
    code: "PREMIUM-2026-001",
    name: "프리미엄 패키지 쿠폰",
    exam_count: 10,
    usage_limit: 100,
    used_count: 45,
    is_active: true,
    expires_at: "2026-12-31",
    created_at: "2026-01-01",
  },
  {
    id: "2",
    code: "WELCOME-FREE",
    name: "신규 가입 무료 쿠폰",
    exam_count: 1,
    usage_limit: undefined,
    used_count: 234,
    is_active: true,
    created_at: "2025-12-01",
  },
  {
    id: "3",
    code: "WRITING-SPECIAL",
    name: "Writing 특강 쿠폰",
    exam_count: 5,
    usage_limit: 50,
    used_count: 50,
    is_active: false,
    expires_at: "2026-01-15",
    created_at: "2025-12-15",
  },
  {
    id: "4",
    code: "STUDENT-2026",
    name: "학생 할인 쿠폰",
    exam_count: 3,
    usage_limit: 200,
    used_count: 78,
    is_active: true,
    expires_at: "2026-06-30",
    created_at: "2026-01-10",
  },
];

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
    key: "exams",
    header: "시험 수",
    cell: (coupon) => <Badge variant="outline">{coupon.exam_count}개</Badge>,
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
      <span className="text-muted-foreground">
        {coupon.expires_at || "없음"}
      </span>
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
            <Pencil className="mr-2 h-4 w-4" />
            수정
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Copy className="mr-2 h-4 w-4" />
            코드 복사
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Users className="mr-2 h-4 w-4" />
            사용 내역
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

export default function CouponsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="쿠폰 관리"
        description="시험 접근 쿠폰을 관리합니다."
        createHref="/coupons/new"
        createLabel="쿠폰 생성"
      />

      <DataTable
        columns={columns}
        data={mockCoupons}
        searchPlaceholder="쿠폰 코드 또는 이름으로 검색..."
        totalItems={67}
      />
    </div>
  );
}
