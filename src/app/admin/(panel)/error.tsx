"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function PanelError({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState icon={<AlertTriangle />} title="Không tải được trang"
      description="Đã có lỗi xảy ra. Hãy thử lại; nếu vẫn lỗi, kiểm tra log máy chủ."
      action={<Button onClick={reset}>Thử lại</Button>} />
  );
}
