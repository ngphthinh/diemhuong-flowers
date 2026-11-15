"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
}

/** Hộp thoại xác nhận thao tác nguy hiểm (xóa). */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Xóa", loading, onConfirm }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)} title={title} className="max-w-md">
      <div className="text-sm text-muted-foreground">{description}</div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>Hủy</Button>
        <Button variant="destructive" onClick={onConfirm} disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
