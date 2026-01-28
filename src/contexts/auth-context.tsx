"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { User, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Admin, AdminRole } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  admin: Admin | null;
  isLoading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Supabase 클라이언트는 OAuth와 세션 리스너에만 사용
  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []) as SupabaseClient | null;

  // API 라우트로 관리자 프로필 조회
  const fetchAuthProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/profile", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          return { user: null, admin: null };
        }
        throw new Error("Failed to fetch profile");
      }

      const data = await res.json();
      return { user: data.user as User | null, admin: data.admin as Admin | null };
    } catch (err) {
      console.error("fetchAuthProfile error:", err);
      return { user: null, admin: null };
    }
  }, []);

  // API 라우트로 마지막 로그인 시간 업데이트
  const updateLastLogin = useCallback(async () => {
    try {
      await fetch("/api/auth/profile", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("updateLastLogin error:", err);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setError("Supabase client not initialized");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // API 라우트로 현재 프로필 조회
    const initAuth = async () => {
      try {
        const { user: authUser, admin: adminData } = await fetchAuthProfile();

        if (!isMounted) return;

        setUser(authUser);
        setAdmin(adminData);

        if (authUser && !adminData) {
          setError("관리자 권한이 없습니다. 화이트리스트를 확인하세요.");
        }

        if (adminData) {
          updateLastLogin();
        }

        setIsLoading(false);
      } catch (err) {
        console.error("initAuth error:", err);
        if (isMounted) {
          setError("인증 초기화 실패");
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // 인증 상태 변경 감지 (OAuth 콜백 등)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "INITIAL_SESSION") return;

      if (session?.user) {
        // API로 프로필 다시 조회
        const { user: authUser, admin: adminData } = await fetchAuthProfile();
        setUser(authUser);
        setAdmin(adminData);
        setError(adminData ? null : "관리자 권한이 없습니다. 화이트리스트를 확인하세요.");

        if (event === "SIGNED_IN" && adminData) {
          updateLastLogin();
        }
      } else {
        setUser(null);
        setAdmin(null);
        setError(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchAuthProfile, updateLastLogin]);

  const signInWithGoogle = async () => {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Google sign in error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
      throw error;
    }
    setUser(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        admin,
        isLoading,
        error,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// 역할 확인 훅
export function useRole(): AdminRole | null {
  const { admin } = useAuth();
  return admin?.role ?? null;
}
