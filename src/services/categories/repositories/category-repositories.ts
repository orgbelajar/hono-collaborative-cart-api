import { prisma } from "../../../applications/database";
import NotFoundError from "../../../exceptions/not-found-error";
import InvariantError from "../../../exceptions/invariant-error";
import {
  CategoryRequest,
  CategoryResponse,
  CategoryWithProductsResponse,
  toAddCategoryResponse,
  toEditCategoryResponse,
  toGetCategoryByIdResponse,
  toGetCategoryWithProductsResponse,
} from "../../../model/category-model";
import { nanoid } from "nanoid";
import slugify from "slugify";

export class CategoryRepositories {
  static async addCategory(
    request: CategoryRequest,
  ): Promise<CategoryResponse> {
    const id = `category-${nanoid(17)}`;

    const baseSlug = slugify(request.name, { lower: true });
    const slug = `${baseSlug}-${id.slice(-5)}`;

    const category = await prisma.category.create({
      data: {
        id,
        slug,
        ...request,
      },
    });

    return toAddCategoryResponse(category);
  }

  static async getCategoryById(id: string): Promise<void> {
    const category = await prisma.category.findUnique({
      where: {
        id,
      },
    });

    if (!category) {
      throw new NotFoundError("Kategori produk tidak ditemukan");
    }
  }

  static async getCategories(): Promise<CategoryResponse[]> {
    const categories = await prisma.category.findMany();

    return categories.map(toGetCategoryByIdResponse);
  }

  static async getCategoryWithProductsById(
    id: string,
  ): Promise<CategoryWithProductsResponse> {
    const category = await prisma.category.findUnique({
      where: {
        id,
      },
      include: {
        products: true,
      },
    });

    if (!category) {
      throw new NotFoundError("Kategori produk tidak ditemukan");
    }

    return toGetCategoryWithProductsResponse(category);
  }

  static async editCategoryById(
    id: string,
    request: CategoryRequest,
  ): Promise<CategoryResponse> {
    await this.getCategoryById(id);

    const baseSlug = slugify(request.name, { lower: true });
    const slug = `${baseSlug}-${id.slice(-5)}`;

    const category = await prisma.category.update({
      where: {
        id,
      },
      data: {
        ...request,
        slug,
      },
    });

    return toEditCategoryResponse(category);
  }

  static async deleteCategoryById(id: string): Promise<void> {
    await this.getCategoryById(id);

    // Cek apakah masih ada produk di kategori ini
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw new InvariantError(
        "Kategori tidak dapat dihapus karena masih memiliki produk",
      );
    }

    await prisma.category.delete({
      where: {
        id,
      },
    });
  }
}
