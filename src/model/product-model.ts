import { Product } from "../../generated/prisma/client";

export type AddProductRequest = {
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: string;
};

export type EditProductRequest = {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  categoryId?: string;
};

export type ProductResponse = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
};

export function toProductResponse(product: Product): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    categoryId: product.categoryId,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}
