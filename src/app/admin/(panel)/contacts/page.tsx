import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ContactsTable } from "@/components/admin/contacts-table";
import { PageHeader } from "@/components/admin/ui";
import { Pagination } from "@/components/products/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { adminListContacts } from "@/features/contact-requests/admin-service";
import { adminContactQuerySchema } from "@/features/contact-requests/schema";

export const metadata: Metadata = { title: "Yêu cầu liên hệ" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default function ContactsPage({ searchParams }: { searchParams: SP }) {
  return (
    <>
      <PageHeader title="Yêu cầu liên hệ" description="Khách gửi từ form tư vấn trên website" />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Content({ searchParams }: { searchParams: SP }) {
  await connection();
  const raw = await searchParams;
  const flat = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const parsed = adminContactQuerySchema.safeParse(flat);
  const query = parsed.success ? parsed.data : adminContactQuerySchema.parse({});
  const result = await adminListContacts(query);
  return (
    <>
      <ContactsTable items={result.items} total={result.total} />
      <Pagination page={result.page} totalPages={result.totalPages} basePath="/admin/contacts" params={{ q: query.q, status: query.status }} />
    </>
  );
}
