/**
 * Next.js gọi register() đúng một lần khi server khởi động (trước khi nhận request).
 * Ở đây ta khởi tạo dữ liệu: nếu MongoDB còn trống thì seed (xem lib/db/init-data.ts).
 * Lỗi kết nối chỉ được ghi log — server vẫn chạy để dễ thấy lỗi trên giao diện.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { initData, describeInitResult } = await import("@/lib/db/init-data");
    const result = await initData();
    console.log(`[init-data] ${describeInitResult(result)}`);
  } catch (err) {
    console.error("[init-data] Không khởi tạo được dữ liệu:", err instanceof Error ? err.message : err);
  }
}
