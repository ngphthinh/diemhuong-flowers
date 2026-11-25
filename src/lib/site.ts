/**
 * URL gốc của website (không có dấu "/" cuối).
 * Ưu tiên NEXT_PUBLIC_SITE_URL (domain chính thức), sau đó domain production của Vercel.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const raw =
    explicit || (vercel ? `https://${vercel}` : "http://localhost:3000");
  return raw.replace(/\/+$/, "");
}
