"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  GitBranch,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FlowchartNode, Blank } from "@/components/questions/types";

// =============================================================================
// Props
// =============================================================================
interface FlowchartEditorProps {
  title: string;
  setTitle: (v: string) => void;
  nodes: FlowchartNode[];
  setNodes: (v: FlowchartNode[]) => void;
  addNode: (type: "box" | "branch") => void;
  blanks: Blank[];
  setBlanks: (v: Blank[]) => void;
  updateBlank: (id: string, field: keyof Blank, value: unknown) => void;
  instructions: string;
  setInstructions: (v: string) => void;
}

// =============================================================================
// Helpers
// =============================================================================
function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

/** Group nodes by row number */
function groupByRow(nodes: FlowchartNode[]): Map<number, FlowchartNode[]> {
  const map = new Map<number, FlowchartNode[]>();
  for (const n of nodes) {
    const row = n.row ?? 0;
    if (!map.has(row)) map.set(row, []);
    map.get(row)!.push(n);
  }
  // Sort nodes within each row by col
  for (const [, group] of map) {
    group.sort((a, b) => (a.col ?? 0) - (b.col ?? 0));
  }
  return map;
}

/** Extract all [N] blank references from text */
function extractBlankNumbers(text: string): number[] {
  const matches = text.matchAll(/\[(\d+)\]/g);
  return [...matches].map((m) => parseInt(m[1]));
}

