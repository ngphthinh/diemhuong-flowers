import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ContactCards } from "@/components/site/contact-links";
import { ContactForm } from "@/components/site/contact-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getStoreSettings } from "@/features/store-settings/service";

export const metadata: Metadata = {
  title: "Liên hệ",
  description:
    "Liên hệ cửa hàng hoa qua hotline, Zalo, Messenger, email hoặc gửi yêu cầu tư vấn trực tuyến.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-semibold sm:text-5xl">Liên hệ</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Chọn kênh bạn thấy tiện nhất, hoặc để lại thông tin để cửa hàng gọi lại.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <Suspense fallback={<Skeleton className="h-64" />}>
          <Channels />
        </Suspense>

        <section
          aria-labelledby="form-title"
          className="h-fit rounded-3xl border border-border bg-white p-5 sm:p-8">
          <h2 id="form-title" className="mb-1 text-2xl font-semibold">
            Gửi yêu cầu tư vấn
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Cửa hàng sẽ phản hồi qua số điện thoại bạn để lại.
          </p>
          <ContactForm />
        </section>
      </div>
    </div>
  );
}

async function Channels() {
  await connection();
  const settings = await getStoreSettings();
  return <ContactCards settings={settings} />;
}
