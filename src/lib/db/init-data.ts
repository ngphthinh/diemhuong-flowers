import bcrypt from "bcryptjs";
import { Admin } from "@/features/admins/model";
import { adminSeedSchema } from "@/features/admins/schema";
import { Category } from "@/features/categories/model";
import { ContactRequest } from "@/features/contact-requests/model";
import { Counter } from "@/features/counters/model";
import { Product } from "@/features/products/model";
import { generateProductCode } from "@/features/products/repository";
import { StoreSettings } from "@/features/store-settings/model";
import { isDuplicateKeyError } from "@/lib/errors";
import { slugify } from "@/lib/utils";
import { connectDB } from "./mongoose";

/**
 * KHỞI TẠO DỮ LIỆU LẦN ĐẦU.
 *
 * Chạy ngay khi server khởi động (xem src/instrumentation.ts) hoặc thủ công: `npm run db:init`.
 * Quy tắc: CHỈ seed nơi collection đang TRỐNG — database đã có dữ liệu thì không đụng vào gì.
 *
 *   admins          trống -> tạo tài khoản admin từ ADMIN_EMAIL / ADMIN_PASSWORD
 *   store_settings  trống -> tạo thông tin cửa hàng mặc định
 *   categories + products  cả hai đều trống -> tạo danh mục + sản phẩm mẫu
 *   contact_requests trống -> tạo vài yêu cầu liên hệ mẫu (KHÔNG làm ở production)
 *
 * An toàn khi chạy nhiều lần / nhiều tiến trình cùng lúc (idempotent, bắt lỗi trùng khóa unique).
 * Tắt hoàn toàn bằng INIT_DATA=off.
 */

export interface InitDataResult {
  skipped: boolean;
  admin: "created" | "exists" | "skipped";
  settings: "created" | "exists";
  catalog: { categories: number; products: number } | "exists";
  contacts: number | "exists" | "skipped";
}

const DAY = 86_400_000;
const HOUR = 3_600_000;
const isProd = () => process.env.NODE_ENV === "production";

const img = (text: string, bg = "F6E3E7", fg = "C4707F") =>
  `https://placehold.co/800x1000/${bg}/${fg}/png?text=${encodeURIComponent(text)}`;

/* ------------------------------ Dữ liệu mẫu ------------------------------ */

const CATEGORY_SEED = [
  {
    name: "Hoa sinh nhật",
    description: "Tươi sáng và rộn ràng cho ngày của người đặc biệt.",
  },
  {
    name: "Hoa kỷ niệm",
    description: "Kỷ niệm ngày cưới, ngày yêu nhau, những cột mốc chung.",
  },
  { name: "Hoa tình yêu", description: "Lời tỏ tình không cần nói thành lời." },
  { name: "Hoa sự kiện", description: "Khai trương, chúc mừng, tri ân." },
];

interface ProductSeed {
  name: string;
  cat: string;
  price: number;
  sale?: number;
  flower: string[];
  occ: string[];
  desc: string;
  featured?: boolean;
  out?: boolean;
}

