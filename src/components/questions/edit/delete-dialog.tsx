"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

export function DeleteDialog({
  open,
  onOpenChange,
  questionCode,
  isDeleting,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionCode: string;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>문제 삭제</AlertDialogTitle>
          <AlertDialogDescription>
            정말로 이 문제를 삭제하시겠습니까?
            <br />
            <strong className="text-foreground">{questionCode}</strong>
            <br /><br />
            <span className="text-amber-600">
              이 문제가 포함된 그룹이나 섹션에서 제거됩니다.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                삭제 중...
              </>
            ) : (
              "삭제"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
