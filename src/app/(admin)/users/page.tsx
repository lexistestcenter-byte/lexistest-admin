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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Pencil, Trash2, Mail, UserCog } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: "admin" | "teacher" | "student";
  target_score?: number;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

// Mock data
const mockUsers: UserRow[] = [
  {
    id: "1",
    name: "김철수",
    email: "kim@example.com",
    role: "student",
    target_score: 7.0,
    is_active: true,
    created_at: "2026-01-15",
    last_login_at: "2026-01-27 10:30",
  },
  {
    id: "2",
    name: "이영희",
    email: "lee@example.com",
    role: "student",
    target_score: 6.5,
    is_active: true,
    created_at: "2026-01-10",
    last_login_at: "2026-01-26 15:45",
  },
  {
    id: "3",
    name: "박선생",
    email: "park@example.com",
    role: "teacher",
    is_active: true,
    created_at: "2025-12-01",
    last_login_at: "2026-01-27 09:00",
  },
  {
    id: "4",
    name: "정민수",
    email: "jung@example.com",
    role: "student",
    target_score: 8.0,
    is_active: false,
    created_at: "2025-11-20",
    last_login_at: "2026-01-01 12:00",
  },
  {
    id: "5",
    name: "최관리자",
    email: "admin@example.com",
    role: "admin",
    is_active: true,
    created_at: "2025-01-01",
    last_login_at: "2026-01-27 14:00",
  },
];

const roleColors = {
  admin: "destructive",
  teacher: "default",
  student: "secondary",
} as const;

const roleLabels = {
  admin: "관리자",
  teacher: "강사",
  student: "학생",
};

const columns: Column<UserRow>[] = [
  {
    key: "user",
    header: "사용자",
    cell: (user) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={`/avatars/${user.id}.png`} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{user.name}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
      </div>
    ),
  },
  {
    key: "role",
    header: "역할",
    cell: (user) => (
      <Badge variant={roleColors[user.role]}>{roleLabels[user.role]}</Badge>
    ),
  },
  {
    key: "target_score",
    header: "목표 점수",
    cell: (user) => (user.target_score ? `${user.target_score}` : "-"),
  },
  {
    key: "status",
    header: "상태",
    cell: (user) => (
      <Badge variant={user.is_active ? "default" : "secondary"}>
        {user.is_active ? "활성" : "비활성"}
      </Badge>
    ),
  },
  {
    key: "last_login",
    header: "마지막 로그인",
    cell: (user) => (
      <span className="text-muted-foreground">
        {user.last_login_at || "없음"}
      </span>
    ),
  },
  {
    key: "actions",
    header: "",
    cell: (user) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">메뉴 열기</span>
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
            <UserCog className="mr-2 h-4 w-4" />
            권한 설정
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Mail className="mr-2 h-4 w-4" />
            이메일 발송
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

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="사용자 관리"
        description="플랫폼 사용자를 조회하고 관리합니다."
        createHref="/users/new"
        createLabel="사용자 추가"
      />

      {/* Filters */}
      <div className="flex gap-4">
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="역할 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 역할</SelectItem>
            <SelectItem value="admin">관리자</SelectItem>
            <SelectItem value="teacher">강사</SelectItem>
            <SelectItem value="student">학생</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="상태 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="active">활성</SelectItem>
            <SelectItem value="inactive">비활성</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={mockUsers}
        searchPlaceholder="이름 또는 이메일로 검색..."
        totalItems={125}
      />
    </div>
  );
}
