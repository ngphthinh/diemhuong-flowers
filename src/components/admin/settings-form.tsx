"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ImagePlus, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, Thumb } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import type { AdminSettingsDTO } from "@/features/store-settings/admin-service";
import { storeSettingsInputSchema, type StoreSettingsInput } from "@/features/store-settings/schema";
import { apiRequest, uploadImage } from "@/lib/client-api";

type FormValues = z.input<typeof storeSettingsInputSchema>;

export function SettingsForm({ settings }: { settings: AdminSettingsDTO }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { register, handleSubmit, setError, setValue, control, formState: { errors, isSubmitting, isDirty } } = useForm<FormValues, unknown, StoreSettingsInput>({
    resolver: zodResolver(storeSettingsInputSchema),
    defaultValues: {
      storeName: settings.storeName, logo: settings.logo, phone: settings.phone, email: settings.email, address: settings.address,
      zaloUrl: settings.zaloUrl, messengerUrl: settings.messengerUrl, facebookUrl: settings.facebookUrl,
    },
  });
  const logo = useWatch({ control, name: "logo" });

  async function onLogo(file?: File) {
    if (!file) return;
    setUploading(true);
    const r = await uploadImage(file);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (r.ok && r.data) setValue("logo", r.data.url, { shouldDirty: true });
    else toast.error(r.error ?? "Tải logo thất bại");
  }

  async function onSubmit(values: StoreSettingsInput) {
    const r = await apiRequest("/api/admin/store-settings", "PUT", values);
    if (r.ok) {
      toast.success("Đã lưu cấu hình cửa hàng");
      router.refresh();
      return;
    }
    if (r.fields) return void Object.entries(r.fields).forEach(([k, m]) => setError(k as keyof FormValues, { message: m }));
    toast.error(r.error ?? "Không lưu được cấu hình");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-3xl space-y-6">
      <Card className="space-y-4">
        <h2 className="text-xl font-semibold">Thông tin chung</h2>
        <div>
          <Label htmlFor="storeName">Tên cửa hàng *</Label>
          <Input id="storeName" aria-invalid={!!errors.storeName} {...register("storeName")} />
          <FieldError message={errors.storeName?.message} />
        </div>
        <div>
          <Label htmlFor="logo">Logo</Label>
          <div className="flex items-center gap-3">
            {logo && <Thumb src={logo} alt="Logo" className="size-14 object-contain" />}
            <Input id="logo" placeholder="/uploads/... hoặc https://..." {...register("logo")} />
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" aria-label="Chọn file logo" onChange={(e) => onLogo(e.target.files?.[0])} />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />} Tải lên
            </Button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="phone">Hotline *</Label>
            <Input id="phone" type="tel" aria-invalid={!!errors.phone} {...register("phone")} />
            <FieldError message={errors.phone?.message} />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" aria-invalid={!!errors.email} {...register("email")} />
            <FieldError message={errors.email?.message} />
          </div>
        </div>
        <div>
          <Label htmlFor="address">Địa chỉ *</Label>
          <Input id="address" aria-invalid={!!errors.address} {...register("address")} />
          <FieldError message={errors.address?.message} />
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xl font-semibold">Kênh liên hệ</h2>
        {([["zaloUrl", "Zalo", "https://zalo.me/..."], ["messengerUrl", "Messenger", "https://m.me/..."], ["facebookUrl", "Facebook", "https://facebook.com/..."]] as const).map(([name, label, ph]) => (
          <div key={name}>
            <Label htmlFor={name}>{label}</Label>
            <Input id={name} type="url" placeholder={ph} aria-invalid={!!errors[name]} {...register(name)} />
            <FieldError message={errors[name]?.message} />
          </div>
        ))}
      </Card>

      <Button type="submit" size="lg" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />} Lưu cấu hình
      </Button>
    </form>
  );
}
