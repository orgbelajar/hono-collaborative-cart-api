import { prisma } from "../../../applications/database";
import {
  AddProductRequest,
  EditProductRequest,
  RestockProductRequest,
  ProductResponse,
  toProductResponse,
  LikesCountResponse,
  GetProductsRequest,
  Pageable,
} from "../../../model/product-model";
import { nanoid } from "nanoid";
import NotFoundError from "../../../exceptions/not-found-error";
import InvariantError from "../../../exceptions/invariant-error";
import { User } from "../../../../generated/prisma/client";

export class ProductRepository {
  static async addProduct(
    request: AddProductRequest,
  ): Promise<ProductResponse> {
    const id = `product-${nanoid(17)}`;

    const product = await prisma.product.create({
      data: {
        id,
        ...request,
      },
    });

    return toProductResponse(product);
  }

  static async getProducts(
    request: GetProductsRequest,
  ): Promise<Pageable<ProductResponse>> {
    const filters: object[] = [];

    if (request.name) {
      filters.push({
        name: {
          contains: request.name,
          mode: "insensitive",
        },
      });
    }

    if (request.min_price) {
      filters.push({
        price: {
          gte: request.min_price,
        },
      });
    }

    if (request.max_price) {
      filters.push({
        price: {
          lte: request.max_price,
        },
      });
    }

    // Filter produk yang hanya tersedia (stock > 0)
    // Jika in_stock = false atau tidak disertakan maka tampilkan semua produk tanpa filter stock, artinya produk yang stock 0 tetap ditampilkan
    // Jika in_stock = true maka tampilkan produk yang stock > 0
    if (request.in_stock) {
      filters.push({
        stock: {
          gt: 0,
        },
      });
    }

    // Filter berdasarkan kategori melalui relasi dengan tabel category
    if (request.category_slug) {
      filters.push({
        category: {
          slug: request.category_slug,
        },
      });
    }

    const skip = (request.page - 1) * request.size;

    const sortBy = request.sort_by ?? "createdAt";
    const sortOrder = request.sort_order ?? "desc";

    const products = await prisma.product.findMany({
      where: {
        AND: filters,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      take: request.size,
      skip: skip,
    });

    const total = await prisma.product.count({
      where: {
        AND: filters,
      },
    });

    return {
      data: products.map(toProductResponse),
      paging: {
        currentPage: request.page,
        totalItem: total,
        totalPages: Math.ceil(total / request.size),
      },
    };
  }

  static async getProductById(id: string): Promise<ProductResponse> {
    const product = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      throw new NotFoundError("Produk tidak ditemukan");
    }

    return toProductResponse(product);
  }

  static async editProductById(
    id: string,
    request: EditProductRequest,
  ): Promise<ProductResponse> {
    await this.getProductById(id);

    const dataToUpdate: EditProductRequest = { ...request };

    const product = await prisma.product.update({
      where: {
        id,
      },
      data: dataToUpdate,
    });

    return toProductResponse(product);
  }

  static async restockProduct(
    id: string,
    request: RestockProductRequest,
  ): Promise<ProductResponse> {
    await this.getProductById(id);

    const product = await prisma.product.update({
      where: { id },
      data: {
        stock: { increment: request.stock },
      },
    });

    return toProductResponse(product);
  }

  static async addImageProductById(
    id: string,
    fileLocation: string,
  ): Promise<void> {
    await this.getProductById(id);

    await prisma.product.update({
      where: {
        id,
      },
      data: {
        image: fileLocation,
      },
    });
  }

  static async deleteProductById(id: string): Promise<void> {
    await this.getProductById(id);

    await prisma.product.delete({
      where: {
        id,
      },
    });
  }

  static async likeProduct(productId: string, credential: User): Promise<void> {
    // Cek produk ada
    await this.getProductById(productId);

    // Cek apakah sudah pernah like
    const existingLike = await prisma.wishlist.findFirst({
      where: {
        userId: credential.id,
        productId,
      },
    });

    if (existingLike) {
      throw new InvariantError("Anda sudah menyukai produk ini");
    }

    const id = `like-${nanoid(17)}`;

    await prisma.wishlist.create({
      data: {
        id,
        userId: credential.id,
        productId,
      },
    });
  }

  static async unlikeProduct(
    productId: string,
    credential: User,
  ): Promise<void> {
    const like = await prisma.wishlist.findFirst({
      where: {
        userId: credential.id,
        productId,
      },
    });

    if (!like) {
      throw new NotFoundError("Anda belum menyukai produk ini");
    }

    await prisma.wishlist.delete({
      where: {
        id: like.id,
      },
    });
  }

  static async getProductLikes(productId: string): Promise<LikesCountResponse> {
    // Cek produk ada + ambil data nama
    const product = await this.getProductById(productId);

    const likes = await prisma.wishlist.count({
      where: {
        productId,
      },
    });

    return { productId, productName: product.name, likes };
  }
}
