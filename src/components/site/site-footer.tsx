import Link from "next/link";
import { connection } from "next/server";
import { getStoreSettings } from "@/features/store-settings/service";
import { buildContactItems } from "./contact-links";
import { Brand } from "./header-shell";

export async function SiteFooter() {
  await connection();
  const settings = await getStoreSettings();
  const items = buildContactItems(settings);
  return (
    <footer className="mt-16 border-t border-border sm:mt-24 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="space-y-4">
          <Brand settings={settings} />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Hoa sinh nhật, hoa kỷ niệm, hoa tình yêu và hoa sự kiện, được cắm
            tay theo yêu cầu.
          </p>
        </div>
        <nav aria-label="Liên kết chân trang">
          <h2 className="mb-3 font-sans text-base font-semibold">Khám phá</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                className="inline-block py-1 hover:text-rose-dark"
                href="/products">
                Tất cả sản phẩm
              </Link>
            </li>
            <li>
              <Link
                className="inline-block py-1 hover:text-rose-dark"
                href="/products?sort=newest">
                Sản phẩm mới
              </Link>
            </li>
            <li>
              <Link
                className="inline-block py-1 hover:text-rose-dark"
                href="/contact">
                Liên hệ đặt hoa
              </Link>
            </li>
          </ul>
        </nav>
        <div>
          <h2 className="mb-3 font-sans text-base font-semibold">Liên hệ</h2>
          <ul className="space-y-2 text-sm">
            {items.length === 0 && (
              <li className="text-muted-foreground">Đang cập nhật</li>
            )}
            {items.map((it) => (
              <li key={it.key}>
                {it.href ? (
                  <a
                    className="inline-block break-words py-1 hover:text-rose-dark"
                    href={it.href}
                    {...(it.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}>
                    {it.label}: {it.value}
                  </a>
                ) : (
                  <span>
                    {it.label}: {it.value}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {settings.storeName}
      </div>
    </footer>
  );
}

export function FooterFallback() {
  return <footer className="mt-24 h-48 border-t border-border bg-white" />;
}
