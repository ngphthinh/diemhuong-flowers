"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

/** Trạng thái bộ lọc nằm trên URL (chia sẻ / back được). Đổi bộ lọc luôn về trang 1. */
export function useUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  const set = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      if (!("page" in patch)) next.delete("page");
      const qs = next.toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [sp, pathname, router],
  );

  return { get: (k: string) => sp.get(k) ?? "", set, pending, clear: () => startTransition(() => router.replace(pathname, { scroll: false })), hasAny: [...sp.keys()].some((k) => k !== "page") };
}
