import "server-only";
import { connectDB } from "@/lib/db/mongoose";
import { Category } from "@/features/categories/model";
import { adminListContacts, type AdminContactDTO } from "@/features/contact-requests/admin-service";
import { ContactRequest } from "@/features/contact-requests/model";
import { adminListProducts } from "@/features/products/admin-service";
import type { AdminProductDTO } from "@/features/products/admin-types";
import { Product } from "@/features/products/model";

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  outOfStockProducts: number;
  totalCategories: number;
  pendingContacts: number;
  latestProducts: AdminProductDTO[];
  recentContacts: AdminContactDTO[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await connectDB();
  const [totalProducts, activeProducts, outOfStockProducts, totalCategories, pendingContacts, latest, recent] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ availability: "OUT_OF_STOCK" }),
    Category.countDocuments(),
    ContactRequest.countDocuments({ status: "PENDING" }),
    adminListProducts({ sort: "newest", page: 1, pageSize: 5 }),
    adminListContacts({ page: 1, pageSize: 5 }),
  ]);
  return {
    totalProducts,
    activeProducts,
    outOfStockProducts,
    totalCategories,
    pendingContacts,
    latestProducts: latest.items,
    recentContacts: recent.items,
  };
}
