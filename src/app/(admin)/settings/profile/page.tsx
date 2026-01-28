"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api/client";
import { ROLE_LABELS } from "@/types/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ProfileSettingsPage() {
  const { admin } = useAuth();
  const [name, setName] = useState(admin?.name || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!admin) return;
    if (!name.trim()) {
      toast.error("이름을 입력하세요");
      return;
    }

    setIsSaving(true);

    const { error } = await api.patch("/api/profile", { name: name.trim() });

    setIsSaving(false);

    if (error) {
      toast.error("저장 실패: " + error);
      return;
    }

    toast.success("프로필이 저장되었습니다");
    // 페이지 새로고침으로 context 업데이트
    window.location.reload();
  };

  if (!admin) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="프로필 설정"
        description="내 프로필 정보를 관리합니다."
      />

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>
              프로필 사진은 Google 계정에서 가져옵니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={admin.avatar_url || undefined} />
                <AvatarFallback className="text-xl">
                  {admin.name?.slice(0, 2).toUpperCase() || "AD"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{admin.email}</p>
                <Badge variant="outline" className="mt-1">
                  {ROLE_LABELS[admin.role]}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                저장
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>계정 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">가입일</span>
              <span>{new Date(admin.created_at).toLocaleDateString("ko-KR")}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">마지막 로그인</span>
              <span>
                {admin.last_login_at
                  ? new Date(admin.last_login_at).toLocaleString("ko-KR")
                  : "-"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
