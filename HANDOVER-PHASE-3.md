# BÀN GIAO — PHASE 3: ADMIN (DỮ LIỆU HARDCODE/MOCK TRƯỚC)

Ngày: 2026-11-15 · Tiếp nối `HANDOVER-PHASE-2.md`

## 0. Điểm khác spec quan trọng — đọc trước
1. **"Hard data trước"**: toàn bộ Admin chạy trên kho dữ liệu **hardcode trong bộ nhớ** (`src/mock/`, `DATA_SOURCE=mock`, mặc định). Không cần MongoDB, **reset khi restart server**. Có 5 danh mục (1 đang tắt), 16 sản phẩm (2 ẩn, 1 hết hàng), 5 yêu cầu liên hệ, 1 bộ cấu hình cửa hàng.
2. **Guest website cũng đọc kho mock** (sửa ở admin → thấy ngay ở `/products`, `/`, `/contact`, form liên hệ ghi vào kho mock). Đặt `DATA_SOURCE=mongo` để guest quay lại đọc MongoDB như Phase 2.
3. **Adapter MongoDB cho Admin CHƯA làm** (`DATA_SOURCE=mongo` → `/api/admin/*` trả 501, riêng **đăng nhập** đã hỗ trợ cả Mongo qua collection `admins`). Đây là việc đầu tiên trước/cùng Phase 4. Toàn bộ chỗ cần thay nằm gọn trong các file `features/*/admin-service.ts` + `features/dashboard/service.ts` (mọi service bắt đầu bằng `assertMock(...)`).
4. **Không dùng Auth.js**: spec cho phép "Auth.js hoặc giải pháp session an toàn". Dùng **JWT ký HS256 (jose) trong cookie HttpOnly** (Auth.js v5 chưa ổn định với Next 16). Chi tiết mục 4.
5. Spec mục 4 bỏ sót `code` sản phẩm (đã thêm từ Phase 1). Thêm `DELETE /api/admin/contact-requests/[id]` và `GET` cho products/categories/store-settings (spec chỉ liệt kê một phần).

## 1. Đã hoàn thành
- [x] **Đăng nhập `/admin/login`**: email + mật khẩu, validate Zod, "ghi nhớ 7 ngày", lỗi chung không lộ email tồn tại, rate limit 10 lần/10 phút/IP, gợi ý tài khoản demo (chỉ mock + dev).
- [x] **Authorization**: `proxy.ts` chặn lạc quan ở biên; **kiểm tra thật ở server** trong layout `(panel)` (`requireAdminPage`) và **mọi** `/api/admin/*` (`requireAdminApi`: session ADMIN + kiểm tra Origin với method ghi).
- [x] **Dashboard `/admin`**: tổng SP, đang hoạt động, hết hàng, số danh mục, yêu cầu chờ, 5 SP mới nhất, 5 yêu cầu gần đây.
- [x] **`/admin/products`**: TanStack Table (checkbox, ảnh, mã, tên, danh mục, giá/giá KM, trạng thái, ngày tạo, actions); tìm theo tên (không phân biệt dấu) hoặc mã; lọc danh mục/trạng thái/khoảng giá; sắp xếp; **phân trang phía server**; bộ lọc nằm trên URL; xóa có xác nhận. Nút Export Excel đang **disabled** (Phase 4).
- [x] **`/admin/products/create`, `/[id]/edit`, `/[id]`** (chi tiết): form React Hook Form + Zod; upload nhiều ảnh, đặt ảnh đại diện, thêm ảnh bằng URL https; loại hoa/dịp dạng chip (gợi ý từ dữ liệu có sẵn); validate đúng spec (tên, giá > 0, giá KM ≤ giá gốc, ≥ 1 ảnh, bắt buộc danh mục).
- [x] **`/admin/categories`**: tìm, lọc trạng thái, thêm/sửa (dialog), bật/tắt nhanh, xóa có xác nhận; **chặn xóa khi còn sản phẩm** (409 + thông báo số SP).
- [x] **`/admin/contacts`**: tìm, lọc trạng thái, phân trang, xem chi tiết (dialog), đổi trạng thái (PENDING/CONTACTED/COMPLETED), xóa.
- [x] **`/admin/settings`**: tên, logo (URL hoặc upload), hotline, email, địa chỉ, Zalo/Messenger/Facebook (để trống = ẩn ở guest).
- [x] Loading skeleton, empty state, error boundary, toast, confirm dialog, responsive (sidebar → drawer trên mobile), skip-link, aria.
- [x] API: `POST /api/admin/auth/{login,logout}`, `GET /api/admin/auth/me`, `GET|POST /api/admin/products`, `GET|PUT|DELETE /api/admin/products/[id]`, `POST /api/admin/uploads`, `GET|POST /api/admin/categories`, `PUT|PATCH|DELETE /api/admin/categories/[id]`, `GET /api/admin/contact-requests`, `GET|PATCH|DELETE /api/admin/contact-requests/[id]`, `GET|PUT /api/admin/store-settings`.

