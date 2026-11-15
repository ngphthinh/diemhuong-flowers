# BÀN GIAO — PHASE 4: EXCEL (MẪU · PREVIEW · VALIDATE · IMPORT · EXPORT)

Ngày: 2026-11-15 · Tiếp nối `HANDOVER-PHASE-3.md` · Chạy trên **kho dữ liệu mock** (`DATA_SOURCE=mock`).

## 0. Điểm khác spec / việc chưa làm — đọc trước
1. **Không dùng `exceljs`/`xlsx`**: sandbox build không có mạng nên không cài được. Thay vào đó viết module XLSX nhỏ, **không phụ thuộc gói ngoài** (`src/lib/xlsx/`, ~540 dòng, chỉ dùng `node:zlib`) để test được ngay. Nếu sau này cần tính năng Excel phức tạp hơn (ảnh nhúng, ngày giờ, công thức…) có thể thay bằng `exceljs`; toàn bộ logic nghiệp vụ nằm ngoài `lib/xlsx` nên chỉ cần đổi `lib/xlsx/{read,write}.ts` + `build.ts`.
2. **Adapter MongoDB cho admin vẫn CHƯA làm** (Phase 3 mục 0.3). Phase 4 theo đúng pattern Phase 3: `DATA_SOURCE=mongo` → import/export trả 501. Chỉ có 3 chỗ chạm kho dữ liệu, đều trong `features/products/excel/service.ts` (`loadContext()`, vòng ghi trong `commitProductImport()`, nguồn dữ liệu trong `exportProducts()`); phần đọc/validate file (`parse.ts`) và dựng file (`build.ts`) không biết gì về kho dữ liệu.
3. Theo yêu cầu: **không chạy `next build`/production**. Đã test logic bằng script ở chế độ dev/mock (mục 2).

## 1. Đã hoàn thành
- [x] **Tải Excel mẫu** (`GET /api/admin/products/import/template`): 3 sheet — **Sản phẩm** (chỉ dòng tiêu đề, dropdown Danh mục/Tình trạng/Nổi bật/Hiển thị, cố định dòng đầu), **Hướng dẫn** (quy tắc từng cột + lưu ý), **Danh mục** (danh mục hiện có, kể cả đang tắt). Nút ở `/admin/products` và `/admin/products/import`.
- [x] **Import Preview** (`POST …/import/preview`, trang `/admin/products/import`): kéo thả/chọn file → tự đọc + kiểm tra → bảng xem trước từng dòng (Thêm mới / Cập nhật / Không đổi / Lỗi), lọc theo loại + cảnh báo, ô tóm tắt, hiển thị 200 dòng/lần. **Không ghi gì** ở bước này.
- [x] **Validate dữ liệu** (từng dòng, báo đúng số dòng Excel + tên cột): dùng lại `productInputSchema` của form admin (tên, mô tả, giá > 0, giá KM ≤ giá, 1–10 ảnh https hoặc /uploads, danh mục) + kiểm tra thêm: danh mục phải tồn tại (khớp không phân biệt dấu/hoa-thường), mã `HOA-xxxxxx` phải có thật, trùng mã trong file, Tình trạng/Nổi bật/Hiển thị đúng giá trị, giá nhập dạng `1.290.000`/`690000đ` đều đọc được.
  *Cảnh báo (không chặn)*: trùng tên với sản phẩm có sẵn hoặc dòng khác trong file; danh mục đang tắt.
- [x] **Import dữ liệu** (`POST …/import`): màn hình xác nhận → ghi. **Server đọc + kiểm tra lại file** (không tin kết quả preview của client). Chỉ ghi dòng hợp lệ, dòng lỗi bỏ qua. Màn hình kết quả: thêm/cập nhật/không đổi/bỏ qua. **Tải file dòng lỗi** (`POST …/import/errors`): chứa đúng các dòng lỗi + cột "Lỗi cần sửa", sửa rồi nhập lại được.
- [x] **Export Excel** (`POST /api/admin/products/export`): nút **Export Excel** (đã bật) mở hộp thoại: *các dòng đã chọn* / *theo bộ lọc hiện tại (mọi trang, giữ thứ tự sắp xếp)* / *toàn bộ*. Tên file theo ngày giờ Việt Nam: `san-pham_2026-11-15_1452.xlsx` (`-da-chon`, `-theo-bo-loc`).
- [x] File export **cùng cột với file mẫu** (+ "Ngày tạo", bị bỏ qua khi nhập) → export → sửa → nhập lại là một luồng liền mạch; export nguyên trạng rồi nhập lại cho kết quả "Không đổi" 100%.

