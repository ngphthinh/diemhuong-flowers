import Link from "next/link";
import { Flower2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20">
      <EmptyState icon={<Flower2 />} title="Không tìm thấy trang"
        description="Trang bạn tìm không tồn tại, hoặc sản phẩm đã được gỡ."
        action={<Link href="/products" className={buttonVariants()}>Xem tất cả sản phẩm</Link>} />
    </div>
  );
}
