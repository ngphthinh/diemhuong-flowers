import { connection } from "next/server";
import { getStoreSettings } from "@/features/store-settings/service";
import { HeaderShell } from "./header-shell";

export async function SiteHeader() {
  await connection();
  const settings = await getStoreSettings();
  return <HeaderShell settings={settings} />;
}

/** Hiển thị trong lúc chờ dữ liệu cửa hàng. */
export function HeaderFallback() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-cream/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
        <span className="font-serif text-lg font-semibold text-brown">Anniversary Flower Shop</span>
      </div>
    </header>
  );
}