## 2. Kết quả kiểm tra
| Hạng mục | Kết quả |
|---|---|
| `tsc --noEmit` strict · `eslint` | Pass (0 lỗi, 0 cảnh báo) |
| `next build` (font Google tắt tạm vì sandbox không có internet) | Pass — toàn bộ route admin ở dạng Partial Prerender / Dynamic |
| Chưa đăng nhập: `/admin/*` → 307 về login; mọi `/api/admin/*` (GET/POST/DELETE/upload) → 401 | Pass |
| Cookie giả/hỏng → 401 / redirect | Pass |
| Login sai mật khẩu / email lạ → cùng thông báo 401; body sai → 400 có lỗi từng trường; rate limit → 429 từ lần thứ 10 | Pass |
| Cookie: `HttpOnly; Secure; SameSite=Lax`, tên `__Host-` ở production | Pass |
| CSRF: Origin lạ khi ghi → 403; Origin cùng host → OK | Pass |
| CRUD sản phẩm: validate (rỗng, giá KM > giá, ảnh `javascript:`, JSON hỏng), slug trùng → `-2`, mã `HOA-` tăng dần, sửa/ẩn/xóa, 404 | Pass |
| SP ẩn / danh mục tắt biến mất khỏi guest; bật lại thì hiện lại | Pass |
| Danh mục: xóa khi còn SP → 409; trùng tên → 409; bật/tắt; xóa danh mục rỗng | Pass |
| Liên hệ: guest gửi → admin thấy (kèm sản phẩm); đổi trạng thái; status sai → 400; xóa | Pass |
| Upload: PNG hợp lệ → lưu `/uploads/...` & phục vụ được; file `.php` / `.php` đổi tên `.png` → 400; > 5MB → 413; production không có Cloudinary → 503 | Pass |
| Render HTML từng trang admin (dev, đã đăng nhập) | Pass (200, đúng tiêu đề) |
| **Giao diện trên trình duyệt thật, Cloudinary thật, MongoDB thật** | **Chưa kiểm tra được** (sandbox) — xem mục 5 |

## 3. Lỗi đã gặp và cách xử lý
1. `getServerEnv()` bắt buộc `MONGODB_URI` → form liên hệ guest lỗi 500 ở chế độ mock (mailer gọi env). Đã để `MONGODB_URI` tùy chọn; `connectDB()` báo lỗi rõ khi thiếu.
2. `@tanstack/react-table@latest` hiện là **v9 (API khác hoàn toàn)** → đã ghim `^8.21`. Đừng nâng lên v9 nếu chưa viết lại bảng.
3. Next 16 + `cacheComponents`: mọi trang admin đọc dữ liệu phải `await connection()` (kho mock trong bộ nhớ không bị coi là dữ liệu động → nếu thiếu, trang bị prerender lúc build với dữ liệu cũ) và nằm trong `<Suspense>`.
4. Next 16 đổi `middleware` → **`proxy.ts`**.
5. Giá `""` bị `z.coerce.number()` đổi thành 0 → form dùng `setValueAs` đổi `""` → `undefined`; thông báo lỗi tiếng Việt cho giá/danh mục.

