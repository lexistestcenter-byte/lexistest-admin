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
import { MoreHorizontal, Trash2, Clock } from "lucide-react";

interface AccessRow {
  id: string;
  user_name: string;
  user_email: string;
  exam_title: string;
  access_type: "coupon" | "assigned" | "trial" | "purchase";
  expires_at?: string;
  created_at: string;
}

// Mock data
const mockAccess: AccessRow[] = [
  {
    id: "1",
    user_name: "김철수",
    user_email: "kim@example.com",
    exam_title: "IELTS Academic Mock Test 1",
    access_type: "coupon",
    expires_at: "2026-12-31",
    created_at: "2026-01-15",
  },
  {
    id: "2",
    user_name: "이영희",
    user_email: "lee@example.com",
    exam_title: "Listening Practice Set 1",
    access_type: "trial",
    created_at: "2026-01-10",
  },
  {
    id: "3",
    user_name: "박민수",
    user_email: "park@example.com",
    exam_title: "IELTS 풀패키지 10회분",
    access_type: "purchase",
    expires_at: "2027-01-01",
    created_at: "2026-01-01",
  },
  {
    id: "4",
    user_name: "정수연",
    user_email: "jung@example.com",
    exam_title: "Writing Task 2 Practice",
    access_type: "assigned",
    expires_at: "2026-02-28",
    created_at: "2026-01-20",
  },
];

const accessTypeLabels = {
  coupon: "쿠폰",
  assigned: "배정",
  trial: "체험",
  purchase: "구매",
};

const accessTypeColors = {
  coupon: "default",
  assigned: "secondary",
  trial: "outline",
  purchase: "default",
} as const;

const columns: Column<AccessRow>[] = [
  {
    key: "user",
    header: "사용자",
    cell: (access) => (
      <div>
        <div className="font-medium">{access.user_name}</div>
        <div className="text-sm text-muted-foreground">{access.user_email}</div>
      </div>
    ),
  },
  {
    key: "exam",
    header: "시험",
    cell: (access) => access.exam_title,
  },
  {
    key: "type",
    header: "접근 유형",
    cell: (access) => (
      <Badge variant={accessTypeColors[access.access_type]}>
        {accessTypeLabels[access.access_type]}
      </Badge>
    ),
  },
  {
    key: "expires",
    header: "만료일",
    cell: (access) => (
      <div className="flex items-center gap-2 text-muted-foreground">
        {access.expires_at ? (
          <>
            <Clock className="h-3 w-3" />
            {access.expires_at}
          </>
        ) : (
          "무기한"
        )}
      </div>
    ),
  },
  {
    key: "created_at",
    header: "부여일",
    cell: (access) => (
      <span className="text-muted-foreground">{access.created_at}</span>
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
            <Clock className="mr-2 h-4 w-4" />
            만료일 연장
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            권한 취소
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    className: "w-[50px]",
  },
];

export default function AccessPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="접근 권한"
        description="사용자별 시험 접근 권한을 관리합니다."
        createHref="/access/new"
        createLabel="권한 부여"
      />

      <div className="flex gap-4">
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="접근 유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 유형</SelectItem>
            <SelectItem value="coupon">쿠폰</SelectItem>
            <SelectItem value="assigned">배정</SelectItem>
            <SelectItem value="trial">체험</SelectItem>
            <SelectItem value="purchase">구매</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={mockAccess}
        searchPlaceholder="사용자 이름 또는 시험명으로 검색..."
        totalItems={1245}
      />
    </div>
  );
}
