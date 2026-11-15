import { foldVi } from "@/lib/utils";

export type ColumnKey =
  | "code" | "name" | "description" | "price" | "salePrice" | "category"
  | "flowerType" | "occasion" | "availability" | "isFeatured" | "isActive" | "images";

export interface ColumnDef {
  key: ColumnKey;
  /** Tiêu đề trong file mẫu / file export. */
  header: string;
  /** Tên hiển thị trong thông báo lỗi. */
  label: string;
  required: boolean;
  /** Các tiêu đề khác được chấp nhận khi nhập (đã chuẩn hóa bằng normalizeHeader). */
  aliases: string[];
  width: number;
  help: string;
  example: string;
}

export const COLUMNS: ColumnDef[] = [
  { key: "code", header: "Mã sản phẩm", label: "Mã sản phẩm", required: false, aliases: ["ma", "code", "ma sp", "sku"], width: 16,
    help: "Để TRỐNG để thêm sản phẩm mới (hệ thống tự sinh mã). Điền mã có sẵn (vd. HOA-000012) để CẬP NHẬT sản phẩm đó.", example: "" },
  { key: "name", header: "Tên sản phẩm *", label: "Tên sản phẩm", required: true, aliases: ["ten", "name", "ten sp"], width: 34,
    help: "Tối đa 200 ký tự.", example: "Bó hồng đỏ lãng mạn" },
  { key: "description", header: "Mô tả *", label: "Mô tả", required: true, aliases: ["mo ta", "description"], width: 44,
    help: "Tối đa 5.000 ký tự. Có thể xuống dòng trong ô (Alt + Enter).", example: "10 bông hồng đỏ Đà Lạt gói giấy kraft, kèm thiệp." },
  { key: "price", header: "Giá (VND) *", label: "Giá", required: true, aliases: ["gia", "gia goc", "price"], width: 14,
    help: "Số nguyên dương, lớn hơn 0. Nhập số thuần (vd. 690000), không cần ký hiệu tiền.", example: "690000" },
  { key: "salePrice", header: "Giá khuyến mãi (VND)", label: "Giá khuyến mãi", required: false, aliases: ["gia khuyen mai", "gia km", "sale price", "saleprice"], width: 16,
    help: "Tùy chọn. Phải ≤ Giá. Để trống nếu không khuyến mãi.", example: "590000" },
  { key: "category", header: "Danh mục *", label: "Danh mục", required: true, aliases: ["danh muc", "category", "loai"], width: 20,
    help: "Tên danh mục đã có (xem sheet “Danh mục”, chọn từ danh sách thả xuống). Không phân biệt hoa/thường, dấu.", example: "Hoa tình yêu" },
  { key: "flowerType", header: "Loại hoa", label: "Loại hoa", required: false, aliases: ["loai hoa", "flower type", "flowertype"], width: 22,
    help: "Tùy chọn. Nhiều giá trị cách nhau bằng dấu phẩy.", example: "Hoa hồng, Baby" },
  { key: "occasion", header: "Dịp", label: "Dịp", required: false, aliases: ["dip", "occasion", "dip tang"], width: 24,
    help: "Tùy chọn. Nhiều giá trị cách nhau bằng dấu phẩy.", example: "Sinh nhật, Valentine" },
  { key: "availability", header: "Tình trạng", label: "Tình trạng", required: false, aliases: ["tinh trang", "availability", "ton kho"], width: 13,
    help: "Còn hàng hoặc Hết hàng. Để trống = Còn hàng.", example: "Còn hàng" },
  { key: "isFeatured", header: "Nổi bật", label: "Nổi bật", required: false, aliases: ["noi bat", "featured", "isfeatured"], width: 10,
    help: "Có hoặc Không. Để trống = Không.", example: "Không" },
  { key: "isActive", header: "Hiển thị", label: "Hiển thị", required: false, aliases: ["hien thi", "active", "isactive", "trang thai"], width: 10,
    help: "Có = hiện ở trang khách, Không = ẩn. Để trống = Có.", example: "Có" },
  { key: "images", header: "Ảnh (URL) *", label: "Ảnh", required: true, aliases: ["anh", "hinh anh", "images", "image", "anh url"], width: 46,
    help: "1–10 đường dẫn https://… (mỗi ảnh một dòng trong ô, hoặc cách nhau bằng dấu phẩy/“|”). Ảnh đầu tiên là ảnh đại diện.", example: "https://res.cloudinary.com/demo/image/upload/hoa-1.jpg" },
];

export const COLUMN_BY_KEY = Object.fromEntries(COLUMNS.map((c) => [c.key, c])) as Record<ColumnKey, ColumnDef>;

/** Chuẩn hóa tiêu đề cột: bỏ dấu, bỏ "*", bỏ phần trong ngoặc, thu gọn khoảng trắng. */
export function normalizeHeader(raw: string): string {
  return foldVi(raw.replace(/\([^)]*\)/g, " ").replace(/\*/g, " "))
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const HEADER_LOOKUP = new Map<string, ColumnKey>();
for (const c of COLUMNS) {
  HEADER_LOOKUP.set(normalizeHeader(c.header), c.key);
  HEADER_LOOKUP.set(normalizeHeader(c.label), c.key);
  for (const a of c.aliases) HEADER_LOOKUP.set(normalizeHeader(a), c.key);
}

export function headerToKey(raw: string): ColumnKey | undefined {
  return HEADER_LOOKUP.get(normalizeHeader(raw));
}

export const YES_LABEL = "Có";
export const NO_LABEL = "Không";
export const AVAILABILITY_LABEL = { IN_STOCK: "Còn hàng", OUT_OF_STOCK: "Hết hàng" } as const;
