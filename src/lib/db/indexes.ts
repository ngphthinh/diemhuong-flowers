import { Admin } from "@/features/admins/model";
import { Category } from "@/features/categories/model";
import { Product } from "@/features/products/model";
import { StoreSettings } from "@/features/store-settings/model";
import { ContactRequest } from "@/features/contact-requests/model";
import { Counter } from "@/features/counters/model";
import { Invoice } from "@/features/invoices/model";

/** Đồng bộ toàn bộ index đã khai báo trong schema lên MongoDB. */
export async function syncAllIndexes() {
  const models = [
    Admin,
    Category,
    Product,
    StoreSettings,
    ContactRequest,
    Counter,
    Invoice,
  ];
  for (const m of models) {
    await m.syncIndexes();
  }
  return models.map((m) => m.collection.name);
}
