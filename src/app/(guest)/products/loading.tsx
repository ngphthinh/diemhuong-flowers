import { ProductGridSkeleton } from "@/components/products/product-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingUI() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <Skeleton className="h-12 w-60" />
      <div className="mt-10 grid gap-8 lg:grid-cols-[18rem_1fr]">
        <Skeleton className="h-96" />
        <ProductGridSkeleton count={9} columns={3} />
      </div>
    </div>
  );
}
