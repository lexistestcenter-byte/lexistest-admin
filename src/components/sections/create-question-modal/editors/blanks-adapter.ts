import type { TabState } from "../types";

// Adapter: converts BlankItem.alternatives (string) <-> Blank.alternatives (string[])
export function blanksToShared(blanks: TabState["blanks"]) {
  return blanks.map(b => ({
    ...b,
    alternatives: typeof b.alternatives === "string"
      ? b.alternatives.split(",").map(s => s.trim()).filter(Boolean)
      : (b.alternatives || []),
  }));
}

export function blanksFromShared(blanks: { id: string; number: number; answer: string; alternatives: string[] }[]) {
  return blanks.map(b => ({
    ...b,
    alternatives: Array.isArray(b.alternatives) ? b.alternatives.join(", ") : (b.alternatives || ""),
  }));
}
