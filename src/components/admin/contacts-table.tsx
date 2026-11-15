"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Inbox, Mail, Phone, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { SearchInput } from "@/components/admin/search-input";
import { CONTACT_STATUS_LABEL, ContactStatusBadge, formatDateTime } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { NativeSelect } from "@/components/ui/input";
import { CONTACT_STATUS, type ContactStatus } from "@/features/contact-requests/constants";
import type { AdminContactDTO } from "@/features/contact-requests/admin-service";
import { apiRequest } from "@/lib/client-api";
import { useUrlFilters } from "@/lib/use-url-filters";
import Link from "next/link";

export function ContactsTable({ items, total }: { items: AdminContactDTO[]; total: number }) {
  const router = useRouter();
  const f = useUrlFilters();
  const [viewId, setViewId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AdminContactDTO | null>(null);
  const [busy, setBusy] = useState(false);
  const current = items.find((c) => c.id === viewId) ?? null;

  async function setStatus(c: AdminContactDTO, status: ContactStatus) {
    if (c.status === status) return;
    setBusy(true);
    const r = await apiRequest(`/api/admin/contact-requests/${c.id}`, "PATCH", { status });
    setBusy(false);
    if (!r.ok) return void toast.error(r.error ?? "Không cập nhật được trạng thái");
    toast.success(`Đã chuyển sang "${CONTACT_STATUS_LABEL[status]}"`);
    router.refresh();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    const r = await apiRequest(`/api/admin/contact-requests/${toDelete.id}`, "DELETE");
    setBusy(false);
    if (!r.ok) return void toast.error(r.error ?? "Không xóa được yêu cầu");
    toast.success("Đã xóa yêu cầu");
    if (viewId === toDelete.id) setViewId(null);
    setToDelete(null);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 grid gap-3 rounded-2xl border border-border bg-white p-4 sm:grid-cols-[1fr_12rem_auto]">
        <SearchInput label="Tìm yêu cầu" placeholder="Tìm theo tên, SĐT, email, nội dung..." value={f.get("q")} onChange={(v) => f.set({ q: v || undefined })} />
        <NativeSelect aria-label="Lọc trạng thái" value={f.get("status")} onChange={(e) => f.set({ status: e.target.value || undefined })}>
          <option value="">Mọi trạng thái</option>
          {CONTACT_STATUS.map((s) => <option key={s} value={s}>{CONTACT_STATUS_LABEL[s]}</option>)}
        </NativeSelect>
        {f.hasAny && <Button variant="ghost" onClick={f.clear}><X /> Xóa lọc</Button>}
      </div>
      <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">{total} yêu cầu</p>

      {items.length === 0 ? (
        <EmptyState icon={<Inbox />} title="Chưa có yêu cầu nào" description="Yêu cầu từ form tư vấn trên website sẽ hiện ở đây." />
      ) : (
        <div className={`overflow-x-auto rounded-2xl border border-border bg-white transition-opacity ${f.pending ? "opacity-60" : ""}`}>
          <table className="w-full min-w-[60rem] text-left text-sm">
            <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {["Khách hàng", "SĐT", "Email", "Sản phẩm quan tâm", "Nội dung", "Ngày gửi", "Trạng thái"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}
                <th scope="col" className="px-4 py-3"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((c) => (
                <tr key={c.id} className={c.status === "PENDING" ? "bg-rose-soft/30" : "hover:bg-muted/40"}>
                  <td className="px-4 py-3 font-medium">
                    <button type="button" onClick={() => setViewId(c.id)} className="text-left hover:text-rose-dark hover:underline">{c.customerName}</button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{c.phone}</td>
                  <td className="px-4 py-3">{c.email ?? "—"}</td>
                  <td className="px-4 py-3">{c.product ? c.product.name : "—"}</td>
                  <td className="max-w-64 px-4 py-3"><p className="line-clamp-2">{c.message}</p></td>
                  <td className="whitespace-nowrap px-4 py-3">{formatDateTime(c.createdAt)}</td>
                  <td className="px-4 py-3"><ContactStatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => setViewId(c.id)}>Xem</Button>
                      <button type="button" aria-label={`Xóa yêu cầu của ${c.customerName}`} onClick={() => setToDelete(c)} className="rounded-full p-2 text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!current} onOpenChange={(o) => !o && setViewId(null)} title="Chi tiết yêu cầu" description={current ? formatDateTime(current.createdAt) : undefined}>
        {current && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-lg font-semibold">{current.customerName}</p>
              <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <a href={`tel:${current.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 text-rose-dark hover:underline"><Phone className="size-4" /> {current.phone}</a>
                {current.email && <a href={`mailto:${current.email}`} className="inline-flex items-center gap-1.5 text-rose-dark hover:underline"><Mail className="size-4" /> {current.email}</a>}
              </p>
            </div>
            {current.product && (
              <p><span className="text-muted-foreground">Sản phẩm quan tâm: </span>
                <Link href={`/admin/products/${current.product.id}`} className="font-medium text-rose-dark hover:underline">{current.product.name} ({current.product.code})</Link></p>
            )}
            <div>
              <p className="text-muted-foreground">Lời nhắn</p>
              <p className="mt-1 whitespace-pre-line rounded-xl bg-muted/60 p-3">{current.message}</p>
            </div>
            <div>
              <label htmlFor="ct-status" className="mb-1.5 block font-medium">Trạng thái</label>
              <NativeSelect id="ct-status" value={current.status} disabled={busy} onChange={(e) => setStatus(current, e.target.value as ContactStatus)}>
                {CONTACT_STATUS.map((s) => <option key={s} value={s}>{CONTACT_STATUS_LABEL[s]}</option>)}
              </NativeSelect>
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" className="text-destructive" onClick={() => setToDelete(current)}><Trash2 /> Xóa</Button>
              <Button variant="outline" onClick={() => setViewId(null)}>Đóng</Button>
            </div>
          </div>
        )}
      </Dialog>

      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} loading={busy} onConfirm={confirmDelete}
        title="Xóa yêu cầu?" confirmLabel="Xóa yêu cầu"
        description={<>Bạn sắp xóa yêu cầu của <strong className="text-brown">{toDelete?.customerName}</strong>. Thao tác này không thể hoàn tác.</>} />
    </div>
  );
}
