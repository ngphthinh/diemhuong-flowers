# BÀN GIAO — PHASE 2: GUEST WEBSITE

Ngày: 2026-11-15 · Tiếp nối `HANDOVER-PHASE-1.md`

## 1. Đã hoàn thành
- [x] **Trang chủ `/`**: header (logo, menu, tìm kiếm, hotline), hero, danh mục, sản phẩm nổi bật, sản phẩm mới, giới thiệu, hướng dẫn đặt hoa (4 bước), thông tin liên hệ, footer.
- [x] **`/products`**: grid card; tìm theo tên; lọc danh mục, khoảng giá, loại hoa, dịp kỷ niệm, chỉ còn hàng; sắp xếp mới nhất / giá tăng / giá giảm; **phân trang phía server**; trạng thái lọc nằm trên URL (chia sẻ/back được).
- [x] **`/products/[slug]`**: gallery, mã sản phẩm, giá + giá khuyến mãi + % giảm, mô tả, loại hoa, dịp phù hợp, tình trạng, nút liên hệ mua, link nhanh gọi/Zalo/Messenger, sản phẩm liên quan, metadata SEO.
- [x] **Form yêu cầu tư vấn** (dialog): tự điền sản phẩm, validate React Hook Form + Zod, gửi `POST /api/contact-requests`, lưu MongoDB, gửi email cho Admin nếu cấu hình SMTP, toast thành công/lỗi.
- [x] **`/contact`**: hotline, email, địa chỉ, Zalo, Facebook, Messenger (kênh trống tự ẩn) + form.
- [x] Loading skeleton, empty state, error boundary, not-found, toast (Sonner), responsive, skip-link, focus rõ, `aria-*`.
- [x] **API công khai**: `GET /api/products`, `/api/products/[id]`, `/api/products/slug/[slug]`, `/api/categories`, `/api/store-settings`, `POST /api/contact-requests`.
- [x] Bảo mật form liên hệ: Zod ở server, giới hạn body 10KB, rate limit 5 yêu cầu/10 phút/IP, honeypot, lỗi chung không lộ stack.
- [x] Script `npm run seed:dev -- --yes` (dữ liệu mẫu, chỉ dev).

## 2. Kết quả kiểm tra
| Hạng mục | Kết quả |
|---|---|
| `tsc --noEmit` strict · `eslint` | Pass |
| `next build` (font Google tắt tạm vì sandbox không có internet) | Pass — `/`, `/products`, `/contact`, `/products/[slug]` ở dạng Partial Prerender |
| Chạy bản build, gọi API không cần DB: body sai → 400 kèm lỗi từng trường; JSON hỏng → 400; query sai → 400; rate limit → 429 từ lần thứ 6; trang chủ trả 200 | Pass |
| Schema: salePrice > price, `inStock=false`, honeypot | Pass |
| Truy vấn thật tới MongoDB (danh sách, lọc, chi tiết, lưu contact, email SMTP) và giao diện trên trình duyệt | **Chưa kiểm tra được** (sandbox không có Atlas/trình duyệt) — xem mục 5 |

## 3. Lỗi đã gặp và cách xử lý (đáng biết khi viết tiếp)
1. **mongoose lọt vào bundle trình duyệt** do `schema.ts` import hằng số từ `model.ts`. Đã tách `constants.ts` (products, contact-requests). **Quy tắc:** file nào Client Component import thì không được import `model.ts`.
2. **`sanitizeFilter` toàn cục (Phase 1) làm hỏng `$in/$regex/$expr`** do server dựng. Đã bỏ; chống NoSQL injection bằng cách mọi input đi qua Zod (chuỗi/số/enum) và regex được escape. Không bao giờ truyền object thô từ request vào query.
3. Mongoose 9 đổi `FilterQuery` → `QueryFilter`.
4. `z.coerce.boolean()` coi `"false"` là `true` → parse `inStock` thủ công.
5. Next 16 `cacheComponents`: mọi truy cập DB nằm trong `<Suspense>` và gọi `await connection()` trước.
6. lucide-react không còn icon Facebook → dùng icon `Users`.

## 4. Quyết định kỹ thuật
- Guest chỉ thấy sản phẩm `isActive: true` **và** thuộc danh mục `isActive: true`.
- Lọc giá theo **giá hiệu lực** (`salePrice` nếu có, không thì `price`); sắp xếp giá hiện theo `price` gốc (đơn giản, có index) — nếu bạn muốn sắp theo giá hiệu lực, cần thêm trường giá hiệu lực vào DB.
- Tìm theo tên dùng regex không phân biệt hoa/thường (khớp một phần, **phân biệt dấu**: "hong" không khớp "hồng"). Nếu cần tìm không dấu, Phase sau thêm trường `searchText` đã bỏ dấu.
- Thay vì chạy `shadcn add` (cần internet), mình tự viết các UI primitive tương thích (Button, Input, Textarea, NativeSelect, Badge, Skeleton, Dialog trên `<dialog>` native). Có thể thay bằng component shadcn sau mà không đổi API trang.
- Rate limit **in-memory** (mỗi instance serverless có bộ nhớ riêng) → chỉ là lớp cơ bản. Production nên dùng Upstash Redis / Vercel KV, thay trong `src/lib/rate-limit.ts`.
- CAPTCHA: chưa thêm (spec ghi "khi cần"); đã có rate limit + honeypot. Nếu thấy spam, thêm Cloudflare Turnstile.
- Hình ảnh: `next/image` chỉ cho phép host `res.cloudinary.com` và `placehold.co` (xem `next.config.ts`).
- Giao diện: bảng màu theo spec; Playfair Display cho tiêu đề; điểm nhấn là khung ảnh hình vòm ở hero.

## 5. Việc bạn cần làm trước khi sang Phase 3
```bash
npm install
npm run db:indexes
npm run seed:dev -- --yes     # dữ liệu mẫu
npm run dev
```
Kiểm tra thủ công:
1. `/` hiển thị hero, danh mục, sản phẩm nổi bật/mới.
2. `/products`: thử tìm, lọc, sắp xếp, phân trang (đổi `pageSize` qua API nếu muốn thử nhiều trang).
3. Chi tiết sản phẩm → **Liên hệ mua hàng** → gửi form → kiểm tra collection `contact_requests` trong Atlas.
4. (Tùy chọn) điền SMTP trong `.env.local` để nhận email.
5. Xem trên điện thoại / thu nhỏ trình duyệt.

Nếu có lỗi hoặc giao diện chưa ưng (màu, bố cục, nội dung chữ), gửi mình log/ảnh chụp để chỉnh trước Phase 3.

## 6. Cấu trúc thêm ở Phase 2
```
src/app/(guest)/{layout,page,error,not-found}.tsx · products/{page,loading}.tsx · products/[slug]/page.tsx · contact/page.tsx
src/app/api/{products,products/[id],products/slug/[slug],categories,store-settings,contact-requests}/route.ts
src/components/ui/*   src/components/site/*   src/components/products/*
src/features/{products,categories,store-settings,contact-requests}/service.ts (+ constants.ts, types.ts)
src/lib/{api,format,mailer,rate-limit}.ts · scripts/seed-dev-data.ts
```

## 7. Phase 3 sẽ làm
Auth.js (credentials, bcrypt, session HttpOnly), bảo vệ `/admin/*` và `/api/admin/*` ở server, Dashboard, CRUD sản phẩm (upload nhiều ảnh lên Cloudinary, ảnh đại diện), CRUD danh mục (chặn xóa khi đang dùng), quản lý yêu cầu liên hệ, cấu hình cửa hàng.
