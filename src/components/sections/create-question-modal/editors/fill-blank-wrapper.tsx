"use client";

import { FillBlankEditor, FillBlankDragEditor } from "@/components/questions/fill-blank-editor";
import type { TabState } from "../types";
import { blanksToShared, blanksFromShared } from "./blanks-adapter";

interface ModalFillBlankEditorProps {
  tab: TabState;
  updateTab: (updates: Partial<TabState>) => void;
}

export function ModalFillBlankEditor({ tab, updateTab }: ModalFillBlankEditorProps) {
  if (tab.selectedFormat === "fill_blank_drag") {
    return (
      <div className="space-y-6">
        <FillBlankDragEditor
          title={tab.fillTitle}
          setTitle={(v) => updateTab({ fillTitle: v })}
          content={tab.fillContent}
          setContent={(v) => updateTab({ fillContent: v })}
          blanks={blanksToShared(tab.blanks)}
          setBlanks={(v) => updateTab({ blanks: blanksFromShared(v) })}
          wordBank={tab.wordBank}
          setWordBank={(v) => updateTab({ wordBank: v })}
          blankMode={tab.blankMode}
          setBlankMode={(v) => updateTab({ blankMode: v })}
          allowDuplicate={tab.fillBlankDragAllowDuplicate}
          setAllowDuplicate={(v) => updateTab({ fillBlankDragAllowDuplicate: v })}
        />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <FillBlankEditor
        title={tab.fillTitle}
        setTitle={(v) => updateTab({ fillTitle: v })}
        content={tab.fillContent}
        setContent={(v) => updateTab({ fillContent: v })}
        blanks={blanksToShared(tab.blanks)}
        setBlanks={(v) => updateTab({ blanks: blanksFromShared(v) })}
        blankMode={tab.blankMode}
        setBlankMode={(v) => updateTab({ blankMode: v })}
      />
    </div>
  );
}