## 2. Quy tắc import (để biết sẽ xảy ra gì)
| Ô "Mã sản phẩm" | Kết quả |
|---|---|
| Trống | **Thêm mới** (tự sinh mã `HOA-…` tăng theo thứ tự dòng, tự sinh slug, `-2` nếu trùng) |
| Mã có thật | **Cập nhật — ghi đè toàn bộ các cột** (ô trống = xóa giá trị/dùng mặc định: Còn hàng, Không nổi bật, Hiển thị). Nếu mọi giá trị giống hệt hiện tại → "Không đổi", bỏ qua |
| Mã không tồn tại / sai định dạng | Lỗi dòng đó |
- Mặc định khi để trống: Tình trạng = Còn hàng, Nổi bật = Không, Hiển thị = Có.
- **Không tự tạo danh mục** — danh mục lạ là lỗi (tránh tạo rác do gõ sai). Muốn thêm danh mục: tạo ở `/admin/categories` rồi tải lại file mẫu.
- Ảnh: 1–10 URL `https://…` (hoặc `/uploads/…`), mỗi ảnh một dòng trong ô hoặc cách nhau `,` `;` `|`; ảnh đầu = ảnh đại diện. **Import không tải ảnh lên** — chỉ nhận đường dẫn.
- Loại hoa/Dịp: cách nhau dấu phẩy, tự bỏ trùng.
- Giới hạn: `.xlsx` ≤ 5MB, ≤ 1.000 dòng dữ liệu; `.xls`, `.csv` bị từ chối kèm hướng dẫn. Tiêu đề cột nhận linh hoạt (không dấu/hoa-thường, thứ tự cột bất kỳ, cột lạ bị bỏ qua; header nằm trong 10 dòng đầu).

## 3. Kết quả kiểm tra
Chạy: `npm run verify:excel` (script `scripts/verify-excel.ts`, dùng kho mock, không cần MongoDB/build).

| Hạng mục | Kết quả |
|---|---|
| 26 kiểm thử tự động: ghi→đọc lại (unicode, xuống dòng, `&<>"'`, emoji, số/bool, giá trị bắt đầu bằng `=` vẫn là chuỗi), file hỏng/cụt/không phải xlsx, **zip-bomb** (kích thước khai báo giả) bị chặn, mẫu, 16 loại lỗi từng dòng đúng số dòng/tên cột, nhiều cách viết giá/bool/tình trạng, ảnh nhiều dạng, mã có sẵn → update/unchanged/trùng mã, cảnh báo, tiêu đề linh hoạt, giới hạn 1.000 dòng, preview không ghi, commit chỉ ghi dòng hợp lệ + thứ tự mã, báo cáo lỗi → sửa → nhập lại, export toàn bộ/lọc/chọn/dữ liệu đặc biệt, **round-trip export→import = 100% không đổi** | **Pass** (26/26) |
| File do code này ghi ra mở được bằng **openpyxl 3.1.5** (tiêu đề, dropdown, định dạng số, freeze) và **LibreOffice** (đổi sang PDF/CSV đúng nội dung) | Pass |
| File do **openpyxl** và **LibreOffice** ghi ra (shared strings, ô công thức, hàng trống) đọc được bằng module của dự án | Pass |
| `tsc --noEmit` strict trên `lib/xlsx`, `features/products/excel`, script test | Pass (không lỗi nào thuộc code mới) |
| **Chưa chạy được trong sandbox**: `next dev`, API route qua HTTP, giao diện trên trình duyệt thật, **Microsoft Excel** thật, **zod v4** (sandbox chỉ có zod 3.25 — code Phase 3 dùng `{ error: … }` của v4 nên test dùng cùng schema ở v3) | **Chưa kiểm tra** — xem mục 4 |

