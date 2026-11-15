export interface AdminProductDTO {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;
  images: string[];
  categoryId: string;
  categoryName: string;
  flowerType: string[];
  occasion: string[];
  availability: "IN_STOCK" | "OUT_OF_STOCK";
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductList {
  items: AdminProductDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
