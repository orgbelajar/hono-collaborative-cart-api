import { prisma } from "../../../applications/database";
import NotFoundError from "../../../exceptions/not-found-error";
import {
  CategoryRequest,
  CategoryResponse,
  toAddCategoryResponse,
  toEditCategoryResponse,
  toGetCategoryByIdResponse,
} from "../../../model/category-model";
import { nanoid } from "nanoid";

export class CategoryRepositories {
  static async addCategory(
    request: CategoryRequest,
  ): Promise<CategoryResponse> {
    const id = `category-${nanoid(17)}`;

    const category = await prisma.category.create({
      data: {
        id,
        ...request,
      },
    });

    return toAddCategoryResponse(category);
  }

  static async getCategoryById(id: string): Promise<CategoryResponse> {
    const category = await prisma.category.findUnique({
      where: {
        id,
      },
    });

    if (!category) {
      throw new NotFoundError("Kategori produk tidak ditemukan");
    }

    return toGetCategoryByIdResponse(category);
  }

  static async editCategoryById(
    id: string,
    request: CategoryRequest,
  ): Promise<CategoryResponse> {
    const category = await prisma.category.update({
      where: {
        id,
      },
      data: request,
    });

    return toEditCategoryResponse(category);
  }

  static async deleteCategoryById(id: string): Promise<void> {
    await this.getCategoryById(id);

    await prisma.category.delete({
      where: {
        id,
      },
    });
  }
}
