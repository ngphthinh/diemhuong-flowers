const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export function formatVND(value: number): string {
  return vnd.format(value);
}

export function discountPercent(price: number, salePrice?: number | null): number | null {
  if (salePrice == null || salePrice >= price) return null;
  return Math.round((1 - salePrice / price) * 100);
}
