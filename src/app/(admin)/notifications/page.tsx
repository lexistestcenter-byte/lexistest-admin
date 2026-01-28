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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreHorizontal, Eye, RefreshCw, Mail, MessageSquare, Smartphone } from "lucide-react";

interface NotificationRow {
  id: string;
  user_name: string;
  recipient: string;
  notification_type: "email" | "kakao" | "sms";
  subject?: string;
  status: "pending" | "sent" | "failed";
  sent_at?: string;
  error_message?: string;
  created_at: string;
}

interface TemplateRow {
  id: string;
  code: string;
  name: string;
  notification_type: "email" | "kakao" | "sms";
  is_active: boolean;
  updated_at: string;
}

// Mock data - Notifications
const mockNotifications: NotificationRow[] = [
  {
    id: "1",
    user_name: "김철수",
    recipient: "kim@example.com",
    notification_type: "email",
    subject: "시험 결과가 준비되었습니다",
    status: "sent",
    sent_at: "2026-01-27 15:30",
    created_at: "2026-01-27 15:30",
  },
  {
    id: "2",
    user_name: "이영희",
    recipient: "010-1234-5678",
    notification_type: "kakao",
    status: "sent",
    sent_at: "2026-01-27 14:00",
    created_at: "2026-01-27 14:00",
  },
  {
    id: "3",
    user_name: "박민수",
    recipient: "park@example.com",
    notification_type: "email",
    subject: "과제 제출 마감 알림",
    status: "failed",
    error_message: "Invalid email address",
    created_at: "2026-01-27 12:00",
  },
  {
    id: "4",
    user_name: "정수연",
    recipient: "jung@example.com",
    notification_type: "email",
    subject: "새로운 과제가 배정되었습니다",
    status: "pending",
    created_at: "2026-01-27 16:00",
  },
];

// Mock data - Templates
const mockTemplates: TemplateRow[] = [
  {
    id: "1",
    code: "test_result_ready",
    name: "Test Result Notification",
    notification_type: "email",
    is_active: true,
    updated_at: "2026-01-20",
  },
  {
    id: "2",
    code: "test_result_ready_kakao",
    name: "Test Result Kakao Notification",
    notification_type: "kakao",
    is_active: true,
    updated_at: "2026-01-20",
  },
  {
    id: "3",
    code: "assignment_due_reminder",
    name: "Assignment Due Reminder",
    notification_type: "email",
    is_active: true,
    updated_at: "2026-01-15",
  },
  {
    id: "4",
    code: "welcome_email",
    name: "Welcome Email",
    notification_type: "email",
    is_active: true,
    updated_at: "2026-01-10",
  },
];

const typeIcons = {
  email: Mail,
  kakao: MessageSquare,
  sms: Smartphone,
};

const statusColors = {
  pending: "secondary",
  sent: "default",
  failed: "destructive",
} as const;

const statusLabels = {
  pending: "대기",
  sent: "발송완료",
  failed: "실패",
};

const notificationColumns: Column<NotificationRow>[] = [
  {
    key: "type",
    header: "유형",
    cell: (notification) => {
      const Icon = typeIcons[notification.notification_type];
      return (
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="capitalize">{notification.notification_type}</span>
        </div>
      );
    },
  },
  {
    key: "user",
    header: "수신자",
    cell: (notification) => (
      <div>
        <div className="font-medium">{notification.user_name}</div>
        <div className="text-sm text-muted-foreground">
          {notification.recipient}
        </div>
      </div>
    ),
  },
  {
    key: "subject",
    header: "제목",
    cell: (notification) => notification.subject || "-",
  },
  {
    key: "status",
    header: "상태",
    cell: (notification) => (
      <div>
        <Badge variant={statusColors[notification.status]}>
          {statusLabels[notification.status]}
        </Badge>
        {notification.error_message && (
          <div className="text-xs text-destructive mt-1">
            {notification.error_message}
          </div>
        )}
      </div>
    ),
  },
  {
    key: "sent_at",
    header: "발송 시간",
    cell: (notification) => (
      <span className="text-muted-foreground">
        {notification.sent_at || "-"}
      </span>
    ),
  },
  {
    key: "actions",
    header: "",
    cell: (notification) => (
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
            <Eye className="mr-2 h-4 w-4" />
            상세 보기
          </DropdownMenuItem>
          {notification.status === "failed" && (
            <DropdownMenuItem>
              <RefreshCw className="mr-2 h-4 w-4" />
              재발송
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    className: "w-[50px]",
  },
];

const templateColumns: Column<TemplateRow>[] = [
  {
    key: "template",
    header: "템플릿",
    cell: (template) => (
      <div>
        <div className="font-medium">{template.name}</div>
        <div className="text-sm text-muted-foreground font-mono">
          {template.code}
        </div>
      </div>
    ),
  },
  {
    key: "type",
    header: "유형",
    cell: (template) => {
      const Icon = typeIcons[template.notification_type];
      return (
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="capitalize">{template.notification_type}</span>
        </div>
      );
    },
  },
  {
    key: "status",
    header: "상태",
    cell: (template) => (
      <Badge variant={template.is_active ? "default" : "secondary"}>
        {template.is_active ? "활성" : "비활성"}
      </Badge>
    ),
  },
  {
    key: "updated_at",
    header: "수정일",
    cell: (template) => (
      <span className="text-muted-foreground">{template.updated_at}</span>
    ),
  },
  {
    key: "actions",
    header: "",
    cell: () => (
      <Button variant="ghost" size="sm">
        수정
      </Button>
    ),
    className: "w-[80px]",
  },
];

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="알림 관리"
        description="알림 발송 이력과 템플릿을 관리합니다."
      />

      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="logs">발송 이력</TabsTrigger>
          <TabsTrigger value="templates">템플릿 관리</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-4 space-y-4">
          <div className="flex gap-4">
            <Select defaultValue="all">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 유형</SelectItem>
                <SelectItem value="email">이메일</SelectItem>
                <SelectItem value="kakao">카카오</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="pending">대기</SelectItem>
                <SelectItem value="sent">발송완료</SelectItem>
                <SelectItem value="failed">실패</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DataTable
            columns={notificationColumns}
            data={mockNotifications}
            searchPlaceholder="수신자 또는 제목으로 검색..."
            totalItems={1234}
          />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <DataTable
            columns={templateColumns}
            data={mockTemplates}
            searchPlaceholder="템플릿명으로 검색..."
            totalItems={8}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
