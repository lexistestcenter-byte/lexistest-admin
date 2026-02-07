export type AdminRole = "super_admin" | "admin" | "editor";

export interface Admin {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: AdminRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

// 역할별 접근 가능한 메뉴 그룹
export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ["*"], // 모든 권한
  admin: [
    "dashboard",
    "questions",
    "sections",
    "packages",
    "students",
    "groups",
    "inquiries",
    "coupons",
    "sessions",
    "scores",
    "feedback",
    "notifications",
    "logs",
  ],
  editor: [
    "dashboard",
    "questions",
    "sections",
    "packages",
  ],
};

// 메뉴 경로와 권한 매핑
export const MENU_PERMISSIONS: Record<string, string> = {
  "/dashboard": "dashboard",
  "/questions": "questions",
  "/sections": "sections",
  "/packages": "packages",
  "/students": "students",
  "/groups": "groups",
  "/coupons": "coupons",
  "/sessions": "sessions",
  "/scores": "scores",
  "/feedback": "feedback",
  "/notifications": "notifications",
  "/logs": "logs",
  "/settings": "settings",
  "/inquiries": "inquiries",
};

// 역할별 접근 가능 여부 확인
export function hasPermission(role: AdminRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (permissions.includes("*")) return true;
  return permissions.includes(permission);
}

// 경로 접근 가능 여부 확인
export function canAccessPath(role: AdminRole, path: string): boolean {
  // super_admin은 모든 경로 접근 가능
  if (role === "super_admin") return true;

  // 경로에서 permission 추출
  const basePath = "/" + path.split("/")[1];
  const permission = MENU_PERMISSIONS[basePath];

  if (!permission) return false; // 매핑 없는 경로는 기본 거부
  return hasPermission(role, permission);
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "최고관리자",
  admin: "관리자",
  editor: "편집자",
};
