"use client";

import { ImagePlus, Link2, Loader2, Star, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Thumb } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadImage } from "@/lib/client-api";

const MAX_IMAGES = 10;
const MAX_BYTES = 5 * 1024 * 1024;

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
}

/** Upload nhiều ảnh. Ảnh đầu tiên (images[0]) là ảnh đại diện. */
export function ImageManager({ value, onChange, error }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const room = MAX_IMAGES - value.length;
    if (room <= 0) return void toast.error(`Tối đa ${MAX_IMAGES} ảnh`);
    setBusy(true);
    const next = [...value];
    for (const file of Array.from(files).slice(0, room)) {
      if (file.size > MAX_BYTES) { toast.error(`${file.name}: ảnh tối đa 5MB`); continue; }
      const r = await uploadImage(file);
      if (r.ok && r.data) next.push(r.data.url);
      else toast.error(`${file.name}: ${r.error ?? "tải lên thất bại"}`);
    }
    onChange(next);
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function addUrl() {
    const u = url.trim();
    if (!/^https:\/\/\S+$/.test(u)) return void toast.error("Chỉ nhận đường dẫn ảnh bắt đầu bằng https://");
    if (value.includes(u)) return void toast.error("Ảnh này đã có trong danh sách");
    if (value.length >= MAX_IMAGES) return void toast.error(`Tối đa ${MAX_IMAGES} ảnh`);
    onChange([...value, u]);
    setUrl("");
  }

  const makeCover = (i: number) => onChange([value[i], ...value.filter((_, idx) => idx !== i)]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div>
      {value.length > 0 && (
        <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {value.map((src, i) => (
            <li key={src} className="relative rounded-xl border border-border bg-white p-1.5">
              <Thumb src={src} alt={`Ảnh ${i + 1}`} className="aspect-[4/5] size-auto w-full" />
              {i === 0 && <span className="absolute left-3 top-3 rounded-full bg-rose px-2 py-0.5 text-[11px] font-medium text-white">Ảnh đại diện</span>}
              <div className="mt-1.5 flex justify-between">
                <button type="button" onClick={() => makeCover(i)} disabled={i === 0} aria-label={`Đặt ảnh ${i + 1} làm ảnh đại diện`}
                  className="rounded-full p-1.5 text-rose-dark hover:bg-rose-soft disabled:opacity-30"><Star className="size-4" /></button>
                <button type="button" onClick={() => remove(i)} aria-label={`Xóa ảnh ${i + 1}`}
                  className="rounded-full p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" id="image-upload"
          onChange={(e) => onFiles(e.target.files)} />
        <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />} {busy ? "Đang tải lên..." : "Tải ảnh lên"}
        </Button>
        <span className="text-xs text-muted-foreground">JPG, PNG, WEBP, GIF · tối đa 5MB/ảnh · {value.length}/{MAX_IMAGES} ảnh</span>
      </div>

      <div className="mt-3 flex gap-2">
        <Input aria-label="Thêm ảnh bằng đường dẫn" placeholder="Hoặc dán đường dẫn ảnh https://..." value={url} onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addUrl(); } }} />
        <Button variant="ghost" onClick={addUrl}><Link2 /> Thêm</Button>
      </div>
      {error && <p role="alert" className="mt-1.5 text-sm text-destructive">{error}</p>}
    </div>
  );
}
