"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Loader2, Minus, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, Thumb } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FieldError,
  Input,
  Label,
  NativeSelect,
  Textarea,
} from "@/components/ui/input";
import type { AdminInvoiceDTO } from "@/features/invoices/admin-types";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABEL,
  type PaymentMethod,
  type PaymentStatus,
} from "@/features/invoices/constants";
import type {
  AdminProductDTO,
  AdminProductList,
} from "@/features/products/admin-types";
import { apiRequest } from "@/lib/client-api";
import { formatVND } from "@/lib/format";

interface Line {
  productId: string;
  code: string;
  name: string;
  image?: string;
  listPrice: number; // giá hiện hành lúc chọn (giá KM nếu có)
  unitPrice: number; // admin có thể sửa
  quantity: number;
}

const effectivePrice = (p: AdminProductDTO) => p.salePrice ?? p.price;

/** Ô nhập số nguyên, hiển thị có dấu chấm ngăn cách nghìn (vi-VN). */
function NumInput({
  value,
  onChange,
  className,
  ...rest
}: { value: number; onChange: (n: number) => void } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
>) {
  return (
    <Input
      {...rest}
      type="text"
      inputMode="numeric"
      className={className}
      value={value ? value.toLocaleString("vi-VN") : ""}
      onChange={(e) =>
        onChange(Number(e.target.value.replace(/\D/g, "").slice(0, 10)) || 0)
      }
      onFocus={(e) => e.target.select()}
    />
  );
}

