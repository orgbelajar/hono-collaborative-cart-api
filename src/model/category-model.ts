import { Category, Product } from "../../generated/prisma/client";
import { toProductResponse, ProductResponse } from "./product-model";

export type CategoryRequest = {
  name: string;
};

export type CategoryResponse = {
  categoryId: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type CategoryWithProductsResponse = {
  categoryId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  products: ProductResponse[];
};

export const toAddCategoryResponse = (category: Category): CategoryResponse => {
  return {
    categoryId: category.id,
    name: category.name,
    createdAt: category.createdAt,
  };
};

export const toGetCategoryByIdResponse = (
  category: Category,
): CategoryResponse => {
  return {
    categoryId: category.id,
    name: category.name,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
};

export const toEditCategoryResponse = (
  category: Category,
): CategoryResponse => {
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
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    products: category.products.map(toProductResponse),
  };
};
