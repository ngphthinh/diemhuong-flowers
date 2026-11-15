import type { Metadata } from "next";
import { ProductImport } from "@/components/admin/product-import";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Nhập sản phẩm từ Excel" };

export default function ImportProductsPage() {
  return (
    <>
      <PageHeader title="Nhập sản phẩm từ Excel" description="Tải file mẫu → điền dữ liệu → xem trước & kiểm tra → xác nhận nhập"
        crumbs={[{ label: "Sản phẩm", href: "/admin/products" }, { label: "Nhập Excel" }]} />
      <ProductImport />
    </>
  );
}
