"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function GuestError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-20">
      <EmptyState icon={<TriangleAlert />} title="Không tải được trang"
        description="Có lỗi khi lấy dữ liệu. Kiểm tra kết nối và thử lại sau ít giây."
        action={<Button onClick={reset}><RotateCcw /> Thử lại</Button>} />
    </div>
  );
}
