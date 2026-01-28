"use client";

import { PageHeader } from "@/components/common/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

const permissions = [
  { id: "manage_exams", label: "시험 관리" },
  { id: "manage_users", label: "사용자 관리" },
  { id: "grade_students", label: "학생 채점" },
  { id: "view_group_results", label: "그룹 성적 조회" },
  { id: "manage_assignments", label: "과제 관리" },
  { id: "send_notifications", label: "알림 발송" },
];

export default function NewUserPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="사용자 추가" description="새로운 사용자를 등록합니다." />

      <form className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>
              사용자의 기본 정보를 입력해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input id="name" placeholder="홍길동" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">이메일 *</Label>
                <Input id="email" type="email" placeholder="user@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">전화번호</Label>
                <Input id="phone" placeholder="010-1234-5678" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wp_user_id">WordPress 사용자 ID *</Label>
                <Input id="wp_user_id" type="number" placeholder="12345" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>역할 및 권한</CardTitle>
            <CardDescription>
              사용자의 역할과 추가 권한을 설정합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role">역할 *</Label>
                <Select defaultValue="student">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">관리자</SelectItem>
                    <SelectItem value="teacher">강사</SelectItem>
                    <SelectItem value="student">학생</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_score">목표 점수</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="선택..." />
                  </SelectTrigger>
                  <SelectContent>
                    {[5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map(
                      (score) => (
                        <SelectItem key={score} value={score.toString()}>
                          {score}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>추가 권한</Label>
              <div className="grid gap-2 md:grid-cols-3">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox id={permission.id} />
                    <Label
                      htmlFor={permission.id}
                      className="text-sm font-normal"
                    >
                      {permission.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="is_active" defaultChecked />
              <Label htmlFor="is_active">활성 상태</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href="/users">취소</Link>
          </Button>
          <Button type="submit">저장</Button>
        </div>
      </form>
    </div>
  );
}
