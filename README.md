# 🌸 Anniversary Flower Shop

Website giới thiệu và kinh doanh hoa kỷ niệm. Hai vai trò: **ADMIN** (quản trị) và **GUEST** (khách, không cần đăng nhập, liên hệ để đặt hoa).

**Stack:** Next.js (App Router) · React · TypeScript strict · Tailwind CSS v4 · shadcn/ui · MongoDB Atlas + Mongoose · Zod · Auth.js · SheetJS · Cloudinary.

> Trạng thái: **Phase 1 – Foundation** và **Phase 2 – Guest Website** hoàn thành. Xem `HANDOVER-PHASE-1.md`, `HANDOVER-PHASE-2.md`.

## 1. Yêu cầu
- Node.js >= 20.9
- Tài khoản MongoDB Atlas (cluster free M0 là đủ)

## 2. Cài đặt
```bash
npm install
cp .env.example .env.local     # rồi điền giá trị
```

## 3. Cấu hình MongoDB Atlas
1. Tạo cluster → **Database Access**: tạo user có quyền readWrite.
2. **Network Access**: thêm IP của bạn (khi deploy Vercel: `0.0.0.0/0`, hoặc dùng Vercel–Atlas integration).
3. **Connect → Drivers**: copy connection string vào `MONGODB_URI` (thay `<password>`; nếu mật khẩu có ký tự đặc biệt, hãy URL-encode).

## 4. Tạo index và seed Admin
```bash
npm run db:indexes        # đồng bộ index lên MongoDB
```
Điền `ADMIN_EMAIL`, `ADMIN_PASSWORD` (>= 10 ký tự, có chữ hoa, chữ thường, số), `ADMIN_FULL_NAME` trong `.env.local`, rồi:
```bash
npm run seed:admin              # tạo admin (bỏ qua nếu email đã tồn tại)
npm run seed:admin:reset        # đặt lại mật khẩu admin đã tồn tại
```
Mật khẩu được hash bằng bcrypt (cost 12). Sau khi seed xong, bạn có thể xóa `ADMIN_PASSWORD` khỏi `.env.local`.

## 4b. Dữ liệu mẫu để xem giao diện (chỉ dev)
```bash
npm run seed:dev -- --yes
```
Tạo 4 danh mục, 14 sản phẩm mẫu (ảnh placeholder) và cấu hình cửa hàng mẫu nếu chưa có. Script từ chối chạy khi `NODE_ENV=production`. **Không dùng cho database production** — hãy nhập dữ liệu thật qua Admin/Excel (Phase 3–4).

## 5. Chạy dự án
```bash
npm run dev          # http://localhost:3000
npm run typecheck
npm run lint
npm run build
```
Kiểm tra kết nối DB: mở `http://localhost:3000/api/health` → `{"ok":true,"db":"connected"}`.

## 6. shadcn/ui
Đã có `components.json`, `cn()` và design tokens. Thêm component khi cần (cần internet):
```bash
npx shadcn@latest add button input label textarea select dialog alert-dialog table badge card skeleton checkbox sheet dropdown-menu pagination
```

## 7. Cấu trúc thư mục
```
src/
  app/                 # routes (App Router) + app/api/*
  components/ui/       # shadcn/ui
  features/<module>/   # model.ts · schema.ts (Zod) · repository.ts · (service.ts)
  lib/                 # env.ts, utils.ts, db/mongoose.ts, db/indexes.ts
scripts/               # seed-admin.ts, sync-indexes.ts
```

## 8. Deploy lên Vercel
1. Push code lên GitHub → Import vào Vercel.
2. Thêm toàn bộ biến trong `.env.example` vào **Project Settings → Environment Variables** (đặt `AUTH_URL` là domain production).
3. Atlas **Network Access** cho phép Vercel truy cập.
4. Chạy `npm run db:indexes` và `npm run seed:admin` một lần từ máy local với `MONGODB_URI` production.
5. Deploy.

## 9. API công khai (Guest)
| Method | Endpoint | Ghi chú |
|---|---|---|
| GET | `/api/products` | `q, category, minPrice, maxPrice, flowerType, occasion, inStock, sort, page, pageSize` |
| GET | `/api/products/[id]` · `/api/products/slug/[slug]` | chi tiết |
| GET | `/api/categories` · `/api/store-settings` | |
| POST | `/api/contact-requests` | Zod + rate limit 5/10 phút/IP + honeypot |

## 10. Lưu ý Next.js 16
Dự án bật `cacheComponents` (mặc định của template). Vì vậy **không dùng** `export const dynamic = ...` trong route/page; dùng `await connection()` (`next/server`) hoặc `<Suspense>` để chọn dynamic rendering.

## Phase 3 — Admin (MongoDB)

```bash
npm install
cp .env.example .env.local     # điền MONGODB_URI, MONGODB_DB, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run dev
```
- Toàn bộ dữ liệu (guest lẫn admin) lấy từ MongoDB; không còn chế độ mock.
- **Khởi tạo dữ liệu lần đầu** (`src/lib/db/init-data.ts`, gọi từ `src/instrumentation.ts` khi server khởi động): chỉ seed nơi collection đang **trống** — database đã có dữ liệu thì không đụng vào gì.
  - `admins` trống → tạo admin từ `ADMIN_EMAIL` / `ADMIN_PASSWORD` (dev không đặt: `admin@example.com` / `Admin@12345`; production thiếu mật khẩu thì bỏ qua, dùng `npm run seed:admin`).
  - `store_settings` trống → thông tin cửa hàng mặc định.
  - `categories` + `products` đều trống → 4 danh mục + 14 sản phẩm mẫu (ảnh placehold.co).
  - `contact_requests` trống → 5 yêu cầu liên hệ mẫu (không làm ở production).
  - Chạy thủ công: `npm run db:init`. Tắt hẳn: `INIT_DATA=off`.
- Upload ảnh: có Cloudinary env thì lên Cloudinary; không thì (chỉ dev) lưu vào `public/uploads/`.
- Production: bắt buộc `AUTH_SECRET`, `MONGODB_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

## Phase 4 — Excel (mẫu · preview · validate · import · export)
- Trang `/admin/products`: **Tải Excel mẫu**, **Nhập Excel** (`/admin/products/import`), **Export Excel** (toàn bộ / theo bộ lọc / dòng đã chọn).
- Quy tắc nhập, giới hạn: xem `HANDOVER-PHASE-4.md`. Logic nằm ở `src/features/products/excel/`, thư viện XLSX tự viết ở `src/lib/xlsx/` (không cần cài thêm gói).
- Test logic thuần (không cần MongoDB): `npm run verify:excel`.
