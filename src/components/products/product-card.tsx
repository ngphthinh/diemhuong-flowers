import Image from "next/image";
import Link from "next/link";
import { Flower2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ContactButton } from "@/components/site/contact-button";
import { discountPercent, formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductDTO } from "@/features/products/types";

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductDTO;
  priority?: boolean;
}) {
  const href = `/products/${product.slug}`;
  const discount = discountPercent(product.price, product.salePrice);
  const inStock = product.availability === "IN_STOCK";
  const cover = product.images[0];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-white transition-shadow duration-300 hover:shadow-[0_12px_32px_-12px_rgba(217,140,154,0.45)]">
      <Link
        href={href}
        className="relative block aspect-4/5 overflow-hidden bg-rose-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        aria-label={product.name}>
        {cover ? (
          <Image
            src={cover}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
            className={cn(
              "object-cover transition-transform duration-500 group-hover:scale-105",
              !inStock && "opacity-70 grayscale-30",
            )}
          />
        ) : (
          <span className="flex h-full items-center justify-center text-rose">
            <Flower2 className="size-10" aria-hidden />
          </span>
        )}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {discount && <Badge variant="solid">-{discount}%</Badge>}
        </div>
        {!inStock && (
          <span className="absolute inset-x-0 bottom-0 bg-brown/75 py-1.5 text-center text-xs font-medium text-white">
            Tạm hết hàng
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {product.category && (
          <p className="text-xs text-sage-dark">{product.category.name}</p>
        )}
        <h3 className="mt-1 line-clamp-2 min-h-[3.1rem] font-serif text-lg font-semibold leading-snug">
          <Link href={href} className="hover:text-rose-dark">
            {product.name}
          </Link>
        </h3>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-semibold text-rose-dark">
            {formatVND(product.salePrice ?? product.price)}
          </span>
          {product.salePrice != null && product.salePrice < product.price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatVND(product.price)}
            </span>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-4">
          <ContactButton
            size="sm"
            className="h-10 w-full"
            label="Liên hệ mua"
            product={{ id: product.id, name: product.name, code: product.code }}
          />
          <Link
            href={href}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "h-10 w-full",
            })}>
            Xem chi tiết
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-3xl border border-border bg-white">
      <div className="aspect-4/5 animate-pulse bg-rose-soft/70" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-rose-soft/70" />
        <div className="h-5 w-4/5 animate-pulse rounded bg-rose-soft/70" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-rose-soft/70" />
        <div className="grid gap-2 pt-2">
          <div className="h-10 animate-pulse rounded-full bg-rose-soft/70" />
          <div className="h-10 animate-pulse rounded-full bg-rose-soft/70" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 8,
  columns = 4,
}: {
  count?: number;
  columns?: 3 | 4;
}) {
  return (
    <div
      className={`grid grid-cols-2 gap-3 sm:gap-6 ${columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
