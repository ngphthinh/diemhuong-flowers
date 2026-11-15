import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGetSettings } from "@/features/store-settings/admin-service";

export const metadata: Metadata = { title: "Cấu hình cửa hàng" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Cấu hình cửa hàng" description="Thông tin hiển thị ở header, footer và trang liên hệ. Kênh để trống sẽ tự ẩn." />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  await connection();
  const s = await adminGetSettings();
  return <SettingsForm key={s.updatedAt} settings={s} />;
}
