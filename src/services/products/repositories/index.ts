import { prisma } from "../../../applications/database";
import {
  AddProductRequest,
  EditProductRequest,
  RestockProductRequest,
  ProductResponse,
  toProductResponse,
  LikesCountResponse,
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

    const product = await prisma.product.update({
      where: {
        id,
      },
      data: {
        ...request,
      },
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
