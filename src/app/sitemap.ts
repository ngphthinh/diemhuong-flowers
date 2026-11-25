import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { listSitemapProducts } from "@/features/products/service";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection(); // đọc DB lúc request, không chạy ở build
  const site = getSiteUrl();

  const staticPages: MetadataRoute.Sitemap = [
    { url: site, changeFrequency: "daily", priority: 1 },
    { url: `${site}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${site}/contact`, changeFrequency: "yearly", priority: 0.5 },
  ];

  let products: MetadataRoute.Sitemap = [];
  try {
    const items = await listSitemapProducts();
    products = items.map((p) => ({
      url: `${site}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch (err) {
    console.error("[sitemap]", err); // DB lỗi thì vẫn trả các trang tĩnh
  }

  return [...staticPages, ...products];
}