const PRODUCT_SEED: ProductSeed[] = [
  {
    name: "Bó hồng đỏ 99 bông",
    cat: "Hoa kỷ niệm",
    price: 1890000,
    sale: 1590000,
    flower: ["Hoa hồng"],
    occ: ["Kỷ niệm ngày cưới", "Valentine"],
    featured: true,
    desc: "99 bông hồng đỏ Đà Lạt gói giấy kraft, kèm thiệp viết tay.\nPhù hợp tặng kỷ niệm ngày cưới hoặc cầu hôn.",
  },
  {
    name: "Bó hồng pastel dịu dàng",
    cat: "Hoa sinh nhật",
    price: 690000,
    flower: ["Hoa hồng", "Baby"],
    occ: ["Sinh nhật"],
    featured: true,
    desc: "Hồng phấn phối baby trắng, gói giấy mờ màu kem.",
  },
  {
    name: "Giỏ tulip mùa xuân",
    cat: "Hoa tình yêu",
    price: 850000,
    sale: 790000,
    flower: ["Tulip"],
    occ: ["Ngày yêu nhau", "Sinh nhật"],
    featured: true,
    desc: "Tulip nhập khẩu cắm giỏ mây, tươi 5–7 ngày nếu thay nước hằng ngày.",
  },
  {
    name: "Bó hướng dương rạng rỡ",
    cat: "Hoa sinh nhật",
    price: 520000,
    flower: ["Hướng dương"],
    occ: ["Sinh nhật", "Chúc mừng"],
    featured: true,
    desc: "Hướng dương phối cúc mini vàng, mang năng lượng tích cực.",
  },
  {
    name: "Hộp hoa hồng trắng",
    cat: "Hoa tình yêu",
    price: 990000,
    flower: ["Hoa hồng"],
    occ: ["Ngày yêu nhau", "Kỷ niệm ngày cưới"],
    desc: "Hồng trắng cắm hộp tròn, kèm thiệp.",
  },
  {
    name: "Bó cẩm tú cầu xanh",
    cat: "Hoa kỷ niệm",
    price: 780000,
    flower: ["Cẩm tú cầu"],
    occ: ["Kỷ niệm ngày cưới"],
    desc: "Cẩm tú cầu xanh phối lá bạc, gói giấy xanh nhạt.",
  },
  {
    name: "Kệ hoa khai trương",
    cat: "Hoa sự kiện",
    price: 1500000,
    flower: ["Hoa lan", "Hoa hồng"],
    occ: ["Khai trương"],
    out: true,
    desc: "Kệ hoa hai tầng cao 1,6m, kèm băng rôn chúc mừng.",
  },
  {
    name: "Bó lavender thư giãn",
    cat: "Hoa tình yêu",
    price: 450000,
    flower: ["Lavender"],
    occ: ["Ngày yêu nhau"],
    desc: "Lavender khô thơm nhẹ, giữ được nhiều tháng.",
  },
  {
    name: "Bó hoa mix pastel",
    cat: "Hoa sinh nhật",
    price: 620000,
    sale: 560000,
    flower: ["Hoa hồng", "Cúc", "Baby"],
    occ: ["Sinh nhật", "Tốt nghiệp"],
    desc: "Hoa mix tông hồng - tím - trắng.",
  },
  {
    name: "Bó cúc họa mi",
    cat: "Hoa sinh nhật",
    price: 380000,
    flower: ["Cúc họa mi"],
    occ: ["Sinh nhật", "Tốt nghiệp"],
    desc: "Cúc họa mi trắng tinh khôi, giản dị mà dễ thương.",
  },
  {
    name: "Bình hoa ly thơm",
    cat: "Hoa sự kiện",
    price: 720000,
    flower: ["Hoa ly"],
    occ: ["Chúc mừng", "Khai trương"],
    desc: "Ly thơm nở rộ cắm bình thủy tinh.",
  },
  {
    name: "Bó hồng vàng tri ân",
    cat: "Hoa kỷ niệm",
    price: 560000,
    flower: ["Hoa hồng"],
    occ: ["Tri ân", "Kỷ niệm ngày cưới"],
    desc: "Hồng vàng gói giấy nâu, dành cho lời cảm ơn chân thành.",
  },
  {
    name: "Hộp hoa hồng đỏ nhỏ",
    cat: "Hoa tình yêu",
    price: 480000,
    flower: ["Hoa hồng"],
    occ: ["Valentine", "Ngày yêu nhau"],
    desc: "Hộp mini 9 bông hồng đỏ.",
  },
  {
    name: "Bó tulip đa sắc",
    cat: "Hoa sinh nhật",
    price: 760000,
    flower: ["Tulip"],
    occ: ["Sinh nhật"],
    desc: "Tulip nhiều màu, phối lá eucalyptus.",
  },
];

const SETTINGS_SEED = {
  storeName: "Diễm Hương Flowers",
  logo: "",
  phone: "0376796719",
  email: "hello@anniversary-flower.example",
  address: "226A Đoàn Thị Nghiệp, Phường Đạo Thạnh, Đồng Tháp",
  zaloUrl: "https://zalo.me/0376796719",
  messengerUrl: "https://m.me/diem.huong.118458",
  facebookUrl: "https://www.facebook.com/diem.huong.118458",
};

