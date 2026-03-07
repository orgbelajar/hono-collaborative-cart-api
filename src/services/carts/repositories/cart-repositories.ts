import { prisma } from "../../../applications/database";
import {
  AddProductToCartRequest,
  CartResponse,
  CartWithProductsResponse,
  CartActivityResponse,
  toCartResponse,
  toCartWithProductsResponse,
  toCartActivityResponse,
  DeleteProductFromCartRequest,
  AddCartActivityRequest,
  AddCartPayload,
  AddCartResponse,
  toAddCartResponse,
} from "../../../model/cart-model";
import { nanoid } from "nanoid";
import NotFoundError from "../../../exceptions/not-found-error";
import InvariantError from "../../../exceptions/invariant-error";
import AuthorizationError from "../../../exceptions/authorization-error";
import { CollaborationRepositories } from "../../collaborations/repositories/collaboration-repositories";
import { User } from "../../../../generated/prisma/client";

export class CartRepositories {
  // Done
  static async verifyCartOwner(
    cartId: string,
    credential: User,
  ): Promise<void> {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
    });

    if (!cart) {
      throw new NotFoundError("Keranjang belanja tidak ditemukan");
    }

    if (cart.ownerId !== credential.id) {
      throw new AuthorizationError(
        "Anda tidak berhak mengakses keranjang belanja ini",
      );
    }

    // return toCartResponse(cart);
  }

  // Done
  static async verifyCartAccess(
    cartId: string,
    credential: User,
  ): Promise<void> {
    try {
      // Cek apakah dia owner
      await this.verifyCartOwner(cartId, credential);
      // error berisi AuthorizationError dari pengecekan owner
    } catch (error) {
      // Jika bukan owner (AuthorizationError) dan cart tidak ditemukan akan throw NotFoundError
      if (error instanceof NotFoundError) {
        throw error;
      }

      try {
        // Jika bukan owner dan cart ditemukan, cek apakah dia collaborator
        await CollaborationRepositories.verifyCollaborator(cartId, credential);
      } catch {
        // Jika bukan collaborator, lempar error asli dari pengecekan owner (AuthorizationError)
        throw error;
      }
    }
  }

  // Done
  static async addCartActivities(
    cartId: string,
    credential: User,
    request: AddCartActivityRequest,
  ): Promise<void> {
    const id = `activity-${nanoid(17)}`;

    await prisma.cartActivity.create({
      data: {
        id,
        cartId,
        userId: credential.id,
        username: credential.username,
        ...request,
      },
    });
  }

  // Done
  static async addCart(
    credential: User,
    request: AddCartPayload,
  ): Promise<AddCartResponse> {
    const id = `cart-${nanoid(16)}`;

    const data = {
      id,
      ownerId: credential.id,
      ...request,
    };

    const cart = await prisma.cart.create({
      data: data,
    });

    return toAddCartResponse(cart);
  }

  // Done
  static async getCarts(credential: User): Promise<CartResponse[]> {
    const carts = await prisma.cart.findMany({
      where: {
        OR: [
          // Kondisi 1: user adalah owner
          { ownerId: credential.id },
          // Kondisi 2: user adalah kolaborator
          {
            collaborators: {
              some: {
                userId: credential.id,
              },
            },
          },
        ],
      },
      // Mengambil data relasi (seperti JOIN di SQL)
      // include relasi "owner"
      include: {
        owner: {
          select: {
            username: true,
          },
        },
      },
    });
    // Karena mengambil username, maka perlu menyesuaikan mapping response-nya
    return carts.map((cart) => ({
      ...toCartResponse(cart), // id, name, createdAt, updatedAt
      ownerUsername: cart.owner.username, // Menambahkan info username
    }));
  }

  // Done
  static async deleteCartById(cartId: string): Promise<void> {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          select: { productId: true, qty: true },
        },
      },
    });

    if (!cart) {
      throw new NotFoundError("Keranjang belanja tidak ditemukan");
    }

    // Kembalikan stok semua produk yang ada di dalam keranjang
    for (const item of cart.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.qty } },
      });
    }

    await prisma.cart.delete({
      where: { id: cartId },
    });
  }

  // Done
  static async addProductToCart(
    cartId: string,
    credential: User,
    request: AddProductToCartRequest,
  ): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { id: request.productId },
    });

    if (!product) {
      throw new NotFoundError("Produk tidak ditemukan");
    }

    if (product.stock < request.qty) {
      throw new InvariantError("Stok produk tidak mencukupi");
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId, productId: request.productId },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { qty: existingItem.qty + request.qty },
      });
    } else {
      const id = `cartItem-${nanoid(17)}`;

      await prisma.cartItem.create({
        data: {
          id,
          cartId,
          ...request,
        },
      });
    }

    await prisma.product.update({
      where: { id: request.productId },
      data: { stock: product.stock - request.qty },
    });

    await this.addCartActivities(cartId, credential, {
      productId: product.id,
      productName: product.name,
      qty: request.qty,
      action: "add",
    });
  }

  // Done
  static async getProductsFromCart(
    cartId: string,
  ): Promise<CartWithProductsResponse> {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        owner: {
          select: { username: true },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      throw new NotFoundError("Keranjang belanja tidak ditemukan");
    }

    return toCartWithProductsResponse(cart);
  }

  // Done
  static async deleteProductFromCart(
    cartId: string,
    credential: User,
    request: DeleteProductFromCartRequest,
  ): Promise<void> {
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        cartId,
        productId: request.productId,
      },
      include: { product: { select: { name: true } } },
    });

    if (!cartItem) {
      throw new NotFoundError(
        "Produk di dalam keranjang belanja tidak ditemukan",
      );
    }

    if (cartItem.qty > 1) {
      await prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { qty: cartItem.qty - 1 },
      });
    } else {
      await prisma.cartItem.delete({
        where: { id: cartItem.id },
      });
    }

    await prisma.product.update({
      where: { id: request.productId },
      data: { stock: { increment: 1 } },
    });

    await this.addCartActivities(cartId, credential, {
      productId: request.productId,
      productName: cartItem.product.name,
      qty: 1,
      action: "delete",
    });
  }

  // Done
  static async getCartActivities(
    cartId: string,
  ): Promise<CartActivityResponse[]> {
    const activities = await prisma.cartActivity.findMany({
      where: { cartId },
      orderBy: { time: "asc" },
    });

    return activities.map(toCartActivityResponse);
  }
}
