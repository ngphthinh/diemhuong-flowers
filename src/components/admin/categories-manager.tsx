"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { FolderTree, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldError, Input, Label, NativeSelect, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { AdminCategoryDTO } from "@/features/categories/admin-service";
import { categoryInputSchema, type CategoryInput } from "@/features/categories/schema";
import { apiRequest } from "@/lib/client-api";
import { SearchInput } from "@/components/admin/search-input";

type FormValues = z.input<typeof categoryInputSchema>;
const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase();

export function CategoriesManager({ items }: { items: AdminCategoryDTO[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<AdminCategoryDTO | "new" | null>(null);
  const [toDelete, setToDelete] = useState<AdminCategoryDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filtered = useMemo(
    () => items.filter((c) => (!q || fold(c.name).includes(fold(q))) && (!status || c.isActive === (status === "active"))),
    [items, q, status],
  );

  async function toggle(c: AdminCategoryDTO, isActive: boolean) {
    setTogglingId(c.id);
    const r = await apiRequest(`/api/admin/categories/${c.id}`, "PATCH", { isActive });
    setTogglingId(null);
    if (!r.ok) return void toast.error(r.error ?? "Không cập nhật được trạng thái");
    toast.success(isActive ? `Đã bật "${c.name}"` : `Đã tắt "${c.name}" — sản phẩm thuộc danh mục sẽ ẩn khỏi khách`);
    router.refresh();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const r = await apiRequest(`/api/admin/categories/${toDelete.id}`, "DELETE");
    setDeleting(false);
    if (!r.ok) {
      toast.error(r.error ?? "Không xóa được danh mục"); // 409: đang có sản phẩm sử dụng
      setToDelete(null);
      return;
    }
    toast.success(`Đã xóa "${toDelete.name}"`);
    setToDelete(null);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="min-w-56 flex-1"><SearchInput label="Tìm danh mục" placeholder="Tìm danh mục..." value={q} onChange={setQ} /></div>
        <NativeSelect aria-label="Lọc trạng thái" value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
          <option value="">Mọi trạng thái</option>
          <option value="active">Đang bật</option>
          <option value="inactive">Đang tắt</option>
        </NativeSelect>
        <Button onClick={() => setEditing("new")}><Plus /> Thêm danh mục</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<FolderTree />} title="Không có danh mục" description={items.length ? "Không có danh mục khớp bộ lọc." : "Hãy tạo danh mục đầu tiên."} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Tên</th>
                <th scope="col" className="px-4 py-3 font-medium">Slug</th>
                <th scope="col" className="px-4 py-3 font-medium">Sản phẩm</th>
                <th scope="col" className="px-4 py-3 font-medium">Hiển thị</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.name}</p>
                    {c.description && <p className="line-clamp-1 text-xs text-muted-foreground">{c.description}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{c.slug}</td>
                  <td className="px-4 py-3"><Badge variant={c.productCount ? "rose" : "muted"}>{c.productCount}</Badge></td>
                  <td className="px-4 py-3">
                    <Switch checked={c.isActive} label={`Hiển thị danh mục ${c.name}`} disabled={togglingId === c.id} onCheckedChange={(v) => toggle(c, v)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" aria-label={`Sửa ${c.name}`} onClick={() => setEditing(c)} className="rounded-full p-2 hover:bg-rose-soft"><Pencil className="size-4" /></button>
                      <button type="button" aria-label={`Xóa ${c.name}`} onClick={() => setToDelete(c)} className="rounded-full p-2 text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CategoryDialog target={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); router.refresh(); }} />

      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} loading={deleting} onConfirm={confirmDelete}
        title="Xóa danh mục?" confirmLabel="Xóa danh mục"
        description={toDelete && toDelete.productCount > 0
          ? <>Danh mục <strong className="text-brown">{toDelete.name}</strong> đang có <strong className="text-brown">{toDelete.productCount} sản phẩm</strong> nên <strong>không thể xóa</strong>. Hãy chuyển hoặc xóa các sản phẩm đó trước, hoặc tắt hiển thị danh mục.</>
          : <>Bạn sắp xóa danh mục <strong className="text-brown">{toDelete?.name}</strong>. Thao tác này không thể hoàn tác.</>} />
    </div>
  );
}

function CategoryDialog({ target, onClose, onSaved }: { target: AdminCategoryDTO | "new" | null; onClose: () => void; onSaved: () => void }) {
  const editing = target && target !== "new" ? target : null;
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()} title={editing ? "Sửa danh mục" : "Thêm danh mục"}>
      {target && <CategoryForm key={editing?.id ?? "new"} category={editing} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  );
}

function CategoryForm({ category, onClose, onSaved }: { category: AdminCategoryDTO | null; onClose: () => void; onSaved: () => void }) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormValues, unknown, CategoryInput>({
    resolver: zodResolver(categoryInputSchema),
    defaultValues: { name: category?.name ?? "", description: category?.description ?? "", isActive: category?.isActive ?? true },
  });

  async function onSubmit(values: CategoryInput) {
    const payload = { ...values, description: values.description || undefined };
    const r = await apiRequest(category ? `/api/admin/categories/${category.id}` : "/api/admin/categories", category ? "PUT" : "POST", payload);
    if (r.ok) {
      toast.success(category ? "Đã cập nhật danh mục" : "Đã thêm danh mục");
      return onSaved();
    }
    if (r.fields) return void Object.entries(r.fields).forEach(([k, m]) => setError(k as keyof FormValues, { message: m }));
    toast.error(r.error ?? "Không lưu được danh mục");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <Label htmlFor="cat-name">Tên danh mục *</Label>
        <Input id="cat-name" autoFocus aria-invalid={!!errors.name} {...register("name")} />
        <FieldError message={errors.name?.message} />
      </div>
      <div>
        <Label htmlFor="cat-desc">Mô tả</Label>
        <Textarea id="cat-desc" rows={3} aria-invalid={!!errors.description} {...register("description")} />
        <FieldError message={errors.description?.message} />
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-rose" {...register("isActive")} /> Hiển thị trên website</label>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Hủy</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin" />} Lưu</Button>
      </div>
    </form>
  );
}
