import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { notifyAdmin } from "@/lib/mailer";
import { Product } from "@/features/products/model";
import { ContactRequest } from "./model";
import type { ContactRequestInput } from "./schema";

export async function createContactRequest(input: ContactRequestInput) {

  await connectDB();

  let productLabel = "";
  let productId: string | undefined;
  if (input.productId && isValidObjectId(input.productId)) {
    const product = await Product.findById(input.productId).select("name code").lean();
    if (product) {
      productId = String(product._id);
      productLabel = `${product.name} (${product.code})`;
    }
  }

  const doc = await ContactRequest.create({
    customerName: input.customerName,
    phone: input.phone,
    email: input.email,
    productId,
    message: input.message,
  });

  // Email là best-effort: lỗi SMTP không làm hỏng yêu cầu của khách (đã lưu DB)
  await notifyAdmin({
    subject: `Yêu cầu tư vấn mới từ ${input.customerName}`,
    replyTo: input.email,
    text: [
      `Khách hàng: ${input.customerName}`,
      `Số điện thoại: ${input.phone}`,
      `Email: ${input.email ?? "(không có)"}`,
      `Sản phẩm quan tâm: ${productLabel || "(không chọn)"}`,
      "",
      "Lời nhắn:",
      input.message,
    ].join("\n"),
  });

  return { id: String(doc._id) };
}
