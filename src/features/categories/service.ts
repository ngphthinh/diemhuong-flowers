import { connectDB } from "@/lib/db/mongoose";
import { Category } from "./model";

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export async function listActiveCategories(): Promise<CategoryDTO[]> {
  await connectDB();
  const docs = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
  return docs.map((c) => ({ id: String(c._id), name: c.name, slug: c.slug, description: c.description }));
}
