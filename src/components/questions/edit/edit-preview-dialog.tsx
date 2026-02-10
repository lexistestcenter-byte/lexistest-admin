"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuestionPreview, type QuestionPreviewData } from "@/components/questions/question-preview";
import type { QuestionType } from "@/components/questions/types";
import { questionTypeInfo } from "@/components/questions/constants";

export function EditPreviewDialog({
  open,
  onClose,
  questionType,
  previewData,
}: {
  open: boolean;
  onClose: () => void;
  questionType: QuestionType | null;
  previewData: QuestionPreviewData | null;
}) {
  const typeInfo = questionType ? questionTypeInfo.find(t => t.id === questionType) : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[95vw] max-w-[95vw] w-[95vw] max-h-[85vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            미리보기 - 실제 시험 화면
            {typeInfo && (
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>
                {typeInfo.name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 bg-slate-100 min-h-full">
            {/* Audio */}
            {previewData?.audioUrl && (
              <audio src={previewData.audioUrl} autoPlay />
            )}

            {/* 지시문 */}
            {previewData?.instructions && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium text-blue-900">{previewData.instructions}</p>
              </div>
            )}

            {/* Question content */}
            {previewData && <QuestionPreview data={previewData} />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
