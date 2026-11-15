import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ContactStatus } from "@/features/contact-requests/constants";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions, crumbs }: {
  title: string; description?: string; actions?: React.ReactNode; crumbs?: { label: string; href?: string }[];
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        {crumbs && (
          <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-1 text-sm text-muted-foreground">
            {crumbs.map((c, i) => (
              <span key={c.label} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3.5" />}
                {c.href ? <Link href={c.href} className="hover:text-rose-dark">{c.label}</Link> : <span>{c.label}</span>}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-3xl font-semibold">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-border bg-white p-5 shadow-sm", className)} {...props} />;
}

export const CONTACT_STATUS_LABEL: Record<ContactStatus, string> = {
  PENDING: "Đang chờ",
  CONTACTED: "Đã liên hệ",
  COMPLETED: "Hoàn tất",
};

export function ContactStatusBadge({ status }: { status: ContactStatus }) {
  const variant = status === "PENDING" ? "solid" : status === "CONTACTED" ? "rose" : "sage";
  return <Badge variant={variant}>{CONTACT_STATUS_LABEL[status]}</Badge>;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(iso));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(iso));
}

/** Ảnh sản phẩm: dùng <img> thường để hỗ trợ cả /uploads/... lẫn URL ngoài mà không cần cấu hình host. */
export function Thumb({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src || "https://placehold.co/160x200/F6E3E7/C4707F/png?text=No+image"} alt={alt} loading="lazy"
      className={cn("size-12 rounded-lg border border-border object-cover", className)} />
  );
}
