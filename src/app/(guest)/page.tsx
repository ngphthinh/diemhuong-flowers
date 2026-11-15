import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  Flower2,
  Gift,
  HeartHandshake,
  MessageCircleHeart,
  Truck,
} from "lucide-react";
import { ContactCards } from "@/components/site/contact-links";
import { Section, SectionHeading } from "@/components/site/section";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductGridSkeleton } from "@/components/products/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { listActiveCategories } from "@/features/categories/service";
import {
  getFeaturedProducts,
  getLatestProducts,
} from "@/features/products/service";
import { getStoreSettings } from "@/features/store-settings/service";

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<HeroShell />}>
        <Hero />
      </Suspense>

      <Section aria-labelledby="cat-title">
        <SectionHeading
          id="cat-title"
          title="Chọn hoa theo dịp"
          description="Mỗi danh mục là một cách nói khác nhau cho điều bạn muốn gửi gắm."
        />
        <Suspense
          fallback={
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          }>
          <Categories />
        </Suspense>
      </Section>

      <Section aria-labelledby="featured-title" className="pt-0 sm:pt-0">
        <SectionHeading
          id="featured-title"
          title="Sản phẩm nổi bật"
          description="Những bó hoa được chọn nhiều nhất."
          href="/products"
        />
        <Suspense fallback={<ProductGridSkeleton count={4} />}>
          <ProductRow kind="featured" />
        </Suspense>
      </Section>

      <Section aria-labelledby="latest-title" className="pt-0 sm:pt-0">
        <SectionHeading
          id="latest-title"
          title="Mẫu hoa mới"
          description="Vừa cắm xong, mới lên kệ."
          href="/products?sort=newest"
        />
        <Suspense fallback={<ProductGridSkeleton count={4} />}>
          <ProductRow kind="latest" />
        </Suspense>
      </Section>

      <About />
      <HowToOrder />

      <Section aria-labelledby="contact-title">
        <SectionHeading
          id="contact-title"
          title="Liên hệ cửa hàng"
          description="Gọi hoặc nhắn tin để được tư vấn mẫu hoa phù hợp ngân sách và dịp tặng."
        />
        <Suspense fallback={<Skeleton className="h-40" />}>
          <ContactBlock />
        </Suspense>
      </Section>
    </>
  );
}

/* ---------- Hero ---------- */

function HeroShell({ image, name }: { image?: string; name?: string }) {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-6 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
      <div>
        <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight min-[400px]:text-5xl sm:text-6xl">
          Hoa cho những ngày đáng nhớ
        </h1>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
          Hoa sinh nhật, hoa kỷ niệm và hoa tình yêu, cắm tay theo từng câu
          chuyện của bạn.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/products"
            className={buttonVariants({
              size: "lg",
              className: "flex-1 sm:flex-none",
            })}>
            Khám phá sản phẩm
          </Link>
          <Link
            href="/contact"
            className={buttonVariants({
              size: "lg",
              variant: "outline",
              className: "flex-1 sm:flex-none",
            })}>
            Nhận tư vấn
          </Link>
        </div>
      </div>

      {/* Khung vòm: điểm nhấn thị giác của trang */}
      <div className="relative mx-auto w-full max-w-60 sm:max-w-sm">
        <div
          className="absolute -inset-3 rounded-t-[999px] rounded-b-3xl bg-sage/20"
          aria-hidden
        />
        <div className="relative aspect-3/4 overflow-hidden rounded-t-[999px] rounded-b-3xl bg-rose-soft">
          {image ? (
            <Image
              src={image}
              alt={name ?? "Hoa nổi bật"}
              fill
              priority
              sizes="(min-width:1024px) 384px, 90vw"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-rose">
              <Flower2 className="size-16" aria-hidden />
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

async function Hero() {
  await connection();
  const [first] = await getFeaturedProducts(1);
  return <HeroShell image={first?.images[0]} name={first?.name} />;
}

/* ---------- Danh mục ---------- */

async function Categories() {
  await connection();
  const categories = await listActiveCategories();
  if (categories.length === 0) {
    return (
      <EmptyState
        icon={<Flower2 />}
        title="Chưa có danh mục"
        description="Danh mục hoa sẽ hiển thị tại đây khi cửa hàng cập nhật."
      />
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {categories.map((c, i) => (
        <li key={c.id}>
          <Link
            href={`/products?category=${c.slug}`}
            className={`flex h-full min-h-28 flex-col justify-end rounded-3xl p-4 sm:p-5 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${i % 2 === 0 ? "bg-rose-soft" : "bg-sage/15"}`}>
            <span className="font-serif text-lg font-semibold sm:text-xl">
              {c.name}
            </span>
            {c.description && (
              <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {c.description}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Sản phẩm ---------- */

async function ProductRow({ kind }: { kind: "featured" | "latest" }) {
  await connection();
  const products =
    kind === "featured"
      ? await getFeaturedProducts(4)
      : await getLatestProducts(4);
  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Flower2 />}
        title={
          kind === "featured" ? "Chưa có sản phẩm nổi bật" : "Chưa có sản phẩm"
        }
        description="Sản phẩm sẽ xuất hiện tại đây ngay khi cửa hàng cập nhật."
      />
    );
  }
  return <ProductGrid products={products} />;
}

/* ---------- Giới thiệu & hướng dẫn đặt hoa ---------- */

function About() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-[1fr_1.2fr] md:items-center">
        <h2 className="text-3xl font-semibold sm:text-4xl">
          Mỗi bó hoa đều được cắm tay
        </h2>
        <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
          <p>
            Chúng tôi chuyên hoa dành cho những cột mốc: sinh nhật, kỷ niệm ngày
            cưới, ngày yêu nhau và các sự kiện quan trọng.
          </p>
          <p>
            Hoa được chọn trong ngày, phối màu theo dịp tặng và có thể điều
            chỉnh theo ngân sách. Bạn cứ nói điều muốn gửi gắm, phần còn lại để
            cửa hàng lo.
          </p>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    icon: Gift,
    title: "Chọn mẫu hoa",
    text: "Xem sản phẩm và chọn mẫu bạn thích.",
  },
  {
    icon: MessageCircleHeart,
    title: "Gửi yêu cầu tư vấn",
    text: "Bấm Liên hệ mua hàng hoặc gọi hotline.",
  },
  {
    icon: HeartHandshake,
    title: "Xác nhận với cửa hàng",
    text: "Chốt mẫu, thời gian, địa chỉ và lời nhắn.",
  },
  {
    icon: Truck,
    title: "Nhận hoa",
    text: "Hoa được giao đúng hẹn hoặc bạn đến lấy tại cửa hàng.",
  },
];

function HowToOrder() {
  return (
    <Section aria-labelledby="how-title">
      <SectionHeading
        id="how-title"
        title="Cách đặt hoa"
        description="Bốn bước, không cần tạo tài khoản."
      />
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            className="rounded-3xl border border-border bg-white p-6">
            <span className="flex size-11 items-center justify-center rounded-full bg-rose-soft text-rose-dark">
              <s.icon className="size-5" aria-hidden />
            </span>
            <h3 className="mt-4 font-sans text-base font-semibold">
              <span className="mr-1.5 text-rose-dark">{i + 1}.</span>
              {s.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {s.text}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

async function ContactBlock() {
  await connection();
  const settings = await getStoreSettings();
  return <ContactCards settings={settings} />;
}
