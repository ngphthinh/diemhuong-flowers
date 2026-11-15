"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2, Send, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import {
  contactRequestInputSchema,
  type ContactRequestInput,
} from "@/features/contact-requests/schema";

type FormValues = z.input<typeof contactRequestInputSchema>;

interface ContactFormProps {
  product?: { id: string; name: string; code: string };
  onSuccess?: () => void;
}

export function ContactForm({ product, onSuccess }: ContactFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, ContactRequestInput>({
    resolver: zodResolver(contactRequestInputSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      email: "",
      productId: product?.id,
      website: "",
      message: product
        ? `Tôi muốn được tư vấn và đặt mua sản phẩm "${product.name}" (${product.code}).`
        : "",
    },
  });

  // Lỗi hiển thị ngay trong form: toast bị dialog (top layer) che mất khi form nằm trong dialog
  const [serverError, setServerError] = useState<string | null>(null);

  async function onSubmit(values: ContactRequestInput) {
    setServerError(null);
    try {
      const res = await fetch("/api/contact-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => null);

      if (res.ok) {
        toast.success("Đã gửi yêu cầu. Cửa hàng sẽ liên hệ với bạn sớm nhất.");
        reset();
        onSuccess?.();
        return;
      }
      if (res.status === 400 && data?.fields) {
        for (const [name, message] of Object.entries(
          data.fields as Record<string, string>,
        )) {
          setError(name as keyof FormValues, { message });
        }
        return;
      }
      setServerError(
        data?.error ?? "Không gửi được yêu cầu. Vui lòng thử lại.",
      );
    } catch {
      setServerError("Mất kết nối mạng. Kiểm tra internet và thử lại.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {product && (
        <div>
          <Label htmlFor="cf-product">Sản phẩm quan tâm</Label>
          <Input
            id="cf-product"
            value={`${product.name} (${product.code})`}
            readOnly
            className="bg-muted"
          />
          <input type="hidden" {...register("productId")} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="cf-name">Họ tên</Label>
          <Input
            id="cf-name"
            autoComplete="name"
            aria-invalid={!!errors.customerName}
            {...register("customerName")}
          />
          <FieldError message={errors.customerName?.message} />
        </div>
        <div>
          <Label htmlFor="cf-phone">Số điện thoại</Label>
          <Input
            id="cf-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={!!errors.phone}
            {...register("phone")}
          />
          <FieldError message={errors.phone?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="cf-email">Email (không bắt buộc)</Label>
        <Input
          id="cf-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />
      </div>

      <div>
        <Label htmlFor="cf-message">Lời nhắn</Label>
        <Textarea
          id="cf-message"
          rows={4}
          autoComplete="off"
          aria-invalid={!!errors.message}
          placeholder="Dịp tặng hoa, ngày nhận hoa, ngân sách mong muốn..."
          {...register("message")}
        />
        <FieldError message={errors.message?.message} />
      </div>

      {/* Honeypot chống bot: ẩn với người dùng và trình đọc màn hình */}
      <div
        aria-hidden
        className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register("website")}
          />
        </label>
      </div>

      {serverError && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {serverError}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
        {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu tư vấn"}
      </Button>
    </form>
  );
}
