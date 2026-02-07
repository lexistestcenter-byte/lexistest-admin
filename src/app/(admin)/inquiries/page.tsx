"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, Column } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Loader2, MessageSquareText, Send } from "lucide-react";
import { toast } from "sonner";

interface InquiryUser {
  email: string;
  name: string;
}

interface InquiryAdmin {
  email: string;
  name: string;
}

interface InquiryRow {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  content: string;
  status: "pending" | "in_progress" | "resolved" | "closed";
  admin_id: string | null;
  reply: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
  users: InquiryUser;
  admins: InquiryAdmin | null;
}

interface StatusCounts {
  all: number;
  pending: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

const statusLabels: Record<string, string> = {
  pending: "대기중",
  in_progress: "처리중",
  resolved: "해결됨",
  closed: "닫힘",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
};

const categoryLabels: Record<string, string> = {
  general: "일반",
  technical: "기술",
  exam: "시험",
  payment: "결제",
  account: "계정",
  other: "기타",
};

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    all: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  });

  // Filters
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");

  // Pagination
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  // Reply dialog
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryRow | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const loadInquiries = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      params.set("offset", ((currentPage - 1) * limit).toString());

      if (selectedStatus !== "all") {
        params.set("status", selectedStatus);
      }
      if (selectedCategory !== "all") {
        params.set("category", selectedCategory);
      }
      if (search) {
        params.set("search", search);
      }

      const response = await fetch(`/api/inquiries?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch inquiries");
      }

      const result = await response.json();
      setInquiries(result.inquiries || []);
      setStatusCounts(result.statusCounts || { all: 0, pending: 0, in_progress: 0, resolved: 0, closed: 0 });
      setTotalItems(result.pagination?.total || 0);
    } catch (error) {
      console.error("Error loading inquiries:", error);
      toast.error("문의 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, selectedStatus, selectedCategory, search]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Open inquiry detail
  const handleOpenInquiry = async (inquiry: InquiryRow) => {
    setSelectedInquiry(inquiry);
    setReplyText(inquiry.reply || "");

    // 대기중인 문의를 열면 처리중으로 변경
    if (inquiry.status === "pending") {
      try {
        await fetch(`/api/inquiries/${inquiry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "in_progress" }),
        });
        loadInquiries();
      } catch {
        // 상태 변경 실패해도 다이얼로그는 열기
      }
    }
  };

  // Submit reply
  const handleReply = async () => {
    if (!selectedInquiry || !replyText.trim()) return;

    setIsReplying(true);
    try {
      const response = await fetch(`/api/inquiries/${selectedInquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: replyText.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "답변 등록에 실패했습니다.");
      }

      toast.success("답변이 등록되었습니다.");
      setSelectedInquiry(null);
      setReplyText("");
      loadInquiries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "답변 등록에 실패했습니다.");
    } finally {
      setIsReplying(false);
    }
  };

  // Change status
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("상태 변경에 실패했습니다.");
      }

      toast.success(`상태가 "${statusLabels[newStatus]}"(으)로 변경되었습니다.`);
      loadInquiries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "상태 변경에 실패했습니다.");
    }
  };

  const columns: Column<InquiryRow>[] = [
    {
      key: "status",
      header: "상태",
      cell: (row) => (
        <Badge variant="outline" className={statusColors[row.status]}>
          {statusLabels[row.status]}
        </Badge>
      ),
      className: "w-[90px]",
    },
    {
      key: "category",
      header: "카테고리",
      cell: (row) => (
        <Badge variant="outline">
          {categoryLabels[row.category] || row.category}
        </Badge>
      ),
      className: "w-[80px]",
    },
    {
      key: "subject",
      header: "제목",
      cell: (row) => (
        <button
          onClick={() => handleOpenInquiry(row)}
          className="text-left hover:underline text-primary font-medium"
        >
          {row.subject}
        </button>
      ),
    },
    {
      key: "user",
      header: "문의자",
      cell: (row) => (
        <div className="text-sm">
          <div className="font-medium">{row.users?.name || "-"}</div>
          <div className="text-muted-foreground text-xs">{row.users?.email || "-"}</div>
        </div>
      ),
      className: "w-[160px]",
    },
    {
      key: "reply_status",
      header: "답변",
      cell: (row) => (
        row.reply ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            답변완료
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">
            미답변
          </Badge>
        )
      ),
      className: "w-[80px]",
    },
    {
      key: "created_at",
      header: "문의일",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.created_at).toLocaleDateString("ko-KR")}
        </span>
      ),
      className: "w-[100px]",
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleOpenInquiry(row)}
        >
          <MessageSquareText className="h-4 w-4 mr-1" />
          보기
        </Button>
      ),
      className: "w-[80px]",
    },
  ];

  const statusTabs = [
    { value: "all", label: "전체", count: statusCounts.all },
    { value: "pending", label: "대기중", count: statusCounts.pending },
    { value: "in_progress", label: "처리중", count: statusCounts.in_progress },
    { value: "resolved", label: "해결됨", count: statusCounts.resolved },
    { value: "closed", label: "닫힘", count: statusCounts.closed },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="문의 관리"
        description="학생들의 문의 내용을 확인하고 답변합니다."
        actions={
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadInquiries()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        }
      />

      {/* 상태 탭 + 카테고리 필터 */}
      <div className="flex items-center gap-6">
        <Tabs
          value={selectedStatus}
          onValueChange={(val) => {
            setSelectedStatus(val);
            setCurrentPage(1);
          }}
        >
          <TabsList>
            {statusTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                {tab.label}
                <Badge
                  variant="secondary"
                  className={`ml-1 h-5 min-w-[20px] px-1.5 text-xs ${
                    tab.value === "pending" && tab.count > 0
                      ? "bg-yellow-200 text-yellow-800"
                      : ""
                  }`}
                >
                  {tab.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="h-6 w-px bg-slate-200" />

        <Select
          value={selectedCategory}
          onValueChange={(val) => {
            setSelectedCategory(val);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 카테고리</SelectItem>
            <SelectItem value="general">일반</SelectItem>
            <SelectItem value="technical">기술</SelectItem>
            <SelectItem value="exam">시험</SelectItem>
            <SelectItem value="payment">결제</SelectItem>
            <SelectItem value="account">계정</SelectItem>
            <SelectItem value="other">기타</SelectItem>
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
          data={inquiries}
          searchPlaceholder="제목 또는 내용으로 검색..."
          totalItems={totalItems}
          pageSize={limit}
          currentPage={currentPage}
          onSearch={setSearch}
          onPageChange={setCurrentPage}
        />
      )}

      {/* 문의 상세 / 답변 다이얼로그 */}
      <Dialog
        open={!!selectedInquiry}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedInquiry(null);
            setReplyText("");
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedInquiry && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={statusColors[selectedInquiry.status]}>
                    {statusLabels[selectedInquiry.status]}
                  </Badge>
                  <Badge variant="outline">
                    {categoryLabels[selectedInquiry.category]}
                  </Badge>
                </div>
                <DialogTitle className="text-lg">{selectedInquiry.subject}</DialogTitle>
                <DialogDescription>
                  {selectedInquiry.users?.name} ({selectedInquiry.users?.email}) ·{" "}
                  {new Date(selectedInquiry.created_at).toLocaleString("ko-KR")}
                </DialogDescription>
              </DialogHeader>

              {/* 문의 내용 */}
              <div className="rounded-lg border bg-slate-50 p-4 text-sm whitespace-pre-wrap">
                {selectedInquiry.content}
              </div>

              {/* 기존 답변 */}
              {selectedInquiry.reply && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="text-xs text-green-700 font-medium mb-2">
                    관리자 답변
                    {selectedInquiry.replied_at && (
                      <span className="ml-2 font-normal text-green-600">
                        {new Date(selectedInquiry.replied_at).toLocaleString("ko-KR")}
                      </span>
                    )}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{selectedInquiry.reply}</div>
                </div>
              )}

              {/* 답변 입력 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedInquiry.reply ? "답변 수정" : "답변 작성"}
                  </span>
                  {selectedInquiry.status !== "closed" && (
                    <Select
                      value={selectedInquiry.status}
                      onValueChange={(val) => handleStatusChange(selectedInquiry.id, val)}
                    >
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">대기중</SelectItem>
                        <SelectItem value="in_progress">처리중</SelectItem>
                        <SelectItem value="resolved">해결됨</SelectItem>
                        <SelectItem value="closed">닫힘</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <Textarea
                  placeholder="답변을 입력하세요..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedInquiry(null);
                    setReplyText("");
                  }}
                >
                  닫기
                </Button>
                <Button
                  onClick={handleReply}
                  disabled={isReplying || !replyText.trim()}
                >
                  {isReplying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      등록 중...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      답변 등록
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
