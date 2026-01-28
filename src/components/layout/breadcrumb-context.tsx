"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface BreadcrumbOverrides {
  [path: string]: string;
}

interface BreadcrumbContextType {
  overrides: BreadcrumbOverrides;
  setOverride: (path: string, label: string) => void;
  clearOverride: (path: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<BreadcrumbOverrides>({});

  const setOverride = useCallback((path: string, label: string) => {
    setOverrides((prev) => ({ ...prev, [path]: label }));
  }, []);

  const clearOverride = useCallback((path: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[path];
      return next;
    });
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ overrides, setOverride, clearOverride }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error("useBreadcrumb must be used within BreadcrumbProvider");
  }
  return context;
}

export function useBreadcrumbOverrides() {
  const context = useContext(BreadcrumbContext);
  return context?.overrides || {};
}
