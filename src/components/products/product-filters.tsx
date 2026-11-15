"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, NativeSelect } from "@/components/ui/input";
import type { CategoryDTO } from "@/features/categories/service";
import type { FilterOptions } from "@/features/products/types";

const FILTER_KEYS = [
  "q",
  "category",
  "flowerType",
  "occasion",
  "minPrice",
  "maxPrice",
  "inStock",
  "sort",
] as const;

export function ProductFilters({
  categories,
  options,
}: {
  categories: CategoryDTO[];
  options: FilterOptions;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page"); // đổi bộ lọc thì về trang 1
    const qs = next.toString();
    startTransition(() =>
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }),
    );
  }

  function reset() {
    startTransition(() => router.push(pathname, { scroll: false }));
  }

  const activeCount = FILTER_KEYS.filter(
    (k) => k !== "sort" && sp.get(k),
  ).length;

  return (
    <details
      open
      className="group rounded-3xl border border-border bg-white p-5 lg:[&:not([open])]:block"
      aria-busy={pending}>
      <summary className="flex cursor-pointer list-none items-center justify-between lg:pointer-events-none">
        <span className="flex items-center gap-2 font-sans text-base font-semibold">
          <SlidersHorizontal className="size-4" aria-hidden /> Bộ lọc
          {activeCount > 0 && (
            <span className="rounded-full bg-rose px-2 py-0.5 text-xs text-white">
              {activeCount}
            </span>
          )}
          {pending && (
            <Loader2
              className="size-4 animate-spin text-rose"
              aria-label="Đang tải"
            />
          )}
        </span>
        <span className="text-sm text-muted-foreground lg:hidden">
          Thu gọn / mở rộng
        </span>
      </summary>

      <div className="mt-5 space-y-5">
        {/* key theo giá trị trên URL: khi URL đổi (Back, reset...) ô nhập tự đồng bộ lại */}
        <SearchBox
          key={`q-${sp.get("q") ?? ""}`}
          initial={sp.get("q") ?? ""}
          onSubmit={(v) => update({ q: v || undefined })}
        />

        <div>
          <Label htmlFor="f-cat">Danh mục</Label>
          <NativeSelect
            id="f-cat"
            value={sp.get("category") ?? ""}
            onChange={(e) => update({ category: e.target.value || undefined })}>
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </div>

        {options.flowerTypes.length > 0 && (
          <div>
            <Label htmlFor="f-flower">Loại hoa</Label>
            <NativeSelect
              id="f-flower"
              value={sp.get("flowerType") ?? ""}
              onChange={(e) =>
                update({ flowerType: e.target.value || undefined })
              }>
              <option value="">Tất cả loại hoa</option>
              {options.flowerTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}

        {options.occasions.length > 0 && (
          <div>
            <Label htmlFor="f-occ">Dịp kỷ niệm</Label>
            <NativeSelect
              id="f-occ"
              value={sp.get("occasion") ?? ""}
              onChange={(e) =>
                update({ occasion: e.target.value || undefined })
              }>
              <option value="">Tất cả dịp</option>
              {options.occasions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}

        <PriceRange
          key={`p-${sp.get("minPrice") ?? ""}-${sp.get("maxPrice") ?? ""}`}
          initialMin={sp.get("minPrice") ?? ""}
          initialMax={sp.get("maxPrice") ?? ""}
          onSubmit={(min, max) =>
            update({ minPrice: min || undefined, maxPrice: max || undefined })
          }
        />

        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={sp.get("inStock") === "1"}
            onChange={(e) =>
              update({ inStock: e.target.checked ? "1" : undefined })
            }
            className="size-5 rounded border-input accent-rose"
          />
          Chỉ hiện sản phẩm còn hàng
        </label>

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" className="w-full" onClick={reset}>
            <RotateCcw /> Xóa bộ lọc
          </Button>
        )}
      </div>
    </details>
  );
}

function SearchBox({
  initial,
  onSubmit,
}: {
  initial: string;
  onSubmit: (v: string) => void;
}) {
  const [q, setQ] = useState(initial);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(q.trim());
      }}
      role="search">
      <Label htmlFor="f-q">Tìm theo tên</Label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id="f-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          maxLength={100}
          placeholder="Hoa hồng, tulip..."
          className="pl-10"
        />
      </div>
    </form>
  );
}

function PriceRange({
  initialMin,
  initialMax,
  onSubmit,
}: {
  initialMin: string;
  initialMax: string;
  onSubmit: (min: string, max: string) => void;
}) {
  const [min, setMin] = useState(initialMin);
  const [max, setMax] = useState(initialMax);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(min, max);
      }}>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Khoảng giá (VNĐ)</legend>
        <div className="flex items-center gap-2">
          <Input
            aria-label="Giá từ"
            inputMode="numeric"
            type="number"
            min={0}
            step={10000}
            placeholder="Từ"
            value={min}
            onChange={(e) => setMin(e.target.value)}
          />
          <span aria-hidden className="text-muted-foreground">
            –
          </span>
          <Input
            aria-label="Giá đến"
            inputMode="numeric"
            type="number"
            min={0}
            step={10000}
            placeholder="Đến"
            value={max}
            onChange={(e) => setMax(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="mt-2 w-full">
          Áp dụng giá
        </Button>
      </fieldset>
    </form>
  );
}

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  function onChange(value: string) {
    const next = new URLSearchParams(sp.toString());
    if (value && value !== "newest") next.set("sort", value);
    else next.delete("sort");
    next.delete("page");
    const qs = next.toString();
    startTransition(() =>
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }),
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="shrink-0 text-sm text-muted-foreground">
        Sắp xếp
      </label>
      <NativeSelect
        id="sort"
        className="h-10 w-44"
        value={sp.get("sort") ?? "newest"}
        onChange={(e) => onChange(e.target.value)}>
        <option value="newest">Mới nhất</option>
        <option value="price_asc">Giá tăng dần</option>
        <option value="price_desc">Giá giảm dần</option>
      </NativeSelect>
    </div>
  );
}
