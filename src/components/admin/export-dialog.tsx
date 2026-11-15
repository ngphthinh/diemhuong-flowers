"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { downloadFile } from "@/lib/client-api";

type Scope = "all" | "filtered" | "selected";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Bộ lọc hiện tại trên URL (q, category, status, minPrice, maxPrice, sort). */
  filters: Record<string, string>;
  hasFilters: boolean;
  /** Số sản phẩm khớp bộ lọc hiện tại (toàn bộ các trang). */
  filteredTotal: number;
  selectedIds: string[];
}

export function ExportDialog({ open, onOpenChange, filters, hasFilters, filteredTotal, selectedIds }: Props) {
  const [choice, setChoice] = useState<Scope | null>(null);
  const [busy, setBusy] = useState(false);

  // Mặc định: đã chọn > theo bộ lọc > toàn bộ (chỉ khi người dùng chưa tự chọn)
  const scope: Scope = choice && (choice !== "selected" || selectedIds.length > 0) && (choice !== "filtered" || hasFilters)
    ? choice
    : selectedIds.length > 0 ? "selected" : hasFilters ? "filtered" : "all";

  const options: { value: Scope; label: string; hint: string; disabled?: boolean }[] = [
    { value: "selected", label: `Các dòng đã chọn (${selectedIds.length})`, hint: "Chỉ những sản phẩm bạn đã tick ở bảng.", disabled: selectedIds.length === 0 },
    { value: "filtered", label: `Theo bộ lọc hiện tại (${filteredTotal})`, hint: "Tất cả sản phẩm khớp tìm kiếm/bộ lọc, mọi trang.", disabled: !hasFilters },
    { value: "all", label: "Toàn bộ sản phẩm", hint: "Không áp dụng bộ lọc." },
  ];

  async function submit() {
    setBusy(true);
    const json = scope === "selected" ? { scope, ids: selectedIds } : scope === "filtered" ? { scope, query: filters } : { scope };
    const r = await downloadFile("/api/admin/products/export", { json, fallbackName: "san-pham.xlsx" });
    setBusy(false);
    if (!r.ok) return void toast.error(r.error ?? "Không xuất được file");
    toast.success(r.count != null ? `Đã xuất ${r.count} sản phẩm: ${r.fileName}` : `Đã xuất file ${r.fileName}`);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)} title="Xuất Excel" description="Chọn phạm vi sản phẩm cần xuất. File có thể sửa rồi nhập lại.">
      <fieldset className="space-y-2" disabled={busy}>
        <legend className="sr-only">Phạm vi xuất</legend>
        {options.map((o) => (
          <label key={o.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${scope === o.value ? "border-rose bg-rose-soft/40" : "border-border"} ${o.disabled ? "cursor-not-allowed opacity-45" : "hover:bg-rose-soft/30"}`}>
            <input type="radio" name="export-scope" className="mt-1 size-4 accent-rose" value={o.value} checked={scope === o.value} disabled={o.disabled} onChange={() => setChoice(o.value)} />
            <span>
              <span className="block text-sm font-medium">{o.label}</span>
              <span className="block text-xs text-muted-foreground">{o.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Hủy</Button>
        <Button onClick={submit} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Download />} Tải xuống
        </Button>
      </div>
    </Dialog>
  );
}
