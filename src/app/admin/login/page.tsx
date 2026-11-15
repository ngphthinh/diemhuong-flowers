import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Đăng nhập quản trị", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-white p-8 shadow-sm">
        <p className="font-serif text-sm uppercase tracking-widest text-rose-dark">Flower Shop</p>
        <h1 className="mt-1 text-3xl font-semibold">Đăng nhập quản trị</h1>
        <Suspense fallback={<div className="mt-6 h-64" />}>
          <Form />
        </Suspense>
      </div>
      <Toaster position="top-center" richColors closeButton />
    </main>
  );
}

async function Form() {
  await connection();
  return <LoginForm />;
}
