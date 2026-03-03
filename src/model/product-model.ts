import { Product } from "../../generated/prisma/client";

export type AddProductRequest = {
  name: string;
  description?: string;
  image?: string;
  price: number;
  stock: number;
  categoryId: string;
};

export type EditProductRequest = {
  name?: string;
  description?: string;
  image?: string;
  price?: number;
  categoryId?: string;
};

export type RestockProductRequest = {
  stock: number;
};

export type GetProductsRequest = {
  // Paginasi
  page: number;
  size: number;

  // Pencarian
  name?: string;

  // Filter
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;

  category_slug?: string;

  // Sorting
  sort_by?: "price" | "name" | "createdAt";
  sort_order?: "asc" | "desc";
};

export type ProductResponse = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  price: number;
  stock: number;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type LikesCountResponse = {
  productId: string;
  productName: string;
  likes: number;
};

export function toProductResponse(product: Product): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    image: product.image,
    price: product.price,
    stock: product.stock,
    categoryId: product.categoryId,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export type Pageable<T> = {
  data: T[];
  paging: {
    currentPage: number;
    totalItem: number;
    totalPages: number;
  };
};
