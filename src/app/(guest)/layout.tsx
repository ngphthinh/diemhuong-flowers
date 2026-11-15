import { Suspense } from "react";
import { Toaster } from "sonner";
import { FooterFallback, SiteFooter } from "@/components/site/site-footer";
import { HeaderFallback, SiteHeader } from "@/components/site/site-header";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2">
        Bỏ qua điều hướng
      </a>
      <Suspense fallback={<HeaderFallback />}>
        <SiteHeader />
      </Suspense>
      <main id="main">{children}</main>
      <Suspense fallback={<FooterFallback />}>
        <SiteFooter />
      </Suspense>
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}
