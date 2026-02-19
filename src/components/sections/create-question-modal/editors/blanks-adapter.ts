import type { TabState } from "../types";

export function blanksToShared(blanks: TabState["blanks"]) {
  return blanks.map(b => ({
    ...b,
    alternatives: Array.isArray(b.alternatives) ? b.alternatives : [],
  }));
}

export function blanksFromShared(blanks: { id: string; number: number; answer: string; alternatives: string[] }[]) {
  return blanks.map(b => ({
    ...b,
    alternatives: Array.isArray(b.alternatives) ? b.alternatives : [],
  }));
}
