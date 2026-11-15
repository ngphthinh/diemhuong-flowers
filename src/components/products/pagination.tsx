import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  params: Record<string, string | undefined>;
}

function pagesToShow(page: number, total: number): (number | "…")[] {
  const set = new Set([1, total, page - 1, page, page + 1]);
  const nums = [...set]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

export function Pagination({
  page,
  totalPages,
  basePath,
  params,
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const item =
    "inline-flex size-9 items-center justify-center rounded-full text-sm font-medium transition-colors sm:size-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <nav
      aria-label="Phân trang"
      className="mt-10 flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          aria-label="Trang trước"
          className={cn(item, "hover:bg-rose-soft")}>
          <ChevronLeft className="size-5" />
        </Link>
      ) : (
        <span aria-hidden className={cn(item, "opacity-30")}>
          <ChevronLeft className="size-5" />
        </span>
      )}
      {pagesToShow(page, totalPages).map((n, i) =>
        n === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={n}
            href={href(n)}
            aria-label={`Trang ${n}`}
            aria-current={n === page ? "page" : undefined}
            className={cn(
              item,
              n === page ? "bg-rose text-white" : "hover:bg-rose-soft",
            )}>
            {n}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link
          href={href(page + 1)}
          aria-label="Trang sau"
          className={cn(item, "hover:bg-rose-soft")}>
          <ChevronRight className="size-5" />
        </Link>
      ) : (
        <span aria-hidden className={cn(item, "opacity-30")}>
          <ChevronRight className="size-5" />
        </span>
      )}
    </nav>
  );
}
