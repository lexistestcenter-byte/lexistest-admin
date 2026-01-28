"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { canAccessPath } from "@/types/auth";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, admin, isLoading, error, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && admin) {
      // 권한 체크
      if (!canAccessPath(admin.role, pathname)) {
        router.push("/dashboard?error=unauthorized");
      }
    }
  }, [admin, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 로그인은 됐지만 admin 레코드가 없음 (화이트리스트에 없음)
  if (user && !admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">관리자 권한이 없습니다</p>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {user.email}은(는) 화이트리스트에 등록되지 않았습니다.
          <br />
          관리자에게 문의하여 화이트리스트에 등록을 요청하세요.
        </p>
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
        <Button variant="outline" onClick={() => signOut()}>
          로그아웃
        </Button>
      </div>
    );
  }

  // 비활성화된 관리자
  if (admin && !admin.is_active) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">계정이 비활성화되었습니다</p>
        <p className="text-sm text-muted-foreground">
          관리자에게 문의하세요.
        </p>
        <Button variant="outline" onClick={() => signOut()}>
          로그아웃
        </Button>
      </div>
    );
  }

  // 권한 없는 페이지 접근 시
  if (admin && !canAccessPath(admin.role, pathname)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">접근 권한이 없습니다</p>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          대시보드로 이동
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
