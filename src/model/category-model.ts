import type { Category, Product } from "../../generated/prisma/client";
import { type ProductResponse, toProductResponse } from "./product-model";

export type CategoryRequest = {
  name: string;
};

export type CategoryResponse = {
  categoryId: string;
  name: string;
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type CategoryWithProductsResponse = {
  categoryId: string;
  name: string;
  slug?: string;
  createdAt: Date;
  updatedAt: Date;
  products: ProductResponse[];
};

export const toAddCategoryResponse = (category: Category): CategoryResponse => {
  return {
    categoryId: category.id,
    name: category.name,
    slug: category.slug,
    createdAt: category.createdAt,
  };
};

export const toGetCategoryByIdResponse = (category: Category): CategoryResponse => {
  return {
    categoryId: category.id,
    name: category.name,
    slug: category.slug,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
};

export const toEditCategoryResponse = (category: Category): CategoryResponse => {
  return {
    categoryId: category.id,
    name: category.name,
    updatedAt: category.updatedAt,
  };
};

export const toGetCategoryWithProductsResponse = (
  category: Category & { products: Product[] },
): CategoryWithProductsResponse => {
  return {
    categoryId: category.id,
    name: category.name,
    slug: category.slug,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    products: category.products.map(toProductResponse),
  };
};
