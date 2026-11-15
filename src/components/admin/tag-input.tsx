"use client";

import { X } from "lucide-react";
import { useId, useState } from "react";

interface TagInputProps {
  id: string;
  value: string[];
  onChange: (v: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

/** Nhập nhiều giá trị dạng chip: Enter hoặc dấu phẩy để thêm, Backspace để xóa chip cuối. */
export function TagInput({ id, value, onChange, suggestions = [], placeholder }: TagInputProps) {
  const [text, setText] = useState("");
  const listId = useId();

  function add(raw: string) {
    const t = raw.trim();
    if (!t) return;
    if (!value.some((v) => v.toLowerCase() === t.toLowerCase())) onChange([...value, t]);
    setText("");
  }

  return (
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-input bg-white px-2.5 py-1.5 focus-within:border-rose focus-within:ring-2 focus-within:ring-rose/30">
      {value.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 rounded-full bg-rose-soft px-2.5 py-1 text-xs font-medium text-rose-dark">
          {v}
          <button type="button" aria-label={`Bỏ ${v}`} onClick={() => onChange(value.filter((x) => x !== v))}><X className="size-3" /></button>
        </span>
      ))}
      <input id={id} list={listId} value={text} placeholder={value.length ? "" : placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(text); }
          else if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => add(text)}
        className="min-w-24 flex-1 bg-transparent px-1 py-1 text-sm outline-none" />
      <datalist id={listId}>{suggestions.filter((s) => !value.includes(s)).map((s) => <option key={s} value={s} />)}</datalist>
    </div>
  );
}
