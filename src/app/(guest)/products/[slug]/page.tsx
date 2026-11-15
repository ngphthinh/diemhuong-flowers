import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChevronRight, Phone } from "lucide-react";
import { ContactButton } from "@/components/site/contact-button";
import { buildContactItems } from "@/components/site/contact-links";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductGrid } from "@/components/products/product-grid";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { discountPercent, formatVND } from "@/lib/format";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/features/products/service";
import { getStoreSettings } from "@/features/store-settings/service";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Không tìm thấy sản phẩm" };
  return {
    title: product.name,
    description: product.description.slice(0, 155),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 155),
      images: product.images.slice(0, 1),
    },
  };
}

export default function ProductDetailPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <Detail params={params} />
    </Suspense>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2">
      <Skeleton className="aspect-4/5" />
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}

async function Detail({ params }: { params: Params }) {
  await connection();
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [settings, related] = await Promise.all([
    getStoreSettings(),
    getRelatedProducts(product, 4),
  ]);
  const quickLinks = buildContactItems(settings).filter((i) =>
    ["phone", "zalo", "messenger"].includes(i.key),
  );
  const phoneLink = quickLinks.find((l) => l.key === "phone");
  const discount = discountPercent(product.price, product.salePrice);
  const inStock = product.availability === "IN_STOCK";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <nav
        aria-label="Đường dẫn"
        className="mb-5 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm text-muted-foreground sm:mb-6">
        <Link href="/" className="hover:text-rose-dark">
          Trang chủ
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        <Link href="/products" className="hover:text-rose-dark">
          Sản phẩm
        </Link>
        {product.category && (
          <>
            <ChevronRight className="size-4" aria-hidden />
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-rose-dark">
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.category && (
              <Badge variant="sage">{product.category.name}</Badge>
            )}
            <Badge variant={inStock ? "rose" : "muted"}>
              {inStock ? "Còn hàng" : "Tạm hết hàng"}
            </Badge>
          </div>

          <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            {product.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Mã sản phẩm:{" "}
            <span className="font-medium text-brown">{product.code}</span>
          </p>

          <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-2xl font-semibold text-rose-dark sm:text-3xl">
              {formatVND(product.salePrice ?? product.price)}
            </span>
            {product.salePrice != null && product.salePrice < product.price && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatVND(product.price)}
                </span>
                {discount && <Badge variant="solid">Giảm {discount}%</Badge>}
              </>
            )}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <ContactButton
              size="lg"
              className="max-sm:w-full"
              product={{
                id: product.id,
                name: product.name,
                code: product.code,
              }}
            />
            {quickLinks.map((l) => (
              <a
                key={l.key}
                href={l.href}
                {...(l.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-white px-5 text-sm font-medium transition-colors hover:border-rose hover:bg-rose-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {l.icon}
                {l.key === "phone" ? l.value : l.label}
              </a>
            ))}
          </div>
          {!inStock && (
            <p className="mt-3 text-sm text-muted-foreground">
              Mẫu này đang tạm hết. Liên hệ để cửa hàng gợi ý mẫu tương tự hoặc
              báo ngày có hàng.
            </p>
          )}

          <section className="mt-10" aria-labelledby="desc">
            <h2 id="desc" className="font-sans text-lg font-semibold">
              Mô tả
            </h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </section>

          {(product.flowerType.length > 0 || product.occasion.length > 0) && (
            <dl className="mt-8 space-y-5 border-t border-border pt-6">
              {product.flowerType.length > 0 && (
                <div>
                  <dt className="mb-2 text-sm font-medium">Loại hoa</dt>
                  <dd className="flex flex-wrap gap-2">
                    {product.flowerType.map((t) => (
                      <Link
                        key={t}
                        href={`/products?flowerType=${encodeURIComponent(t)}`}>
                        <Badge
                          variant="muted"
                          className="px-3 py-1 text-sm hover:bg-rose-soft">
                          {t}
                        </Badge>
                      </Link>
                    ))}
                  </dd>
                </div>
              )}
              {product.occasion.length > 0 && (
                <div>
                  <dt className="mb-2 text-sm font-medium">Dịp phù hợp</dt>
                  <dd className="flex flex-wrap gap-2">
                    {product.occasion.map((t) => (
                      <Link
                        key={t}
                        href={`/products?occasion=${encodeURIComponent(t)}`}>
                        <Badge
                          variant="muted"
                          className="px-3 py-1 text-sm hover:bg-rose-soft">
                          {t}
                        </Badge>
                      </Link>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20" aria-labelledby="related">
          <h2 id="related" className="mb-6 text-3xl font-semibold">
            Có thể bạn cũng thích
          </h2>
          <ProductGrid products={related} />
        </section>
      )}

      {/* Thanh liên hệ dính đáy trên mobile: nút mua luôn trong tầm tay, không che footer */}
      <div className="sticky bottom-0 z-30 -mx-4 mt-10 border-t border-border bg-cream/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
        <div className="flex gap-2">
          <ContactButton
            size="lg"
            className="h-12 flex-1"
            product={{ id: product.id, name: product.name, code: product.code }}
          />
          {phoneLink && (
            <a
              href={phoneLink.href}
              aria-label={`Gọi ${phoneLink.value}`}
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-rose/60 bg-white text-rose-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Phone className="size-5" aria-hidden />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