const CONTACT_SEED = [
  {
    customerName: "Nguyễn Thu Hà",
    phone: "0901234567",
    email: "thuha@example.com",
    product: 0,
    message:
      "Mình muốn đặt bó hồng 99 bông giao vào sáng thứ Bảy tuần này, có kèm thiệp được không?",
    status: "PENDING" as const,
    ago: 2 * HOUR,
  },
  {
    customerName: "Trần Minh Khoa",
    phone: "0912345678",
    product: 2,
    message: "Giỏ tulip còn hàng không shop? Mình cần giao tại Quận 7.",
    status: "PENDING" as const,
    ago: 20 * HOUR,
  },
  {
    customerName: "Lê Phương Anh",
    phone: "0987654321",
    email: "phuonganh@example.com",
    message:
      "Shop tư vấn giúp mình hoa tặng kỷ niệm 3 năm yêu nhau, ngân sách khoảng 800k.",
    status: "CONTACTED" as const,
    ago: 2 * DAY,
  },
  {
    customerName: "Phạm Quốc Bảo",
    phone: "0933445566",
    product: 6,
    message: "Cần kệ hoa khai trương cho cửa hàng, giao trước ngày 20.",
    status: "CONTACTED" as const,
    ago: 3 * DAY,
  },
  {
    customerName: "Đặng Ngọc Mai",
    phone: "0977889900",
    email: "ngocmai@example.com",
    product: 1,
    message: "Đã nhận hoa, cảm ơn shop nhiều!",
    status: "COMPLETED" as const,
    ago: 6 * DAY,
  },
];

/* --------------------------------- Các bước -------------------------------- */

async function seedAdmin(): Promise<InitDataResult["admin"]> {
  if ((await Admin.countDocuments()) > 0) return "exists";

  const email = process.env.ADMIN_EMAIL?.trim() || "admin@example.com";
  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    if (isProd()) {
      console.warn(
        "[init-data] Chưa có admin và thiếu ADMIN_PASSWORD -> bỏ qua. Đặt ADMIN_EMAIL/ADMIN_PASSWORD rồi chạy `npm run seed:admin`.",
      );
      return "skipped";
    }
    password = "Admin@12345"; // chỉ cho môi trường dev
    console.warn(
      `[init-data] Dev: tạo admin mặc định ${email} / ${password} (đặt ADMIN_PASSWORD trong .env.local để đổi).`,
    );
  }

  const parsed = adminSeedSchema.safeParse({
    email,
    password,
    fullName: process.env.ADMIN_FULL_NAME ?? "Administrator",
  });
  if (!parsed.success) {
    console.warn(
      "[init-data] Thông tin admin không hợp lệ -> bỏ qua:",
      parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    );
    return "skipped";
  }
  try {
    await Admin.create({
      email: parsed.data.email,
      password: await bcrypt.hash(parsed.data.password, 12),
      fullName: parsed.data.fullName,
      role: "ADMIN",
    });
    return "created";
  } catch (e) {
    if (isDuplicateKeyError(e)) return "exists"; // tiến trình khác vừa tạo
    throw e;
  }
}

async function seedSettings(): Promise<InitDataResult["settings"]> {
  if (await StoreSettings.exists({})) return "exists";
  await StoreSettings.create(SETTINGS_SEED);
  return "created";
}

