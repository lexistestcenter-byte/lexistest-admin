"use client";

import { useEffect } from "react";

export default function DashboardPage() {
  useEffect(() => {
    // 대시보드 접근 시 문제 관리 페이지로 리다이렉트
    window.location.href = "/questions";
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center space-y-2">
        <p className="text-muted-foreground">리다이렉트 중...</p>
      </div>
    </div>
  );
}
