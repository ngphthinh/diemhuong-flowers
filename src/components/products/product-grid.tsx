import type { ProductDTO } from "@/features/products/types";
import { ProductCard } from "./product-card";

export function ProductGrid({
  products,
  columns = 4,
  priorityCount = 0,
}: {
  products: ProductDTO[];
  columns?: 3 | 4;
  priorityCount?: number;
}) {
  return (
    <div
      className={`grid grid-cols-2 gap-3 sm:gap-6 ${columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
