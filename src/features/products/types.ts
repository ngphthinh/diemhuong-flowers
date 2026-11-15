export interface ProductDTO {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;
  images: string[];
  category: { id: string; name: string; slug: string } | null;
  flowerType: string[];
  occasion: string[];
  availability: "IN_STOCK" | "OUT_OF_STOCK";
  isFeatured: boolean;
  createdAt: string;
}

export interface ProductListResult {
  items: ProductDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FilterOptions {
  flowerTypes: string[];
  occasions: string[];
  maxPrice: number;
}
