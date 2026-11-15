"use client";

import Image from "next/image";
import { useState } from "react";
import { Flower2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  if (images.length === 0) {
    return (
      <div className="flex aspect-4/5 items-center justify-center rounded-3xl bg-rose-soft text-rose">
        <Flower2 className="size-12" aria-hidden />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="relative aspect-4/5 overflow-hidden rounded-3xl bg-rose-soft">
        <Image
          key={images[active]}
          src={images[active]}
          alt={`${name} - ảnh ${active + 1}`}
          fill
          priority
          sizes="(min-width:1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <ul
          className="grid grid-cols-5 gap-2 sm:gap-2.5"
          aria-label="Ảnh sản phẩm">
          {images.map((src, i) => (
            <li key={`${i}-${src}`}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Xem ảnh ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-xl border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  i === active
                    ? "border-rose"
                    : "border-transparent opacity-70 hover:opacity-100",
                )}>
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
