import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

type Kind = { ext: string; mime: string };

/** Nhận diện định dạng ảnh bằng magic bytes — KHÔNG tin tên file / Content-Type do client gửi. */
export function sniffImage(buf: Uint8Array): Kind | null {
  const hex = (n: number) => Array.from(buf.slice(0, n)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex(3) === "ffd8ff") return { ext: "jpg", mime: "image/jpeg" };
  if (hex(8) === "89504e470d0a1a0a") return { ext: "png", mime: "image/png" };
  if (hex(4) === "47494638") return { ext: "gif", mime: "image/gif" };
  if (hex(4) === "52494646" && Buffer.from(buf.slice(8, 12)).toString("ascii") === "WEBP") return { ext: "webp", mime: "image/webp" };
  return null;
}

export class UploadError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

function cloudinaryConfig() {
  const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = process.env;
  return cloud && key && secret ? { cloud, key, secret } : null;
}

/** Trả về URL ảnh. Ưu tiên Cloudinary nếu đã cấu hình; nếu không, ghi file vào public/uploads (chỉ dev). */
export async function storeImage(file: File): Promise<string> {
  if (file.size === 0) throw new UploadError("File rỗng");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("Ảnh tối đa 5MB", 413);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) throw new UploadError("Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF");

  const cfg = cloudinaryConfig();
  if (cfg) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = "flower-shop/products";
    const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${cfg.secret}`).digest("hex");
    const form = new FormData();
    form.set("file", new Blob([bytes as BlobPart], { type: kind.mime }), `upload.${kind.ext}`);
    form.set("api_key", cfg.key);
    form.set("timestamp", timestamp);
    form.set("folder", folder);
    form.set("signature", signature);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloud}/image/upload`, { method: "POST", body: form });
    if (!res.ok) {
      console.error("[cloudinary]", res.status, await res.text().catch(() => ""));
      throw new UploadError("Không thể tải ảnh lên Cloudinary", 502);
    }
    const json = (await res.json()) as { secure_url?: string };
    if (!json.secure_url) throw new UploadError("Phản hồi Cloudinary không hợp lệ", 502);
    return json.secure_url;
  }

  if (process.env.NODE_ENV === "production") throw new UploadError("Chưa cấu hình Cloudinary", 503);
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const name = `${randomBytes(12).toString("hex")}.${kind.ext}`; // tên do server sinh, không dùng tên client
  await writeFile(path.join(dir, name), bytes);
  return `/uploads/${name}`;
}
