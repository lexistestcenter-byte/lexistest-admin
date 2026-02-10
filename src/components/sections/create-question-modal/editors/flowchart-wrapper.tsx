"use client";

import { FlowchartEditor } from "@/components/questions/flowchart-editor";
import type { TabState } from "../types";
import { blanksToShared, blanksFromShared } from "./blanks-adapter";

interface ModalFlowchartEditorProps {
  tab: TabState;
  updateTab: (updates: Partial<TabState>) => void;
  addFlowchartNode: (type: "box" | "branch") => void;
}

export function ModalFlowchartEditor({ tab, updateTab, addFlowchartNode }: ModalFlowchartEditorProps) {
  return (
    <div className="space-y-6">
      <FlowchartEditor
        title={tab.flowchartTitle}
        setTitle={(v) => updateTab({ flowchartTitle: v })}
        nodes={tab.flowchartNodes}
        setNodes={(v) => updateTab({ flowchartNodes: v })}
        addNode={addFlowchartNode}
        blanks={blanksToShared(tab.flowchartBlanks)}
        setBlanks={(v) => updateTab({ flowchartBlanks: blanksFromShared(v) })}
        updateBlank={(id, field, value) => {
          updateTab({
            flowchartBlanks: tab.flowchartBlanks.map(b => {
              if (b.id !== id) return b;
              if (field === "alternatives") {
                return { ...b, alternatives: Array.isArray(value) ? (value as string[]).join(", ") : String(value) };
              }
              return { ...b, [field]: value };
            }),
          });
        }}
        instructions={tab.instructions}
        setInstructions={(v) => updateTab({ instructions: v })}
      />
    </div>
  );
}
