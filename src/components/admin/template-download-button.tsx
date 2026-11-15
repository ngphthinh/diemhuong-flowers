"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { downloadFile } from "@/lib/client-api";

/** Tải file Excel mẫu nhập sản phẩm. */
export function TemplateDownloadButton({ variant = "outline", size, label = "Tải Excel mẫu" }: Pick<ButtonProps, "variant" | "size"> & { label?: string }) {
  const [busy, setBusy] = useState(false);
  async function download() {
    setBusy(true);
    const r = await downloadFile("/api/admin/products/import/template", { fallbackName: "mau-nhap-san-pham.xlsx" });
    setBusy(false);
    if (!r.ok) toast.error(r.error ?? "Không tải được file mẫu");
  }
  return (
    <Button variant={variant} size={size} onClick={download} disabled={busy}>
      {busy ? <Loader2 className="animate-spin" /> : <FileDown />} {label}
    </Button>
  );
}
