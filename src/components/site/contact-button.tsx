"use client";

import { useState } from "react";
import { MessageCircleHeart } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ContactForm } from "./contact-form";

interface ContactButtonProps extends Omit<ButtonProps, "onClick"> {
  product?: { id: string; name: string; code: string };
  label?: string;
}

/** Nút "Liên hệ mua hàng": mở form yêu cầu tư vấn, tự điền sản phẩm. */
export function ContactButton({ product, label = "Liên hệ mua hàng", ...props }: ContactButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} {...props}>
        <MessageCircleHeart />
        {label}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Nhận tư vấn đặt hoa"
        description="Để lại thông tin, cửa hàng sẽ gọi lại để xác nhận mẫu hoa, thời gian và địa chỉ giao."
      >
        <ContactForm product={product} onSuccess={() => setOpen(false)} />
      </Dialog>
    </>
  );
}
