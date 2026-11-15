import "server-only";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { ConflictError } from "@/lib/errors";
import { foldVi } from "@/lib/utils";
import { Product } from "@/features/products/model";
import type { AdminInvoiceDTO, AdminInvoiceList } from "./admin-types";
import { Invoice, type IInvoice } from "./model";
import { generateInvoiceCode } from "./repository";
import type { AdminInvoiceQuery, InvoiceInput } from "./schema";

function toDTO(d: IInvoice): AdminInvoiceDTO {
  return {
    id: String(d._id),
    code: d.code,
    customerName: d.customerName,
    customerPhone: d.customerPhone ?? undefined,
    customerAddress: d.customerAddress ?? undefined,
    note: d.note ?? undefined,
    items: d.items.map((i) => ({
      productId: String(i.productId),
      code: i.code,
      name: i.name,
      image: i.image ?? undefined,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
    subtotal: d.subtotal,
    discount: d.discount,
    total: d.total,
    paymentMethod: d.paymentMethod,
    paymentStatus: d.paymentStatus,
    createdBy: d.createdBy,
    createdAt: d.createdAt.toISOString(),
  };
}

/** Lập hóa đơn. Giá/tên/mã sản phẩm luôn lấy lại từ DB ở server (không tin dữ liệu client), rồi lưu snapshot. */
export async function adminCreateInvoice(
  input: InvoiceInput,
  createdBy: string,
): Promise<AdminInvoiceDTO> {
  await connectDB();

  const ids = [...new Set(input.items.map((i) => i.productId))];
  const products = await Product.find({ _id: { $in: ids } }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const items = input.items.map((line) => {
    const p = byId.get(line.productId);
    if (!p)
      throw new ConflictError(
        "Có sản phẩm không còn tồn tại, vui lòng tải lại trang",
        "items",
      );
    const unitPrice = line.unitPrice ?? p.salePrice ?? p.price;
    return {
      productId: p._id,
      code: p.code,
      name: p.name,
      image: p.images[0],
      unitPrice,
      quantity: line.quantity,
      lineTotal: unitPrice * line.quantity,
    };
  });

  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  if (input.discount > subtotal)
    throw new ConflictError(
      "Giảm giá không được lớn hơn tổng tiền hàng",
      "discount",
    );

  const doc = await Invoice.create({
    code: await generateInvoiceCode(),
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerAddress: input.customerAddress,
    note: input.note,
    items,
    subtotal,
    discount: input.discount,
    total: subtotal - input.discount,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentStatus,
    createdBy,
  });
  return toDTO(doc.toObject() as IInvoice);
}

export async function adminListInvoices(
  q: AdminInvoiceQuery,
): Promise<AdminInvoiceList> {
  await connectDB();
  const filter: Record<string, unknown> = {};

  // Tìm không phân biệt dấu theo mã / tên khách / SĐT: lọc ở server ứng dụng rồi mới phân trang (giống sản phẩm).
  if (q.q) {
    const needle = foldVi(q.q);
    const rows = await Invoice.find()
      .select("code customerName customerPhone")
      .lean();
    filter._id = {
      $in: rows
        .filter(
          (r) =>
            foldVi(r.code).includes(needle) ||
            foldVi(r.customerName).includes(needle) ||
            (r.customerPhone ?? "")
              .replace(/\s/g, "")
              .includes(q.q!.replace(/\s/g, "")),
        )
        .map((r) => r._id),
    };
  }

  const [docs, total] = await Promise.all([
    Invoice.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((q.page - 1) * q.pageSize)
      .limit(q.pageSize)
      .lean(),
    Invoice.countDocuments(filter),
  ]);
  return {
    items: docs.map((d) => toDTO(d as IInvoice)),
    total,
    page: q.page,
    pageSize: q.pageSize,
    totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
  };
}

export async function adminGetInvoice(
  id: string,
): Promise<AdminInvoiceDTO | null> {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const doc = await Invoice.findById(id).lean();
  return doc ? toDTO(doc as IInvoice) : null;
}
