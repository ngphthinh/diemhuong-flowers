"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { ImageManager } from "@/components/admin/image-manager";
import { TagInput } from "@/components/admin/tag-input";
import { Card } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, NativeSelect, Textarea } from "@/components/ui/input";
import type { AdminProductDTO } from "@/features/products/admin-types";
import { productInputSchema, type ProductInput } from "@/features/products/schema";
import { apiRequest } from "@/lib/client-api";

type FormValues = z.input<typeof productInputSchema>;

interface Props {
  product?: AdminProductDTO;
  categories: { id: string; name: string; isActive: boolean }[];
  flowerSuggestions: string[];
  occasionSuggestions: string[];
}

const optionalNumber = (v: unknown) => (v === "" || v == null || Number.isNaN(Number(v)) ? undefined : Number(v));

export function ProductForm({ product, categories, flowerSuggestions, occasionSuggestions }: Props) {
  const router = useRouter();
  const editing = !!product;
  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormValues, unknown, ProductInput>({
    resolver: zodResolver(productInputSchema),
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      price: product?.price as number | undefined,
      salePrice: product?.salePrice,
      images: product?.images ?? [],
      categoryId: product?.categoryId ?? "",
      flowerType: product?.flowerType ?? [],
      occasion: product?.occasion ?? [],
      availability: product?.availability ?? "IN_STOCK",
      isFeatured: product?.isFeatured ?? false,
      isActive: product?.isActive ?? true,
    },
  });

  async function onSubmit(values: ProductInput) {
    const r = await apiRequest<AdminProductDTO>(editing ? `/api/admin/products/${product!.id}` : "/api/admin/products", editing ? "PUT" : "POST", values);
    if (r.ok) {
      toast.success(editing ? "Đã cập nhật sản phẩm" : "Đã thêm sản phẩm");
      router.push("/admin/products");
      router.refresh();
      return;
    }
    if (r.fields) {
      for (const [k, m] of Object.entries(r.fields)) setError(k as keyof FormValues, { message: m });
      toast.error("Vui lòng kiểm tra lại các trường được đánh dấu");
      return;
    }
    toast.error(r.error ?? "Không lưu được sản phẩm");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold">Thông tin cơ bản</h2>
          <div>
            <Label htmlFor="name">Tên sản phẩm *</Label>
            <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
            <FieldError message={errors.name?.message} />
          </div>
          <div>
            <Label htmlFor="description">Mô tả *</Label>
            <Textarea id="description" rows={6} aria-invalid={!!errors.description} {...register("description")} />
            <FieldError message={errors.description?.message} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="price">Giá bán (VND) *</Label>
              <Input id="price" type="number" inputMode="numeric" min={0} step={1000} aria-invalid={!!errors.price} {...register("price", { setValueAs: optionalNumber })} />
              <FieldError message={errors.price?.message} />
            </div>
            <div>
              <Label htmlFor="salePrice">Giá khuyến mãi (VND)</Label>
              <Input id="salePrice" type="number" inputMode="numeric" min={0} step={1000} aria-invalid={!!errors.salePrice} {...register("salePrice", { setValueAs: optionalNumber })} />
              <FieldError message={errors.salePrice?.message} />
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-xl font-semibold">Phân loại</h2>
          <div>
            <Label htmlFor="categoryId">Danh mục *</Label>
            <NativeSelect id="categoryId" aria-invalid={!!errors.categoryId} {...register("categoryId")}>
              <option value="">— Chọn danh mục —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.isActive ? "" : " (đang tắt)"}</option>)}
            </NativeSelect>
            <FieldError message={errors.categoryId?.message} />
          </div>
          <div>
            <Label htmlFor="flowerType">Loại hoa</Label>
            <Controller control={control} name="flowerType" render={({ field }) => (
              <TagInput id="flowerType" value={field.value ?? []} onChange={field.onChange} suggestions={flowerSuggestions} placeholder="Hoa hồng, Tulip... (Enter để thêm)" />
            )} />
          </div>
          <div>
            <Label htmlFor="occasion">Dịp kỷ niệm phù hợp</Label>
            <Controller control={control} name="occasion" render={({ field }) => (
              <TagInput id="occasion" value={field.value ?? []} onChange={field.onChange} suggestions={occasionSuggestions} placeholder="Sinh nhật, Valentine... (Enter để thêm)" />
            )} />
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 text-xl font-semibold">Hình ảnh *</h2>
          <p className="mb-4 text-sm text-muted-foreground">Cần ít nhất 1 ảnh. Ảnh đầu tiên là ảnh đại diện — bấm ngôi sao để đổi.</p>
          <Controller control={control} name="images" render={({ field }) => (
            <ImageManager value={field.value ?? []} onChange={field.onChange} error={errors.images?.message ?? (errors.images as { root?: { message?: string } } | undefined)?.root?.message} />
          )} />
        </Card>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold">Hiển thị</h2>
          <div>
            <Label htmlFor="availability">Tồn kho</Label>
            <NativeSelect id="availability" {...register("availability")}>
              <option value="IN_STOCK">Còn hàng</option>
              <option value="OUT_OF_STOCK">Hết hàng</option>
            </NativeSelect>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 accent-rose" {...register("isFeatured")} />
            <span><strong>Sản phẩm nổi bật</strong><br /><span className="text-muted-foreground">Hiện ở mục nổi bật trên trang chủ</span></span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 accent-rose" {...register("isActive")} />
            <span><strong>Hiển thị trên website</strong><br /><span className="text-muted-foreground">Tắt để ẩn khỏi khách</span></span>
          </label>
        </Card>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" size="lg" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />} {editing ? "Lưu thay đổi" : "Thêm sản phẩm"}
          </Button>
          <Link href="/admin/products" className="inline-flex h-12 items-center rounded-full px-5 text-sm hover:bg-rose-soft">Hủy</Link>
        </div>
      </aside>
    </form>
  );
}
