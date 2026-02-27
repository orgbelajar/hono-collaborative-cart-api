import { prisma } from "../../../applications/database";
import {
  AddProductToCartRequest,
  CartResponse,
  CartWithProductsResponse,
  CartActivityResponse,
  CartIdRequest,
  toCartResponse,
  toCartWithProductsResponse,
  toCartActivityResponse,
  DeleteProductFromCartRequest,
  GetCartActivitiesRequest,
  AddCartActivityRequest,
  VerifyCartOwnerRequest,
  VerifyCartAccessRequest,
  AddCartPayload,
} from "../../../model/cart-model";
import { nanoid } from "nanoid";
import NotFoundError from "../../../exceptions/not-found-error";
import InvariantError from "../../../exceptions/invariant-error";
import AuthorizationError from "../../../exceptions/authorization-error";
import { CollaborationRepositories } from "../../collaborations/repositories/index";
import { User } from "../../../../generated/prisma/client";

export class CartRepositories {
  // Done
  static async verifyCartOwner(request: VerifyCartOwnerRequest): Promise<void> {
    const cart = await prisma.cart.findUnique({
      where: { id: request.cartId },
    });

    if (!cart) {
      throw new NotFoundError("Cart tidak ditemukan");
    }

    if (cart.ownerId !== request.ownerId) {
      throw new AuthorizationError("Anda tidak berhak mengakses cart ini");
    }

    // return toCartResponse(cart);
  }

  // Done
  static async verifyCartAccess(
    request: VerifyCartAccessRequest,
  ): Promise<void> {
    try {
      // Cek apakah dia owner
      await this.verifyCartOwner({
        cartId: request.cartId,
        ownerId: request.userId,
      });
      // error berisi AuthorizationError dari pengecekan owner
    } catch (error) {
      // Jika bukan owner (AuthorizationError) dan cart tidak ditemukan akan throw NotFoundError
      if (error instanceof NotFoundError) {
        throw error;
      }

      try {
        // Jika bukan owner dan cart ditemukan, cek apakah dia collaborator
        await CollaborationRepositories.verifyCollaborator(request);
      } catch {
        // Jika bukan collaborator, lempar error asli dari pengecekan owner (AuthorizationError)
        throw error;
      }
    }
  }

  // Done
  static async addCartActivities(
    request: AddCartActivityRequest,
  ): Promise<void> {
    const id = `activity-${nanoid(17)}`;

    await prisma.cartActivity.create({
      data: {
        id,
        ...request,
      },
    });
  }

  // Done
  static async addCart(
    ownerId: User,
    request: AddCartPayload,
  ): Promise<{ cartId: string }> {
    const id = `cart-${nanoid(16)}`;

    const data = {
      id,
      ownerId: ownerId.id,
      ...request,
    };

    const cart = await prisma.cart.create({
      data: data,
    });

    return { cartId: cart.id };
  }

  // Done
  static async getCarts(ownerId: User): Promise<CartResponse[]> {
    const carts = await prisma.cart.findMany({
      where: {
        OR: [
          // Kondisi 1: user adalah owner
          { ownerId: ownerId.id },
          // Kondisi 2: user adalah kolaborator
          {
            collaborators: {
              some: {
                userId: ownerId.id,
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
  static async deleteCartById(request: CartIdRequest): Promise<void> {
    const cart = await prisma.cart.delete({
      where: { id: request.cartId },
    });

    if (!cart) {
      throw new NotFoundError("Cart tidak ditemukan");
    }
  }

  // Done
  static async addProductToCart(
    cartId: string,
    userId: string,
    username: string,
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

    await this.addCartActivities({
      cartId,
      productId: product.id,
      productName: product.name,
      userId,
      username,
      action: "add",
    });
  }

  // Done
  static async getProductsFromCart(
    request: CartIdRequest,
  ): Promise<CartWithProductsResponse> {
    const cart = await prisma.cart.findUnique({
      where: { id: request.cartId },
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
      throw new NotFoundError("Cart tidak ditemukan");
    }

    return toCartWithProductsResponse(cart);
  }

  // Done
  static async deleteProductFromCart(
    userId: string,
    username: string,
    request: DeleteProductFromCartRequest,
  ): Promise<void> {
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: request.cartId,
        productId: request.productId,
      },
      include: { product: { select: { name: true } } },
    });

    if (!cartItem) {
      throw new NotFoundError("Produk di dalam cart tidak ditemukan");
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

    await this.addCartActivities({
      cartId: request.cartId,
      productId: request.productId,
      productName: cartItem.product.name,
      userId,
      username,
      action: "delete",
    });
  }

  // Done
  static async getCartActivities(
    request: GetCartActivitiesRequest,
  ): Promise<CartActivityResponse[]> {
    const activities = await prisma.cartActivity.findMany({
      where: { cartId: request.cartId },
      orderBy: { time: "asc" },
    });

    return activities.map(toCartActivityResponse);
  }
}
