"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, Column } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Trash2, UserPlus, Shield, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Admin, AdminRole, ROLE_LABELS } from "@/types/auth";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

interface WhitelistEntry {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
  created_at: string;
}

const roleColors: Record<AdminRole, string> = {
  super_admin: "bg-red-100 text-red-700 border-red-200",
  admin: "bg-blue-100 text-blue-700 border-blue-200",
  editor: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function AdminSettingsPage() {
  const { admin: currentAdmin } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("editor");

  // 데이터 로드
  const loadData = async () => {
    setIsLoading(true);

    const [adminsRes, whitelistRes] = await Promise.all([
      api.get<Admin[]>("/api/admins"),
      api.get<WhitelistEntry[]>("/api/admins/whitelist"),
    ]);

    if (adminsRes.data) setAdmins(adminsRes.data);
    if (whitelistRes.data) setWhitelist(whitelistRes.data);

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 화이트리스트 추가
  const handleAddWhitelist = async () => {
    if (!newEmail.trim()) {
      toast.error("이메일을 입력하세요");
      return;
    }

    const { error } = await api.post("/api/admins/whitelist", {
      email: newEmail.trim().toLowerCase(),
      name: newName.trim() || null,
      role: newRole,
    });

    if (error) {
      if (error.includes("exists")) {
        toast.error("이미 등록된 이메일입니다");
      } else {
        toast.error("추가 실패: " + error);
      }
      return;
    }

    toast.success("화이트리스트에 추가되었습니다");
    setIsAddDialogOpen(false);
    setNewEmail("");
    setNewName("");
    setNewRole("editor");
    loadData();
  };

  // 화이트리스트 삭제
  const handleDeleteWhitelist = async (id: string) => {
    const { error } = await api.delete(`/api/admins/whitelist?id=${id}`);

    if (error) {
      toast.error("삭제 실패: " + error);
      return;
    }

    toast.success("삭제되었습니다");
    loadData();
  };

  // 관리자 역할 변경
  const handleUpdateAdminRole = async (adminId: string, role: AdminRole) => {
    if (adminId === currentAdmin?.id) {
      toast.error("본인의 역할은 변경할 수 없습니다");
      return;
    }

    const { error } = await api.patch("/api/admins", { adminId, role });

    if (error) {
      toast.error("변경 실패: " + error);
      return;
    }

    toast.success("역할이 변경되었습니다");
    loadData();
  };

  // 관리자 활성/비활성
  const handleToggleActive = async (adminId: string, isActive: boolean) => {
    if (adminId === currentAdmin?.id) {
      toast.error("본인 계정은 비활성화할 수 없습니다");
      return;
    }

    const { error } = await api.patch("/api/admins", { adminId, is_active: isActive });

    if (error) {
      toast.error("변경 실패: " + error);
      return;
    }

    toast.success(isActive ? "활성화되었습니다" : "비활성화되었습니다");
    loadData();
  };

  // 관리자 목록 컬럼
  const adminColumns: Column<Admin>[] = [
    {
      key: "admin",
      header: "관리자",
      cell: (admin) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={admin.avatar_url || undefined} />
            <AvatarFallback>
              {admin.name?.slice(0, 2).toUpperCase() || "AD"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium flex items-center gap-2">
              {admin.name}
              {admin.id === currentAdmin?.id && (
                <Badge variant="outline" className="text-xs">나</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">{admin.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "역할",
      cell: (admin) => (
        <Badge variant="outline" className={roleColors[admin.role]}>
          {admin.role === "super_admin" && <ShieldCheck className="mr-1 h-3 w-3" />}
          {admin.role === "admin" && <Shield className="mr-1 h-3 w-3" />}
          {ROLE_LABELS[admin.role]}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "상태",
      cell: (admin) => (
        <Badge variant={admin.is_active ? "default" : "secondary"}>
          {admin.is_active ? "활성" : "비활성"}
        </Badge>
      ),
    },
    {
      key: "last_login",
      header: "마지막 로그인",
      cell: (admin) => (
        <span className="text-muted-foreground text-sm">
          {admin.last_login_at
            ? new Date(admin.last_login_at).toLocaleString("ko-KR")
            : "-"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (admin) =>
        currentAdmin?.role === "super_admin" && admin.id !== currentAdmin.id ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>역할 변경</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleUpdateAdminRole(admin.id, "super_admin")}>
                최고관리자
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleUpdateAdminRole(admin.id, "admin")}>
                관리자
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleUpdateAdminRole(admin.id, "editor")}>
                편집자
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleToggleActive(admin.id, !admin.is_active)}
              >
                {admin.is_active ? "비활성화" : "활성화"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null,
      className: "w-[50px]",
    },
  ];

  // 화이트리스트 컬럼
  const whitelistColumns: Column<WhitelistEntry>[] = [
    {
      key: "email",
      header: "이메일",
      cell: (entry) => (
        <div>
          <div className="font-medium">{entry.email}</div>
          {entry.name && (
            <div className="text-sm text-muted-foreground">{entry.name}</div>
          )}
        </div>
      ),
    },
    {
      key: "role",
      header: "부여 역할",
      cell: (entry) => (
        <Badge variant="outline" className={roleColors[entry.role]}>
          {ROLE_LABELS[entry.role]}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "등록일",
      cell: (entry) => (
        <span className="text-muted-foreground text-sm">
          {new Date(entry.created_at).toLocaleDateString("ko-KR")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (entry) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => handleDeleteWhitelist(entry.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
      className: "w-[50px]",
    },
  ];

  // super_admin만 접근 가능
  if (currentAdmin?.role !== "super_admin") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">접근 권한이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="관리자 설정"
        description="관리자 계정 및 가입 허용 이메일을 관리합니다."
      />

      <Tabs defaultValue="admins">
        <TabsList>
          <TabsTrigger value="admins">관리자 목록</TabsTrigger>
          <TabsTrigger value="whitelist">가입 허용 목록</TabsTrigger>
        </TabsList>

        <TabsContent value="admins" className="mt-4">
          <DataTable
            columns={adminColumns}
            data={admins}
            searchPlaceholder="관리자 검색..."
            totalItems={admins.length}
          />
        </TabsContent>

        <TabsContent value="whitelist" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  이메일 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>가입 허용 이메일 추가</DialogTitle>
                  <DialogDescription>
                    추가된 이메일은 Google 로그인으로 관리자로 가입할 수 있습니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일 *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">이름 (선택)</Label>
                    <Input
                      id="name"
                      placeholder="홍길동"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">역할</Label>
                    <Select value={newRole} onValueChange={(v) => setNewRole(v as AdminRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">최고관리자</SelectItem>
                        <SelectItem value="admin">관리자</SelectItem>
                        <SelectItem value="editor">편집자</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleAddWhitelist}>추가</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <DataTable
            columns={whitelistColumns}
            data={whitelist}
            searchPlaceholder="이메일 검색..."
            totalItems={whitelist.length}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
