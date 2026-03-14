import { prisma } from "../../../applications/database";
import {
  AddProductRequest,
  EditProductRequest,
  RestockProductRequest,
  ProductResponse,
  ProductDetailResponse,
  toProductResponse,
  GetProductsRequest,
  Pageable,
  WishlistCountResponse,
  toProductDetailResponse,
  ProductUpdatedResponse,
  toProductUpdatedResponse,
  ProductCreatedResponse,
  toProductCreatedResponse,
} from "../../../model/product-model";
import { nanoid } from "nanoid";
import NotFoundError from "../../../exceptions/not-found-error";
import InvariantError from "../../../exceptions/invariant-error";
import { User } from "../../../../generated/prisma/client";
import cacheService from "../../../cache/redis-server";

export default class ProductRepository {
  static async addProduct(
    request: AddProductRequest,
  ): Promise<ProductCreatedResponse> {
    const id = `product-${nanoid(17)}`;

    const product = await prisma.product.create({
      data: {
        id,
        ...request,
      },
    });

    return toProductCreatedResponse(product);
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
    // Jika in_stock = false maka tampilkan semua produk tanpa filter stock, artinya produk yang stock 0 tetap ditampilkan
    // Jika in_stock = true maka tampilkan produk yang stock > 0
    if (request.in_stock) {
      filters.push({
        stock: {
          gt: 0,
        },
      });
    }

    // Filter berdasarkan kategori melalui relasi dengan tabel category
    // JOIN categories c ON p."categoryId" = c.id WHERE c.slug = '....'
    if (request.category_slug) {
      filters.push({
        category: {
          slug: request.category_slug, // example slug: 'electronics'
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

  static async getProductById(id: string): Promise<ProductDetailResponse> {
    const product = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      throw new NotFoundError("Produk tidak ditemukan");
    }

    return toProductDetailResponse(product);
  }

  static async editProductById(
    id: string,
    request: EditProductRequest,
  ): Promise<ProductUpdatedResponse> {
    await this.getProductById(id);

    const dataToUpdate: EditProductRequest = { ...request };

    const product = await prisma.product.update({
      where: {
        id,
      },
      data: dataToUpdate,
    });

    return toProductUpdatedResponse(product);
  }

  static async restockProduct(
    id: string,
    request: RestockProductRequest,
  ): Promise<ProductUpdatedResponse> {
    await this.getProductById(id);

    const product = await prisma.product.update({
      where: { id },
      data: {
        stock: { increment: request.stock },
      },
    });

    return toProductUpdatedResponse(product);
  }

  static async addOrUpdateImageProductById(
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

  static async wishlistProduct(
    productId: string,
    credential: User,
  ): Promise<void> {
    // Cek produk ada
    await this.getProductById(productId);

    // Cek apakah sudah pernah wishlist
    const existingWishlist = await prisma.wishlist.findFirst({
      where: {
        userId: credential.id,
        productId,
      },
    });

    if (existingWishlist) {
      throw new InvariantError("Anda sudah memasukkan produk ini ke wishlist");
    }

    const id = `wishlist-${nanoid(17)}`;

    await prisma.wishlist.create({
      data: {
        id,
        userId: credential.id,
        productId,
      },
    });

    cacheService.delete(`product-wishlist:${productId}`);
  }

  static async removeFromWishlist(
    productId: string,
    credential: User,
  ): Promise<void> {
    const wishlist = await prisma.wishlist.findFirst({
      where: {
        userId: credential.id,
        productId,
      },
    });

    if (!wishlist) {
      throw new NotFoundError("Anda belum memasukkan produk ini ke wishlist");
    }

    await prisma.wishlist.delete({
      where: {
        id: wishlist.id,
      },
    });

    cacheService.delete(`product-wishlist:${productId}`);
  }

  static async getProductWishlist(
    productId: string,
  ): Promise<WishlistCountResponse> {
    const cacheKey = `product-wishlist:${productId}`;

    try {
      const raw = await cacheService.get(cacheKey);
      const result = JSON.parse(raw);
      const source = 'cache';
      return { ...result, source };
    } catch {
      // Cache miss, get from database
      const product = await this.getProductById(productId);

      const wishlist = await prisma.wishlist.count({
        where: {
          productId,
        },
      });

      const source = 'server';

      await cacheService.set(cacheKey, JSON.stringify({ productId, productName: product.name, wishlist }));

      return { productId, productName: product.name, wishlist, source };
    }
  }
}