/** Render content with visual blank markers */
function renderContentWithBlanks(
  text: string,
  blanks: Blank[]
): React.ReactNode[] {
  if (!text) return [];
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (match) {
      const num = parseInt(match[1]);
      const blank = blanks.find((b) => b.number === num);
      return (
        <span key={i} className="inline-flex items-center gap-1 mx-0.5">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs font-bold">
            {num}
          </span>
          <span className="border-b-2 border-dashed border-primary px-2 py-0.5 text-xs text-muted-foreground min-w-[60px] inline-block">
            {blank?.answer || "___"}
          </span>
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// =============================================================================
// Main Component
// =============================================================================
export function FlowchartEditor({
  title,
  setTitle,
  nodes,
  setNodes,
  addNode,
  blanks,
  setBlanks,
  updateBlank,
  instructions,
  setInstructions,
}: FlowchartEditorProps) {
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [blanksExpanded, setBlanksExpanded] = useState(true);
  const [expandedBlank, setExpandedBlank] = useState<string | null>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const blanksRef = useRef(blanks);
  blanksRef.current = blanks;

  // Focus textarea when editing starts
  useEffect(() => {
    if (editingNodeId && editRef.current) {
      editRef.current.focus();
      editRef.current.selectionStart = editRef.current.value.length;
    }
  }, [editingNodeId]);

  useEffect(() => {
    if (editingTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.selectionStart = titleRef.current.value.length;
    }
  }, [editingTitle]);

  // ── Auto-sync blanks from node content ─────────────────────────────────
  const syncBlanksFromNodes = useCallback(
    (currentNodes: FlowchartNode[]) => {
      const allNums = currentNodes.flatMap((n) => extractBlankNumbers(n.content));
      const uniqueNums = [...new Set(allNums)];
      const curr = blanksRef.current;
      let updated = [...curr];
      let changed = false;

      // Add missing blanks
      for (const num of uniqueNums) {
        if (!updated.some((b) => b.number === num)) {
          updated.push({
            id: `fb${Date.now()}-${num}`,
            number: num,
            answer: "",
            alternatives: [],
          });
          changed = true;
        }
      }

      // Remove blanks no longer referenced
      const before = updated.length;
      updated = updated.filter((b) => uniqueNums.includes(b.number));
      if (updated.length !== before) changed = true;

      updated.sort((a, b) => a.number - b.number);
      if (changed) setBlanks(updated);
    },
    [setBlanks]
  );

  // ── Node management ────────────────────────────────────────────────────
  const updateNode = useCallback(
    (id: string, updates: Partial<FlowchartNode>) => {
      const newNodes = nodes.map((n) => (n.id === id ? { ...n, ...updates } : n));
      setNodes(newNodes);
      // If content changed, sync blanks
      if ("content" in updates) {
        syncBlanksFromNodes(newNodes);
      }
    },
    [nodes, setNodes, syncBlanksFromNodes]
  );

  const getMaxRow = useCallback(() => {
    if (nodes.length === 0) return -1;
    return Math.max(...nodes.map((n) => n.row ?? 0));
  }, [nodes]);

  const insertNodeAtRow = useCallback(
    (afterRow: number, type: "box" | "branch") => {
      // Shift all nodes with row > afterRow by 1
      const shifted = nodes.map((n) =>
        (n.row ?? 0) > afterRow ? { ...n, row: (n.row ?? 0) + 1 } : n
      );
      const newRow = afterRow + 1;
      if (type === "box") {
        const newNode: FlowchartNode = {
          id: generateId(),
          type: "box",
          content: "",
          row: newRow,
          col: 0,
          label: "",
        };
        setNodes([...shifted, newNode]);
      } else {
        // Branch: create 2 columns
        const left: FlowchartNode = {
          id: generateId(),
          type: "branch",
          content: "",
          row: newRow,
          col: 0,
          label: "",
        };
        const right: FlowchartNode = {
          id: generateId(),
          type: "branch",
          content: "",
          row: newRow,
          col: 1,
          label: "",
        };
        setNodes([...shifted, left, right]);
      }
    },
    [nodes, setNodes]
  );

  const removeNode = useCallback(
    (id: string) => {
      const node = nodes.find((n) => n.id === id);
      if (!node) return;
      const row = node.row ?? 0;

      let updated = nodes.filter((n) => n.id !== id);

      // Check if this row is now empty
      const remaining = updated.filter((n) => (n.row ?? 0) === row);
      if (remaining.length === 0) {
        // Compact rows: shift higher rows down
        updated = updated.map((n) =>
          (n.row ?? 0) > row ? { ...n, row: (n.row ?? 0) - 1 } : n
        );
      } else if (
        remaining.length === 1 &&
        remaining[0].type === "branch"
      ) {
        // Single branch left → convert to box
        updated = updated.map((n) =>
          n.id === remaining[0].id
            ? { ...n, type: "box" as const, col: 0, label: undefined }
            : n
        );
      }

      setNodes(updated);
      syncBlanksFromNodes(updated);
      if (editingNodeId === id) setEditingNodeId(null);
    },
    [nodes, setNodes, editingNodeId, syncBlanksFromNodes]
  );

  const addBranchColumn = useCallback(
    (row: number) => {
      const branchesInRow = nodes.filter(
        (n) => (n.row ?? 0) === row && n.type === "branch"
      );
      const maxCol = branchesInRow.length > 0
        ? Math.max(...branchesInRow.map((n) => n.col ?? 0))
        : -1;
      const newNode: FlowchartNode = {
        id: generateId(),
        type: "branch",
        content: "",
        row,
        col: maxCol + 1,
        label: "",
      };
      setNodes([...nodes, newNode]);
    },
    [nodes, setNodes]
  );

  // ── Row groups ─────────────────────────────────────────────────────────
  const rowMap = groupByRow(nodes);
  const sortedRows = [...rowMap.keys()].sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {/* ─── Flowchart Visual Canvas ─────────────────────────────── */}
      <div className="border rounded-xl bg-slate-50/50 p-6 space-y-0">
        {/* Title */}
        <div className="flex justify-center mb-6">
          {editingTitle ? (
            <Input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === "Escape" || e.key === "Enter")
                  setEditingTitle(false);
              }}
              className="max-w-md text-center text-lg font-semibold bg-white"
              placeholder="플로우차트 제목"
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="text-lg font-semibold text-slate-700 border-b-2 border-dashed border-transparent hover:border-slate-400 transition-colors px-4 py-1 cursor-text"
            >
              {title || (
                <span className="text-muted-foreground italic">
                  클릭하여 제목 입력
                </span>
              )}
            </button>
          )}
        </div>

        {/* Nodes */}
        {sortedRows.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <p className="text-sm mb-3">노드를 추가하여 플로우차트를 시작하세요</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addNode("box")}
              >
                <Plus className="h-4 w-4 mr-1" />
                박스 추가
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addNode("branch")}
              >
                <GitBranch className="h-4 w-4 mr-1" />
                분기 추가
              </Button>
            </div>
          </div>
        ) : (
          sortedRows.map((row, rowIndex) => {
            const group = rowMap.get(row)!;
            const isBranch = group.length > 1 || group[0]?.type === "branch";

            return (
              <div key={row}>
                {/* Connector from previous row */}
                {rowIndex > 0 && (
                  <div className="flex justify-center">
                    <div className="flex flex-col items-center">
                      <div className="w-px h-4 bg-slate-400" />
                      {/* Insert button between rows */}
                      <InsertButton
                        onInsertBox={() =>
                          insertNodeAtRow(sortedRows[rowIndex - 1], "box")
                        }
                        onInsertBranch={() =>
                          insertNodeAtRow(sortedRows[rowIndex - 1], "branch")
                        }
                      />
                      <div className="w-px h-4 bg-slate-400" />
                      <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-transparent border-t-slate-400" />
                    </div>
                  </div>
                )}

                {/* Branch split connector */}
                {isBranch && group.length > 1 && (
                  <div className="flex justify-center mb-1">
                    <div className="flex items-end" style={{ width: `${Math.min(group.length * 40, 90)}%` }}>
                      <div className="flex-1 border-t-2 border-slate-400 h-0" />
                      {group.slice(1).map((_, i) => (
                        <div key={i} className="flex-1 border-t-2 border-slate-400 h-0" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Node row */}
                {isBranch ? (
                  <div className="flex justify-center gap-3 items-start flex-wrap">
                    {group.map((node) => (
                      <div key={node.id} className="w-2/5 min-w-[180px]">
                        <NodeCard
                          node={node}
                          blanks={blanks}
                          isEditing={editingNodeId === node.id}
                          onStartEdit={() => setEditingNodeId(node.id)}
                          onStopEdit={() => setEditingNodeId(null)}
                          onUpdate={updateNode}
                          onRemove={() => removeNode(node.id)}
                          isBranch
                        />
                      </div>
                    ))}
                    {/* Add column button */}
                    <button
                      onClick={() => addBranchColumn(row)}
                      className="flex items-center justify-center w-8 h-8 mt-6 rounded border-2 border-dashed border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors self-center"
                      title="분기 열 추가"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <div className="w-2/5">
                      <NodeCard
                        node={group[0]}
                        blanks={blanks}
                        isEditing={editingNodeId === group[0].id}
                        onStartEdit={() => setEditingNodeId(group[0].id)}
                        onStopEdit={() => setEditingNodeId(null)}
                        onUpdate={updateNode}
                        onRemove={() => removeNode(group[0].id)}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Bottom add buttons */}
        {sortedRows.length > 0 && (
          <div className="flex justify-center pt-4">
            <div className="flex flex-col items-center">
              <div className="w-px h-4 bg-slate-300" />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const maxRow = getMaxRow();
                    insertNodeAtRow(maxRow, "box");
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  박스 추가
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const maxRow = getMaxRow();
                    insertNodeAtRow(maxRow, "branch");
                  }}
                >
                  <GitBranch className="h-3 w-3 mr-1" />
                  분기 추가
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Blanks panel (collapsible) ───────────────────────── */}
      <div className="border rounded-lg">
        <button
          onClick={() => setBlanksExpanded(!blanksExpanded)}
          className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-left hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            빈칸 정답
            <Badge variant="secondary" className="text-xs">
              {blanks.length}
            </Badge>
          </span>
          {blanksExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {blanksExpanded && (
          <div className="border-t divide-y">
            {blanks.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">노드에 [번호] 형식으로 빈칸을 입력하면 자동으로 추가됩니다</p>
              </div>
            ) : (
              blanks.map((blank) => (
                <div key={blank.id} className="p-3 space-y-2">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center justify-center w-10 h-9 rounded-md bg-slate-100 text-sm font-mono font-semibold text-slate-600">
                      {blank.number}
                    </span>
                    <Input
                      value={blank.answer}
                      onChange={(e) =>
                        updateBlank(blank.id, "answer", e.target.value)
                      }
                      placeholder="정답"
                      className="flex-1 h-9"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedBlank(
                          expandedBlank === blank.id ? null : blank.id
                        )
                      }
                      className="text-xs"
                    >
                      {expandedBlank === blank.id
                        ? "접기"
                        : `대체 ${blank.alternatives?.length || 0}`}
                    </Button>
                  </div>
                  {expandedBlank === blank.id && (
                    <div className="ml-20 space-y-2 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          대체 정답
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() =>
                            updateBlank(blank.id, "alternatives", [
                              ...(blank.alternatives || []),
                              "",
                            ])
                          }
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          추가
                        </Button>
                      </div>
                      {(blank.alternatives || []).map((alt, i) => (
                        <div key={i} className="flex gap-2">
                          <Input
                            value={alt}
                            onChange={(e) => {
                              const alts = [...(blank.alternatives || [])];
                              alts[i] = e.target.value;
                              updateBlank(blank.id, "alternatives", alts);
                            }}
                            placeholder={`대체 ${i + 1}`}
                            className="h-8 text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateBlank(
                                blank.id,
                                "alternatives",
                                (blank.alternatives || []).filter(
                                  (_, idx) => idx !== i
                                )
                              )
                            }
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Hint */}
      <p className="text-xs text-muted-foreground">
        노드 내용에{" "}
        <code className="bg-slate-100 px-1 rounded">[1]</code>,{" "}
        <code className="bg-slate-100 px-1 rounded">[2]</code> 형식으로
        빈칸을 입력하면 정답 영역이 자동으로 추가/삭제됩니다.
      </p>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

/** A single flowchart node card */
function NodeCard({
  node,
  blanks,
  isEditing,
  onStartEdit,
  onStopEdit,
  onUpdate,
  onRemove,
  isBranch,
}: {
  node: FlowchartNode;
  blanks: Blank[];
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onUpdate: (id: string, updates: Partial<FlowchartNode>) => void;
  onRemove: () => void;
  isBranch?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const labelRef = useRef<HTMLInputElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  const hasBlank = /\[\d+\]/.test(node.content);
  const borderColor = hasBlank
    ? "border-amber-300 hover:border-amber-400"
    : isBranch
    ? "border-blue-300 hover:border-blue-400"
    : "border-slate-300 hover:border-slate-400";
  const bgColor = isBranch ? "bg-blue-50" : "bg-white";

  return (
    <div
      className={`relative group rounded-lg border-2 ${borderColor} ${bgColor} transition-colors shadow-sm flex flex-col w-full min-h-[80px]`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Blank badge */}
      {hasBlank && (
        <span className="absolute -top-2.5 left-2 z-10 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-700 border border-amber-300 leading-none">
          문제
        </span>
      )}

      {/* Delete button on hover */}
      {hovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Label - always editable */}
      <div className="px-3 pt-2 pb-0 shrink-0">
        <Input
          ref={labelRef}
          value={node.label || ""}
          onChange={(e) => onUpdate(node.id, { label: e.target.value })}
          placeholder="라벨 (선택)"
          className={`h-6 text-xs font-medium bg-transparent border-0 border-b border-dashed p-0 rounded-none focus-visible:ring-0 ${isBranch ? "text-blue-600 placeholder:text-blue-300" : "text-slate-500 placeholder:text-slate-300"}`}
        />
      </div>

      {/* Content */}
      <div className="p-3 flex-1 overflow-y-auto min-h-0" onClick={!isEditing ? onStartEdit : undefined}>
        {isEditing ? (
          <Textarea
            ref={textareaRef}
            value={node.content}
            onChange={(e) => onUpdate(node.id, { content: e.target.value })}
            onBlur={onStopEdit}
            onKeyDown={(e) => {
              if (e.key === "Escape") onStopEdit();
            }}
            placeholder="내용 입력 (빈칸: [번호])"
            className="h-full text-sm bg-transparent border-0 p-0 resize-none focus-visible:ring-0"
            rows={2}
          />
        ) : (
          <div className="text-sm leading-relaxed cursor-text select-none">
            {node.content ? (
              renderContentWithBlanks(node.content, blanks)
            ) : (
              <span className="text-muted-foreground italic">
                클릭하여 편집
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Insert button shown between rows */
function InsertButton({
  onInsertBox,
  onInsertBranch,
}: {
  onInsertBox: () => void;
  onInsertBranch: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-dashed border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
          <Plus className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        <DropdownMenuItem onClick={onInsertBox}>
          <Plus className="h-4 w-4 mr-2" />
          박스 추가
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onInsertBranch}>
          <GitBranch className="h-4 w-4 mr-2" />
          분기 추가
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