## 4. Quyết định kỹ thuật
- **Session**: JWT HS256 (`jose`), cookie `HttpOnly`, `Secure` ở production, `SameSite=Lax`, tên `__Host-fs_session` ở production. Không tick "ghi nhớ" → cookie phiên (JWT sống 12h); tick → 7 ngày. **Logout chỉ xóa cookie** (stateless) — token bị lộ vẫn dùng được tới khi hết hạn; nếu cần thu hồi tức thì, thêm `tokenVersion` vào admin + kiểm tra khi verify (làm cùng adapter Mongo).
- `AUTH_SECRET`: dev không đặt thì dùng khóa dev cố định (không an toàn); **production bắt buộc** (≥16 ký tự, `openssl rand -base64 32`).
- Tài khoản demo `admin@example.com / Admin@12345` chỉ bật khi mock **và** không production **và** không đặt ADMIN_EMAIL/ADMIN_PASSWORD. Production + mock: phải đặt `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
- Timing: so sánh bcrypt cả khi email không tồn tại (hash giả) để không lộ email nào có thật.
- Upload: kiểm tra **magic bytes** (JPG/PNG/WEBP/GIF), không tin tên file/Content-Type, giới hạn 5MB, tên file do server sinh, không nhận SVG. Cloudinary dùng REST + chữ ký SHA-1 (không thêm SDK). Không có Cloudinary: ghi `public/uploads/` (chỉ dev; production trả 503).
- Ảnh trong schema: chấp nhận `https://...` hoặc `/uploads/<tên>`; admin hiển thị bằng `<img>` thường (không bị giới hạn host của `next/image`). Ảnh guest vẫn qua `next/image` → URL ngoài ngoài `res.cloudinary.com`/`placehold.co` sẽ cần thêm vào `next.config.ts`.
- Tìm kiếm ở admin **không phân biệt dấu** (guest vẫn phân biệt dấu như Phase 2).
- Rate limit vẫn in-memory (như Phase 2): production nên chuyển Upstash/Vercel KV.
- Xóa sản phẩm: các yêu cầu liên hệ cũ giữ lại, chỉ bỏ liên kết sản phẩm.
- Đóng gói: `public/uploads/` đã thêm vào `.gitignore`.

## 5. Việc bạn cần làm trước khi sang Phase 4
```bash
npm install
cp .env.example .env.local        # giữ DATA_SOURCE=mock
npm run dev
```
Kiểm tra thủ công (http://localhost:3000/admin/login, nút "Điền sẵn" tài khoản demo):
1. Đăng nhập sai → báo lỗi; đúng → vào Dashboard; đăng xuất → về login; mở `/admin` khi chưa đăng nhập → bị chuyển.
2. Sản phẩm: tìm "tulip", lọc danh mục/trạng thái/giá, sắp xếp, tick checkbox, xem/sửa/xóa.
3. Thêm SP: thử bỏ trống từng trường, giá KM > giá, tải ảnh lên (JPG/PNG), đổi ảnh đại diện → mở `/products` xem hiển thị.
4. Danh mục: thử xóa "Hoa sinh nhật" (phải bị chặn), tắt một danh mục (SP của nó biến mất ở guest).
5. Gửi form tư vấn ở trang khách → xem ở `/admin/contacts`, đổi trạng thái.
6. Cấu hình: xóa Zalo → icon Zalo biến mất ở footer/liên hệ.
7. Thu nhỏ trình duyệt / điện thoại: sidebar thành menu trượt, bảng cuộn ngang.
(Tùy chọn) điền Cloudinary vào `.env.local` để thử upload thật.

Nếu giao diện chưa ưng hoặc có lỗi, gửi ảnh chụp/log để chỉnh trước Phase 4.

## 6. Cấu trúc thêm ở Phase 3
```
src/proxy.ts
src/mock/{types,data,store,guest}.ts            # kho dữ liệu hardcode + truy vấn guest
src/lib/{data-mode,api-admin,uploads,client-api,use-url-filters}.ts · src/lib/auth/{token,session,guard}.ts
src/features/{admins/service,products/admin-service+admin-types,categories/admin-service,contact-requests/admin-service,store-settings/admin-service,dashboard/service}.ts
src/app/admin/login/page.tsx · src/app/admin/(panel)/{layout,loading,error,page}.tsx
src/app/admin/(panel)/{products,products/create,products/[id],products/[id]/edit,categories,contacts,settings}/page.tsx
src/app/api/admin/{auth/*,products,products/[id],uploads,categories,categories/[id],contact-requests,contact-requests/[id],store-settings}/route.ts
src/components/admin/*   src/components/ui/{switch,confirm-dialog}.tsx
```

## 7. Phase 4 sẽ làm
Adapter MongoDB cho admin (việc đầu tiên), tải Excel mẫu, import có Preview + validate từng dòng + xác nhận + tải file lỗi, export (toàn bộ / theo bộ lọc / theo dòng đã chọn — bật nút Export đang disabled), đặt tên file theo ngày.
