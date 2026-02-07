"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";
import { useBreadcrumbOverrides } from "./breadcrumb-context";

const pathNameMap: Record<string, string> = {
  dashboard: "대시보드",
  users: "사용자 관리",
  students: "학생 관리",
  groups: "학생 그룹",
  exams: "시험 관리",
  questions: "문제 관리",
  sections: "섹션 관리",
  packages: "패키지 관리",
  passages: "지문 관리",
  audio: "오디오 관리",
  assignments: "패키지 할당",
  coupons: "쿠폰 관리",
  access: "접근 권한",
  sessions: "응시 현황",
  scores: "성적 관리",
  feedback: "피드백 관리",
  "scoring-rules": "채점 설정",
  "ai-prompts": "AI 프롬프트",
  contents: "콘텐츠 관리",
  notifications: "알림 관리",
  logs: "활동 로그",
  settings: "설정",
  admins: "관리자 설정",
  profile: "프로필",
  new: "새로 만들기",
  edit: "수정",
};

// UUID 패턴 감지
const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export function BreadcrumbNav() {
  const pathname = usePathname();
  const overrides = useBreadcrumbOverrides();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/questions">홈</BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;

          // 1. 먼저 오버라이드 확인
          // 2. pathNameMap에서 찾기
          // 3. UUID면 "상세" 표시
          // 4. 그 외에는 segment 그대로
          let label = overrides[href] || pathNameMap[segment];
          if (!label) {
            label = isUUID(segment) ? "상세" : segment;
          }

          return (
            <Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
