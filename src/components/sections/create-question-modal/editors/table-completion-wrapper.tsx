"use client";

import { TableCompletionEditor } from "@/components/questions/table-completion-editor";
import type { TabState } from "../types";
import { blanksToShared, blanksFromShared } from "./blanks-adapter";

interface ModalTableCompletionEditorProps {
  tab: TabState;
  updateTab: (updates: Partial<TabState>) => void;
}

export function ModalTableCompletionEditor({ tab, updateTab }: ModalTableCompletionEditorProps) {
  return (
    <div className="space-y-6">
      <TableCompletionEditor
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
        inputMode={tab.tableInputMode}
        setInputMode={(v) => updateTab({ tableInputMode: v })}
      />
    </div>
  );
}
