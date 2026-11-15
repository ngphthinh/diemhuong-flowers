"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef, type RowSelectionState } from "@tanstack/react-table";
import { Download, Eye, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { ExportDialog } from "@/components/admin/export-dialog";
import { SearchInput } from "@/components/admin/search-input";
import { Thumb, formatDate } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input, NativeSelect } from "@/components/ui/input";
import type { AdminProductDTO } from "@/features/products/admin-types";
import { apiRequest } from "@/lib/client-api";
import { formatVND } from "@/lib/format";
import { useUrlFilters } from "@/lib/use-url-filters";

interface Props {
  items: AdminProductDTO[];
  total: number;
  categories: { id: string; name: string }[];
}

export function ProductsTable({ items, total, categories }: Props) {
  const router = useRouter();
  const f = useUrlFilters();
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [toDelete, setToDelete] = useState<AdminProductDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const columns: ColumnDef<AdminProductDTO>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input type="checkbox" aria-label="Chọn tất cả ở trang này" className="size-4 accent-rose"
          checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />
      ),
      cell: ({ row }) => (
        <input type="checkbox" aria-label={`Chọn ${row.original.name}`} className="size-4 accent-rose"
          checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />
      ),
    },
    { id: "image", header: "Ảnh", cell: ({ row }) => <Thumb src={row.original.images[0]} alt={row.original.name} /> },
    { accessorKey: "code", header: "Mã", cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span> },
    {
      accessorKey: "name",
      header: "Tên sản phẩm",
      cell: ({ row }) => (
        <Link href={`/admin/products/${row.original.id}`} className="font-medium hover:text-rose-dark hover:underline">{row.original.name}</Link>
      ),
    },
    { accessorKey: "categoryName", header: "Danh mục" },
    {
      id: "price",
      header: "Giá",
      cell: ({ row }) => {
        const p = row.original;
        return p.salePrice ? (
          <div className="whitespace-nowrap">
            <span className="font-medium text-rose-dark">{formatVND(p.salePrice)}</span>
            <span className="block text-xs text-muted-foreground line-through">{formatVND(p.price)}</span>
          </div>
        ) : <span className="whitespace-nowrap font-medium">{formatVND(p.price)}</span>;
      },
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant={row.original.availability === "IN_STOCK" ? "sage" : "muted"}>{row.original.availability === "IN_STOCK" ? "Còn hàng" : "Hết hàng"}</Badge>
          {!row.original.isActive && <Badge variant="muted">Đang ẩn</Badge>}
          {row.original.isFeatured && <Badge variant="rose">Nổi bật</Badge>}
        </div>
      ),
    },
    { accessorKey: "createdAt", header: "Ngày tạo", cell: ({ getValue }) => <span className="whitespace-nowrap text-sm">{formatDate(getValue<string>())}</span> },
    {
      id: "actions",
      header: () => <span className="sr-only">Thao tác</span>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Link href={`/admin/products/${row.original.id}`} aria-label={`Xem ${row.original.name}`} className="rounded-full p-2 hover:bg-rose-soft"><Eye className="size-4" /></Link>
          <Link href={`/admin/products/${row.original.id}/edit`} aria-label={`Sửa ${row.original.name}`} className="rounded-full p-2 hover:bg-rose-soft"><Pencil className="size-4" /></Link>
          <button type="button" aria-label={`Xóa ${row.original.name}`} onClick={() => setToDelete(row.original)} className="rounded-full p-2 text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></button>
        </div>
      ),
    },
  ];

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table chưa tương thích React Compiler; bảng không memo nên an toàn
  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (r) => r.id,
    state: { rowSelection: selection },
    onRowSelectionChange: setSelection,
    manualPagination: true, // phân trang/lọc/sắp xếp đều ở server
  });

  const selectedIds = Object.keys(selection);
  const selectedCount = selectedIds.length;
  // Bộ lọc hiện tại (bỏ trang) để xuất "theo bộ lọc"
  const activeFilters: Record<string, string> = {};
  for (const k of ["q", "category", "status", "minPrice", "maxPrice", "sort"]) if (f.get(k)) activeFilters[k] = f.get(k);
  const hasFilters = Object.keys(activeFilters).some((k) => k !== "sort");

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const r = await apiRequest(`/api/admin/products/${toDelete.id}`, "DELETE");
    setDeleting(false);
    if (!r.ok) return void toast.error(r.error ?? "Không xóa được sản phẩm");
    toast.success(`Đã xóa "${toDelete.name}"`);
    setSelection((s) => { const n = { ...s }; delete n[toDelete.id]; return n; });
    setToDelete(null);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 grid gap-3 rounded-2xl border border-border bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2">
          <SearchInput label="Tìm sản phẩm" placeholder="Tìm theo tên hoặc mã..." value={f.get("q")} onChange={(v) => f.set({ q: v || undefined })} />
        </div>
        <NativeSelect aria-label="Lọc theo danh mục" value={f.get("category")} onChange={(e) => f.set({ category: e.target.value || undefined })}>
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </NativeSelect>
        <NativeSelect aria-label="Lọc theo trạng thái" value={f.get("status")} onChange={(e) => f.set({ status: e.target.value || undefined })}>
          <option value="">Mọi trạng thái</option>
          <option value="active">Đang hiển thị</option>
          <option value="hidden">Đang ẩn</option>
          <option value="in_stock">Còn hàng</option>
          <option value="out_of_stock">Hết hàng</option>
        </NativeSelect>
        <PriceRange key={`${f.get("minPrice")}-${f.get("maxPrice")}`} min={f.get("minPrice")} max={f.get("maxPrice")} onApply={(min, max) => f.set({ minPrice: min, maxPrice: max })} />
        <NativeSelect aria-label="Sắp xếp" value={f.get("sort") || "newest"} onChange={(e) => f.set({ sort: e.target.value === "newest" ? undefined : e.target.value })}>
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="price_asc">Giá tăng dần</option>
          <option value="price_desc">Giá giảm dần</option>
          <option value="name">Tên A–Z</option>
        </NativeSelect>
        {f.hasAny && <div className="sm:col-span-2 lg:col-span-6"><Button variant="ghost" size="sm" onClick={f.clear}><X /> Xóa bộ lọc</Button></div>}
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground" aria-live="polite">{total} sản phẩm{selectedCount > 0 && ` · đã chọn ${selectedCount}`}</p>
        <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
          <Download /> Export Excel{selectedCount > 0 ? ` (${selectedCount})` : ""}
        </Button>
      </div>

      <div className={`overflow-x-auto rounded-2xl border border-border bg-white transition-opacity ${f.pending ? "opacity-60" : ""}`}>
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>{hg.headers.map((h) => <th key={h.id} scope="col" className="px-4 py-3 font-medium">{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className={row.getIsSelected() ? "bg-rose-soft/40" : "hover:bg-muted/40"}>
                {row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-3 align-middle">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} filters={activeFilters} hasFilters={hasFilters} filteredTotal={total} selectedIds={selectedIds} />

      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} loading={deleting} onConfirm={confirmDelete}
        title="Xóa sản phẩm?" confirmLabel="Xóa sản phẩm"
        description={<>Bạn sắp xóa <strong className="text-brown">{toDelete?.name}</strong> ({toDelete?.code}). Thao tác này không thể hoàn tác.</>} />
    </div>
  );
}

function PriceRange({ min, max, onApply }: { min: string; max: string; onApply: (min?: string, max?: string) => void }) {
  const [a, setA] = useState(min);
  const [b, setB] = useState(max);
  const apply = () => {
    if (a === min && b === max) return; // không đổi -> không điều hướng
    onApply(a || undefined, b || undefined);
  };
  const onKey = (e: React.KeyboardEvent) => e.key === "Enter" && apply();
  return (
    <div className="flex items-center gap-1.5">
      <Input type="number" inputMode="numeric" min={0} placeholder="Giá từ" aria-label="Giá từ" value={a} onChange={(e) => setA(e.target.value)} onBlur={apply} onKeyDown={onKey} className="px-3" />
      <span aria-hidden>–</span>
      <Input type="number" inputMode="numeric" min={0} placeholder="đến" aria-label="Giá đến" value={b} onChange={(e) => setB(e.target.value)} onBlur={apply} onKeyDown={onKey} className="px-3" />
    </div>
  );
}
