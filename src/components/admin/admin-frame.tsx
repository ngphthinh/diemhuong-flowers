"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ExternalLink,
  FolderTree,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Package,
  Receipt,
  Settings,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/client-api";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/invoices", label: "Hóa đơn", icon: Receipt },
  { href: "/admin/products", label: "Sản phẩm", icon: Package },
  { href: "/admin/categories", label: "Danh mục", icon: FolderTree },
  { href: "/admin/contacts", label: "Yêu cầu liên hệ", icon: Inbox },
  { href: "/admin/settings", label: "Cấu hình cửa hàng", icon: Settings },
];

export function AdminFrame({
  user,
  children,
}: {
  user: { fullName: string; email: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    const r = await apiRequest("/api/admin/auth/logout", "POST");
    if (!r.ok) {
      toast.error(r.error ?? "Không thể đăng xuất");
      setLoggingOut(false);
      return;
    }
    router.replace("/admin/login");
    router.refresh();
  }

  const nav = (
    <nav aria-label="Điều hướng quản trị" className="flex-1 space-y-1 p-3">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-rose text-white" : "text-brown hover:bg-rose-soft",
            )}>
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-border p-3">
      <Link
        href="/"
        target="_blank"
        className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-rose-soft">
        <ExternalLink className="size-4" /> Xem website
      </Link>
      <button
        type="button"
        onClick={logout}
        disabled={loggingOut}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-rose-soft disabled:opacity-60">
        {loggingOut ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <LogOut className="size-4" />
        )}{" "}
        Đăng xuất
      </button>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr] print:block">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2">
        Bỏ qua điều hướng
      </a>

      {/* Sidebar desktop */}
      <aside className="hidden border-r border-border bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col print:hidden">
        <div className="border-b border-border px-5 py-5">
          <p className="font-serif text-lg font-semibold text-brown">
            Flower Shop
          </p>
          <p className="text-xs text-muted-foreground">Trang quản trị</p>
        </div>
        {nav}
        {footer}
      </aside>

      {/* Header + drawer mobile */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-white/95 px-4 py-3 backdrop-blur lg:hidden print:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Mở menu"
          aria-expanded={open}
          className="rounded-full p-2 hover:bg-rose-soft">
          <Menu className="size-5" />
        </button>
        <span className="font-serif font-semibold">Flower Shop Admin</span>
        <span className="size-9" />
      </header>
      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu quản trị">
          <button
            type="button"
            aria-label="Đóng menu"
            className="absolute inset-0 bg-brown/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex h-full w-72 max-w-[85%] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="font-serif text-lg font-semibold">
                Flower Shop
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
                className="rounded-full p-1.5 hover:bg-rose-soft">
                <X className="size-5" />
              </button>
            </div>
            {nav}
            {footer}
          </div>
        </div>
      )}

      <div className="min-w-0">
        <div className="hidden items-center justify-end gap-3 border-b border-border bg-white/70 px-8 py-3 lg:flex print:hidden">
          <div className="text-right text-sm">
            <p className="font-medium leading-tight">{user.fullName}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <span
            aria-hidden
            className="flex size-9 items-center justify-center rounded-full bg-rose-soft font-semibold text-rose-dark">
            {user.fullName.charAt(0).toUpperCase()}
          </span>
        </div>
        <main
          id="admin-main"
          className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