/** Ô tìm sản phẩm: gõ tên/mã (không phân biệt dấu) -> gợi ý từ danh sách sản phẩm -> chọn để thêm vào hóa đơn. */
function ProductPicker({
  onPick,
  pickedIds,
}: {
  onPick: (p: AdminProductDTO) => void;
  pickedIds: Set<string>;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const reqRef = useRef(0);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AdminProductDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(
      async () => {
        const id = ++reqRef.current;
        setLoading(true);
        const params = new URLSearchParams({ pageSize: "8", sort: "name" });
        if (text.trim()) params.set("q", text.trim());
        const r = await apiRequest<AdminProductList>(
          `/api/admin/products?${params}`,
          "GET",
        );
        if (id !== reqRef.current) return; // bỏ kết quả của request cũ
        setLoading(false);
        if (!r.ok) {
          setError(r.error ?? "Không tải được danh sách sản phẩm");
          setItems([]);
          return;
        }
        setError(null);
        setItems(r.data?.items ?? []);
        setActive(0);
      },
      text ? 250 : 0,
    );
    return () => clearTimeout(t);
  }, [text, open]);

  function pick(p: AdminProductDTO) {
    onPick(p);
    setText("");
    setActive(0);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && items[active]) pick(items[active]);
    } else if (e.key === "Escape") setOpen(false);
  }

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && items[active] ? `${listId}-${items[active].id}` : undefined
        }
        placeholder="Tìm sản phẩm theo tên hoặc mã (vd: hoa hồng, HOA-000003)…"
        className="pl-10"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {loading && (
        <Loader2
          aria-hidden
          className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
        />
      )}

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Kết quả tìm sản phẩm"
          className="absolute z-30 mt-1 max-h-80 w-full overflow-auto rounded-xl border border-border bg-white p-1 shadow-lg">
          {error && (
            <li className="px-3 py-3 text-sm text-destructive">{error}</li>
          )}
          {!error && !loading && items.length === 0 && (
            <li className="px-3 py-3 text-sm text-muted-foreground">
              Không tìm thấy sản phẩm phù hợp
            </li>
          )}
          {items.map((p, i) => (
            <li
              key={p.id}
              id={`${listId}-${p.id}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(p)}
              className={`flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 ${i === active ? "bg-rose-soft" : ""}`}>
              <Thumb src={p.images[0]} alt="" className="size-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.code} · {p.categoryName}
                </p>
              </div>
              <div className="shrink-0 text-right text-sm">
                <p className="font-medium">{formatVND(effectivePrice(p))}</p>
                <div className="mt-0.5 flex justify-end gap-1">
                  {pickedIds.has(p.id) && <Badge variant="sage">Đã thêm</Badge>}
                  {p.availability === "OUT_OF_STOCK" && (
                    <Badge variant="muted">Hết hàng</Badge>
                  )}
                  {!p.isActive && <Badge variant="muted">Đang ẩn</Badge>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function InvoiceForm() {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PAID");
  const [discount, setDiscount] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const pickedIds = useMemo(
    () => new Set(lines.map((l) => l.productId)),
    [lines],
  );
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  function addProduct(p: AdminProductDTO) {
    setErrors((e) => ({ ...e, items: "" }));
    setLines((prev) => {
      if (prev.some((l) => l.productId === p.id))
        return prev.map((l) =>
          l.productId === p.id
            ? { ...l, quantity: Math.min(999, l.quantity + 1) }
            : l,
        );
      const price = effectivePrice(p);
      return [
        ...prev,
        {
          productId: p.id,
          code: p.code,
          name: p.name,
          image: p.images[0],
          listPrice: price,
          unitPrice: price,
          quantity: 1,
        },
      ];
    });
  }
  const patchLine = (id: string, patch: Partial<Line>) =>
    setLines((prev) =>
      prev.map((l) => (l.productId === id ? { ...l, ...patch } : l)),
    );
  const removeLine = (id: string) =>
    setLines((prev) => prev.filter((l) => l.productId !== id));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const local: Record<string, string> = {};
    if (!customerName.trim())
      local.customerName = "Vui lòng nhập tên khách hàng";
    if (lines.length === 0)
      local.items = "Hãy thêm ít nhất một sản phẩm vào hóa đơn";
    if (discount > subtotal)
      local.discount = "Giảm giá không được lớn hơn tổng tiền hàng";
    setErrors(local);
    if (Object.keys(local).length) return;

    setSubmitting(true);
    const r = await apiRequest<AdminInvoiceDTO>("/api/admin/invoices", "POST", {
      customerName,
      customerPhone,
      customerAddress,
      note,
      paymentMethod,
      paymentStatus,
      discount,
      // Chỉ gửi đơn giá khi admin đã đổi; còn lại để server lấy giá hiện hành từ DB
      items: lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        ...(l.unitPrice !== l.listPrice ? { unitPrice: l.unitPrice } : {}),
      })),
    });
    if (!r.ok || !r.data) {
      setSubmitting(false);
      const f = r.fields ?? {};
      const itemsMsg = Object.entries(f).find(
        ([k]) => k === "items" || k.startsWith("items."),
      )?.[1];
      setErrors({ ...f, items: itemsMsg ?? "" });
      toast.error(r.error ?? "Không thể tạo hóa đơn");
      return;
    }
    toast.success(`Đã tạo hóa đơn ${r.data.code}`);
    router.push(`/admin/invoices/${r.data.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="min-w-0 space-y-6">
        <Card>
          <h2 className="mb-3 font-serif text-lg font-semibold">Sản phẩm</h2>
          <ProductPicker onPick={addProduct} pickedIds={pickedIds} />
          <FieldError message={errors.items} />

          {lines.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-rose/40 px-4 py-8 text-center text-sm text-muted-foreground">
              Chưa có sản phẩm. Tìm và chọn sản phẩm ở ô phía trên.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {lines.map((l) => (
                <li
                  key={l.productId}
                  className="flex flex-wrap items-center gap-3 py-3">
                  <Thumb src={l.image} alt="" />
                  <div className="min-w-40 flex-1">
                    <p className="text-sm font-medium">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{l.code}</p>
                    {l.unitPrice !== l.listPrice && (
                      <p className="text-xs text-muted-foreground">
                        Giá gốc: {formatVND(l.listPrice)}
                      </p>
                    )}
                  </div>
                  <div className="w-32">
                    <NumInput
                      aria-label={`Đơn giá ${l.name}`}
                      value={l.unitPrice}
                      onChange={(n) => patchLine(l.productId, { unitPrice: n })}
                      className="h-10 text-right"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-9"
                      aria-label="Giảm số lượng"
                      disabled={l.quantity <= 1}
                      onClick={() =>
                        patchLine(l.productId, { quantity: l.quantity - 1 })
                      }>
                      <Minus />
                    </Button>
                    <NumInput
                      aria-label={`Số lượng ${l.name}`}
                      value={l.quantity}
                      className="h-10 w-14 px-2 text-center"
                      onChange={(n) =>
                        patchLine(l.productId, {
                          quantity: Math.min(999, Math.max(1, n)),
                        })
                      }
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-9"
                      aria-label="Tăng số lượng"
                      disabled={l.quantity >= 999}
                      onClick={() =>
                        patchLine(l.productId, { quantity: l.quantity + 1 })
                      }>
                      <Plus />
                    </Button>
                  </div>
                  <p className="w-28 text-right text-sm font-semibold">
                    {formatVND(l.unitPrice * l.quantity)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 text-destructive"
                    aria-label={`Xóa ${l.name}`}
                    onClick={() => removeLine(l.productId)}>
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-serif text-lg font-semibold">Khách hàng</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="inv-name">Tên khách hàng *</Label>
              <Input
                id="inv-name"
                value={customerName}
                maxLength={100}
                onChange={(e) => setCustomerName(e.target.value)}
                aria-invalid={!!errors.customerName}
              />
              <FieldError message={errors.customerName} />
            </div>
            <div>
              <Label htmlFor="inv-phone">Số điện thoại</Label>
              <Input
                id="inv-phone"
                type="tel"
                value={customerPhone}
                maxLength={20}
                onChange={(e) => setCustomerPhone(e.target.value)}
                aria-invalid={!!errors.customerPhone}
              />
              <FieldError message={errors.customerPhone} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="inv-address">Địa chỉ</Label>
              <Input
                id="inv-address"
                value={customerAddress}
                maxLength={300}
                onChange={(e) => setCustomerAddress(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="inv-note">Ghi chú</Label>
              <Textarea
                id="inv-note"
                className="min-h-20"
                value={note}
                maxLength={500}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        </Card>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <Card className="space-y-4">
          <h2 className="font-serif text-lg font-semibold">Thanh toán</h2>
          <div>
            <Label htmlFor="inv-method">Phương thức</Label>
            <NativeSelect
              id="inv-method"
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as PaymentMethod)
              }>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_METHOD_LABEL[m]}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="inv-status">Trạng thái</Label>
            <NativeSelect
              id="inv-status"
              value={paymentStatus}
              onChange={(e) =>
                setPaymentStatus(e.target.value as PaymentStatus)
              }>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PAYMENT_STATUS_LABEL[s]}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="inv-discount">Giảm giá (₫)</Label>
            <NumInput
              id="inv-discount"
              value={discount}
              onChange={setDiscount}
              className="text-right"
              aria-invalid={!!errors.discount}
            />
            <FieldError message={errors.discount} />
          </div>
          <dl className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tạm tính</dt>
              <dd>{formatVND(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Giảm giá</dt>
              <dd>− {formatVND(Math.min(discount, subtotal))}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
              <dt>Tổng cộng</dt>
              <dd className="text-rose-dark">{formatVND(total)}</dd>
            </div>
          </dl>
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />} Tạo hóa đơn
          </Button>
        </Card>
      </aside>
    </form>
  );
}
