# BÀN GIAO — PHASE 1: FOUNDATION

Ngày: 2026-11-15 · Dự án: Anniversary Flower Shop

## 1. Đã hoàn thành
- [x] Khởi tạo Next.js 16 (App Router, `src/`), TypeScript **strict**, Tailwind CSS v4.
- [x] Cấu hình shadcn/ui (`components.json`, `cn()`, design tokens màu Dusty Rose / Cream / Sage / Dark Brown).
- [x] Font hỗ trợ tiếng Việt: Playfair Display (tiêu đề) + Be Vietnam Pro (nội dung).
- [x] Kết nối MongoDB Atlas (cache connection, `sanitizeFilter` chống NoSQL injection).
- [x] Validate biến môi trường bằng Zod (`src/lib/env.ts`, parse lazy).
- [x] 6 Mongoose model: `admins`, `categories`, `products`, `store_settings`, `contact_requests`, `counters`.
- [x] Zod schema cho từng module (sẵn cho Phase 2–4).
- [x] Index: `products.slug` (unique), `products.code` (unique), `name`, `categoryId`, `availability`, `createdAt` + 3 index tổng hợp cho listing.
- [x] Script seed Admin an toàn (env + bcrypt cost 12, không ghi đè, có `--reset-password`).
- [x] Script đồng bộ index; route `GET /api/health`.
- [x] Trang chủ tạm; README (cài đặt, môi trường, seed, deploy).

## 2. Kết quả kiểm tra
| Hạng mục | Kết quả |
|---|---|
| `tsc --noEmit` (strict) | Pass |
| `eslint` | Pass |
| `next build` | Pass (đã kiểm tra trong sandbox với font Google được tắt tạm vì sandbox không có internet; trên máy bạn font tải bình thường) |
| Test Zod: sale > price, thiếu ảnh, price = 0, slugify tiếng Việt, SĐT | Pass |
| Kết nối MongoDB Atlas thật, `db:indexes`, `seed:admin` | **Chưa chạy được** (sandbox không truy cập Atlas) — bạn cần chạy local, xem mục 4 |

## 3. Quyết định kỹ thuật & điểm khác spec
1. **Thêm trường `code` vào `products`** (vd `HOA-000001`, unique, sinh tự động qua collection `counters`). Spec yêu cầu "Mã sản phẩm" ở UI/Excel và kiểm tra trùng mã nhưng schema gốc chưa có trường này.
2. **Thêm collection `counters`** để sinh mã tăng dần an toàn (atomic `$inc`).
3. `admins.password` có `select: false` — không bao giờ trả ra khi query mặc định.
4. Product `images[0]` là ảnh đại diện.
5. Next.js 16 bật `cacheComponents`: không dùng `export const dynamic`; dùng `connection()` / Suspense.
6. Chưa cài Auth.js, Cloudinary SDK, TanStack Table, SheetJS, nodemailer — sẽ cài đúng phase cần dùng.
7. Chống spam form liên hệ: schema đã có honeypot (`website`); rate limiting sẽ làm ở Phase 2.

## 4. Việc bạn cần làm trước khi sang Phase 2
```bash
npm install
cp .env.example .env.local        # điền MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULL_NAME
npm run db:indexes
npm run seed:admin
npm run dev                       # mở /api/health, kỳ vọng {"ok":true,"db":"connected"}
```
Nếu có lỗi ở bước nào, gửi mình log để sửa trước khi làm tiếp.

## 5. Cấu trúc code chính
```
src/lib/env.ts · src/lib/utils.ts (cn, slugify) · src/lib/db/{mongoose,indexes}.ts
src/features/{admins,categories,products,store-settings,contact-requests,counters}/model.ts
src/features/*/schema.ts (Zod) · products/repository.ts (generateProductCode) · admins/repository.ts
scripts/{seed-admin,sync-indexes,load-env}.ts
src/app/{layout,page,globals.css} · src/app/api/health/route.ts
```

## 6. Phase 2 sẽ làm
Trang chủ, `/products` (server pagination + search/filter/sort), `/products/[slug]`, `/contact`, form yêu cầu tư vấn + `POST /api/contact-requests` (rate limit, honeypot, email SMTP tùy chọn), layout Guest (header/footer lấy từ `store_settings`), skeleton/empty/error state.

Lưu ý: Phase 2 cần dữ liệu để hiển thị. Do spec cấm hardcode dữ liệu giả trong production, mình sẽ thêm script seed **dữ liệu mẫu chỉ dùng cho môi trường dev** (có cờ rõ ràng), còn production sẽ nhập qua Admin/Excel.