async function seedCatalog(): Promise<InitDataResult["catalog"]> {
  const [catCount, productCount] = await Promise.all([
    Category.countDocuments(),
    Product.countDocuments(),
  ]);
  if (catCount > 0 || productCount > 0) return "exists";

  const now = Date.now();
  const catIds = new Map<string, string>();
  let categories = 0;
  for (const [i, c] of CATEGORY_SEED.entries()) {
    const slug = slugify(c.name);
    const at = new Date(now - (60 - i) * DAY);
    const doc = await Category.findOneAndUpdate(
      { slug },
      {
        $setOnInsert: {
          name: c.name,
          slug,
          description: c.description,
          isActive: true,
          createdAt: at,
          updatedAt: at,
        },
      },
      { upsert: true, new: true, timestamps: false },
    );
    catIds.set(c.name, String(doc._id));
    categories++;
  }

  let products = 0;
  for (const [i, p] of PRODUCT_SEED.entries()) {
    const slug = slugify(p.name);
    if (await Product.exists({ slug })) continue;
    const at = new Date(now - (PRODUCT_SEED.length - i) * DAY);
    try {
      await Product.create({
        code: await generateProductCode(),
        name: p.name,
        slug,
        description: p.desc,
        price: p.price,
        salePrice: p.sale,
        images: [
          img(p.name),
          img(`${p.name} 2`, "E4EBE1", "6F8068"),
          img(`${p.name} 3`, "FFF8F0", "443B38"),
        ],
        categoryId: catIds.get(p.cat),
        flowerType: p.flower,
        occasion: p.occ,
        availability: p.out ? "OUT_OF_STOCK" : "IN_STOCK",
        isFeatured: !!p.featured,
        isActive: true,
        createdAt: at,
        updatedAt: at,
      });
      products++;
    } catch (e) {
      if (!isDuplicateKeyError(e)) throw e; // tiến trình khác đã tạo sản phẩm này
    }
  }
  return { categories, products };
}

async function seedContacts(): Promise<InitDataResult["contacts"]> {
  if (isProd()) return "skipped"; // không tạo "khách hàng giả" trên dữ liệu thật
  if (await ContactRequest.exists({})) return "exists";
  const products = await Product.find()
    .sort({ createdAt: 1, _id: 1 })
    .select("_id")
    .lean();
  const now = Date.now();
  const docs = CONTACT_SEED.map((c) => ({
    customerName: c.customerName,
    phone: c.phone,
    email: c.email,
    productId: c.product != null ? products[c.product]?._id : undefined,
    message: c.message,
    status: c.status,
    createdAt: new Date(now - c.ago),
  }));
  await ContactRequest.insertMany(docs);
  return docs.length;
}

/* --------------------------------- Điểm vào -------------------------------- */

async function run(): Promise<InitDataResult> {
  if (process.env.INIT_DATA === "off") {
    return {
      skipped: true,
      admin: "skipped",
      settings: "exists",
      catalog: "exists",
      contacts: "skipped",
    };
  }
  await connectDB();
  // Tạo index (kể cả unique) trước khi ghi dữ liệu, để chặn trùng khi nhiều tiến trình cùng seed
  await Promise.all(
    [Admin, Category, Product, StoreSettings, ContactRequest, Counter].map(
      (m) => m.init(),
    ),
  );

  const settings = await seedSettings();
  const admin = await seedAdmin();
  const catalog = await seedCatalog();
  const contacts = await seedContacts();
  return { skipped: false, admin, settings, catalog, contacts };
}

const g = globalThis as typeof globalThis & {
  __initDataPromise?: Promise<InitDataResult>;
};

/** Chạy tối đa một lần mỗi tiến trình (an toàn khi hot-reload). Lỗi được ném ra cho nơi gọi xử lý. */
export function initData(): Promise<InitDataResult> {
  if (!g.__initDataPromise) {
    g.__initDataPromise = run().catch((err) => {
      g.__initDataPromise = undefined; // cho phép thử lại lần sau
      throw err;
    });
  }
  return g.__initDataPromise;
}

export function describeInitResult(r: InitDataResult): string {
  if (r.skipped) return "INIT_DATA=off — bỏ qua.";
  const parts: string[] = [];
  parts.push(`admin: ${r.admin}`);
  parts.push(`cửa hàng: ${r.settings}`);
  parts.push(
    r.catalog === "exists"
      ? "danh mục/sản phẩm: đã có dữ liệu"
      : `danh mục/sản phẩm: tạo ${r.catalog.categories} danh mục, ${r.catalog.products} sản phẩm`,
  );
  parts.push(
    `liên hệ: ${typeof r.contacts === "number" ? `tạo ${r.contacts}` : r.contacts}`,
  );
  return parts.join(" · ");
}
