"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { adminLoginSchema, type AdminLoginInput } from "@/features/admins/schema";
import { apiRequest } from "@/lib/client-api";
import { useState } from "react";

type FormValues = z.input<typeof adminLoginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormValues, unknown, AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  async function onSubmit(values: AdminLoginInput) {
    setFormError(null);
    const r = await apiRequest("/api/admin/auth/login", "POST", values);
    if (r.ok) {
      router.replace("/admin");
      router.refresh();
      return;
    }
    if (r.status === 400 && r.fields) {
      for (const [k, m] of Object.entries(r.fields)) setError(k as keyof FormValues, { message: m });
      return;
    }
    setFormError(r.error ?? "Đăng nhập thất bại");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
      {formError && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{formError}</p>}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="username" aria-invalid={!!errors.email} {...register("email")} />
        <FieldError message={errors.email?.message} />
      </div>
      <div>
        <Label htmlFor="password">Mật khẩu</Label>
        <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register("password")} />
        <FieldError message={errors.password?.message} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-rose" {...register("remember")} /> Ghi nhớ đăng nhập 7 ngày
      </label>
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : <LogIn />} Đăng nhập
      </Button>
    </form>
  );
}
