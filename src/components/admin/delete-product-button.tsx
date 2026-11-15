"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiRequest } from "@/lib/client-api";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onConfirm() {
    setLoading(true);
    const r = await apiRequest(`/api/admin/products/${id}`, "DELETE");
    if (!r.ok) {
      setLoading(false);
      return void toast.error(r.error ?? "Không xóa được sản phẩm");
    }
    toast.success(`Đã xóa "${name}"`);
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => setOpen(true)}><Trash2 /> Xóa</Button>
      <ConfirmDialog open={open} onOpenChange={setOpen} loading={loading} onConfirm={onConfirm} title="Xóa sản phẩm?" confirmLabel="Xóa sản phẩm"
        description={<>Bạn sắp xóa <strong className="text-brown">{name}</strong>. Thao tác này không thể hoàn tác.</>} />
    </>
  );
}
