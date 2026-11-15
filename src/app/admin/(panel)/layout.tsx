import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { AdminFrame } from "@/components/admin/admin-frame";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdminPage } from "@/lib/auth/guard";

export const metadata: Metadata = { title: { default: "Quản trị", template: "%s | Quản trị" }, robots: { index: false, follow: false } };

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-8"><Skeleton className="h-10 w-64" /><Skeleton className="mt-6 h-72" /></div>}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}

/** Kiểm tra quyền ở server cho MỌI trang trong (panel). Không có session hợp lệ -> redirect /admin/login. */
async function Gate({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await requireAdminPage();
  return (
    <>
      <AdminFrame user={{ fullName: session.fullName, email: session.email }}>{children}</AdminFrame>
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}
