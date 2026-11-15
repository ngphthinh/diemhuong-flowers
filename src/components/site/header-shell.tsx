"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Flower2, Menu, Phone, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StoreSettingsDTO } from "@/features/store-settings/service";

const NAV = [
  { href: "/", label: "Trang chủ" },
  { href: "/products", label: "Sản phẩm" },
  { href: "/contact", label: "Liên hệ" },
];

function SearchForm({ className }: { className?: string }) {
  return (
    <form
      action="/products"
      method="get"
      role="search"
      className={cn("relative", className)}>
      <label htmlFor="site-search" className="sr-only">
        Tìm hoa
      </label>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        id="site-search"
        name="q"
        type="search"
        placeholder="Tìm hoa theo tên..."
        maxLength={100}
        className="h-11 w-full rounded-full border border-input bg-white pl-10 pr-4 text-base placeholder:text-muted-foreground sm:h-10 sm:text-sm placeholder:text-muted-foreground focus-visible:border-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/30"
      />
    </form>
  );
}

export function Brand({
  settings,
}: {
  settings: Pick<StoreSettingsDTO, "storeName" | "logo">;
}) {
  return (
    <Link
      href="/"
      className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {settings.logo ? (
        <Image
          src={settings.logo}
          alt=""
          width={36}
          height={36}
          className="size-9 rounded-full object-cover"
        />
      ) : (
        <span className="flex size-9 items-center justify-center rounded-full bg-rose-soft text-rose-dark">
          <Flower2 className="size-5" aria-hidden />
        </span>
      )}
      <span className="font-serif text-base font-semibold leading-tight text-brown sm:text-lg">
        {settings.storeName}
      </span>
    </Link>
  );
}

export function HeaderShell({ settings }: { settings: StoreSettingsDTO }) {
  const pathname = usePathname();
  // Menu mobile gắn với đường dẫn: đổi trang là tự đóng
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const setOpen = (v: boolean) => setOpenPath(v ? pathname : null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenPath(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Brand settings={settings} />

        <nav
          aria-label="Menu chính"
          className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-rose-soft",
                isActive(item.href)
                  ? "bg-rose-soft text-rose-dark"
                  : "text-brown",
              )}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <SearchForm className="w-60" />
          {settings.phone && (
            <a
              href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}
              className="flex items-center gap-2 rounded-full bg-rose px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-dark">
              <Phone className="size-4" aria-hidden />
              {settings.phone}
            </a>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          className="ml-auto shrink-0 rounded-full p-2.5 text-brown hover:bg-rose-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden">
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border/70 bg-cream px-4 pb-5 pt-3 md:hidden">
          <SearchForm className="mb-3" />
          <nav aria-label="Menu di động" className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "rounded-xl px-4 py-3 text-base font-medium hover:bg-rose-soft",
                  isActive(item.href)
                    ? "bg-rose-soft text-rose-dark"
                    : "text-brown",
                )}>
                {item.label}
              </Link>
            ))}
          </nav>
          {settings.phone && (
            <a
              href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}
              className="mt-3 flex items-center justify-center gap-2 rounded-full bg-rose px-4 py-3 text-sm font-medium text-white">
              <Phone className="size-4" aria-hidden /> Gọi {settings.phone}
            </a>
          )}
        </div>
      )}
    </header>
  );
}
