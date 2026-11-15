"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

/** Ô tìm kiếm có debounce 350ms. */
export function SearchInput({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  const [text, setText] = useState(value);
  const [prev, setPrev] = useState(value);
  // Đồng bộ khi URL đổi từ bên ngoài (vd bấm "Xóa bộ lọc") mà không cần effect
  if (value !== prev) {
    setPrev(value);
    setText(value);
  }

  useEffect(() => {
    if (text.trim() === value) return;
    const t = setTimeout(() => onChange(text.trim()), 350);
    return () => clearTimeout(t);
  }, [text, value, onChange]);

  return (
    <div className="relative">
      <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input type="search" aria-label={label} placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} className="pl-10" />
    </div>
  );
}
