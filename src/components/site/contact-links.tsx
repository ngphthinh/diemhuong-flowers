import { Mail, MapPin, MessageCircle, Phone, Send, Users } from "lucide-react";
import type { StoreSettingsDTO } from "@/features/store-settings/service";

export interface ContactItem {
  key: string;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
  icon: React.ReactNode;
}

/** Danh sách kênh liên hệ có dữ liệu (kênh trống sẽ bị ẩn). */
export function buildContactItems(s: StoreSettingsDTO): ContactItem[] {
  const items: ContactItem[] = [];
  const icon = "size-5";
  if (s.phone) items.push({ key: "phone", label: "Hotline", value: s.phone, href: `tel:${s.phone.replace(/[^\d+]/g, "")}`, icon: <Phone className={icon} aria-hidden /> });
  if (s.zaloUrl) items.push({ key: "zalo", label: "Zalo", value: "Nhắn tin Zalo", href: s.zaloUrl, external: true, icon: <MessageCircle className={icon} aria-hidden /> });
  if (s.messengerUrl) items.push({ key: "messenger", label: "Messenger", value: "Nhắn tin Messenger", href: s.messengerUrl, external: true, icon: <Send className={icon} aria-hidden /> });
  if (s.facebookUrl) items.push({ key: "facebook", label: "Facebook", value: "Fanpage cửa hàng", href: s.facebookUrl, external: true, icon: <Users className={icon} aria-hidden /> });
  if (s.email) items.push({ key: "email", label: "Email", value: s.email, href: `mailto:${s.email}`, icon: <Mail className={icon} aria-hidden /> });
  if (s.address) items.push({ key: "address", label: "Địa chỉ", value: s.address, icon: <MapPin className={icon} aria-hidden /> });
  return items;
}

export function ContactCards({ settings }: { settings: StoreSettingsDTO }) {
  const items = buildContactItems(settings);
  if (items.length === 0) {
    return <p className="rounded-2xl bg-white p-6 text-sm text-muted-foreground">Thông tin liên hệ đang được cập nhật. Bạn có thể gửi yêu cầu tư vấn qua biểu mẫu.</p>;
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((it) => {
        const body = (
          <>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-rose-soft text-rose-dark">{it.icon}</span>
            <span className="min-w-0">
              <span className="block text-sm text-muted-foreground">{it.label}</span>
              <span className="block break-words font-medium text-brown">{it.value}</span>
            </span>
          </>
        );
        const cls = "flex items-center gap-4 rounded-2xl border border-border bg-white p-4";
        return (
          <li key={it.key}>
            {it.href ? (
              <a href={it.href} {...(it.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={`${cls} transition-colors hover:border-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}>
                {body}
              </a>
            ) : (
              <div className={cls}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