## 4. Việc bạn cần làm trước khi sang Phase 5
```bash
npm install
cp .env.example .env.local        # giữ DATA_SOURCE=mock
npm run verify:excel              # chạy bộ test logic bằng zod v4 thật
npm run dev
```
Kiểm tra thủ công (http://localhost:3000/admin/login, tài khoản demo như Phase 3):
1. `/admin/products` → **Tải Excel mẫu** → mở bằng Excel: thấy dropdown ở cột Danh mục/Tình trạng/Nổi bật/Hiển thị, sheet Hướng dẫn + Danh mục.
2. Điền 3–4 dòng (1 hợp lệ thêm mới, 1 thiếu tên, 1 giá KM > giá, 1 danh mục sai) → **Nhập Excel** → thả file → xem preview, thử các nút lọc, **Tải file dòng lỗi**, **Nhập N dòng hợp lệ** → vào `/admin/products` thấy sản phẩm mới (và ở `/products` phía khách nếu đang hiển thị).
3. **Export Excel**: tick vài dòng → "Các dòng đã chọn"; lọc "tulip" → "Theo bộ lọc"; "Toàn bộ". Kiểm tra tên file có ngày giờ.
4. Mở file export, sửa giá một dòng, xóa 1 dòng, nhập lại → preview: 1 Cập nhật, còn lại Không đổi.
5. Thử file `.csv`/`.xls`/file đổi đuôi `.txt` → `.xlsx` → phải báo lỗi rõ ràng, không bị treo.
6. Gửi ảnh chụp/log nếu giao diện hoặc API có vấn đề, mình chỉnh trước Phase 5.

## 5. Cấu trúc thêm ở Phase 4
```
src/lib/xlsx/{zip,write,read}.ts                       # module XLSX không phụ thuộc gói ngoài
src/features/products/excel/
  types.ts        # kiểu dùng chung server+client, hằng số giới hạn, formatIssue
  columns.ts      # định nghĩa cột (tiêu đề, alias, hướng dẫn) — sửa cột ở đây
  parse.ts        # đọc + validate từng dòng (thuần, không biết kho dữ liệu)
  build.ts        # dựng file mẫu / export / báo lỗi, đặt tên file theo ngày
  service.ts      # nối với kho dữ liệu (mock) — chỗ cần thay khi làm adapter Mongo
  http.ts         # trả file .xlsx, nhận upload (kiểm tra size/đuôi/chữ ký zip)
src/app/api/admin/products/{import,import/preview,import/errors,import/template,export}/route.ts
src/app/admin/(panel)/products/import/page.tsx
src/components/admin/{product-import,export-dialog,template-download-button}.tsx
src/lib/client-api.ts      # thêm postFile(), downloadFile()
src/lib/utils.ts           # thêm foldVi()
scripts/verify-excel.ts    # bộ test (npm run verify:excel)
```
Sửa file cũ: `products-table.tsx` (bật nút Export), `products/page.tsx` (nút Tải mẫu/Nhập Excel), `package.json` (script `verify:excel`), `README.md`.

## 6. Ghi chú kỹ thuật
- Excel → chuỗi luôn ghi dạng text nên giá trị người dùng bắt đầu bằng `= + - @` không bị Excel hiểu thành công thức khi mở file export. Reader **không bao giờ chạy công thức/macro**; ô công thức không có giá trị cache (file tạo bằng thư viện) được coi là trống.
- Chống file độc: chỉ nhận `.xlsx` có chữ ký zip, ≤ 5MB, giới hạn tổng dung lượng giải nén 60MB và theo kích thước khai báo từng entry, không hỗ trợ zip64/mã hóa, ≤ 5.000 dòng/≤ 60 cột được đọc.
- Preview và import là 2 request độc lập (stateless, không lưu file ở server): client giữ `File`, gửi lại khi xác nhận; server kiểm tra lại nên dữ liệu đổi giữa 2 bước vẫn đúng.
- Rate limit chưa áp cho các endpoint này (chỉ admin đã đăng nhập gọi được).
