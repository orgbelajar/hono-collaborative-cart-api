import { prisma } from "../../../applications/database";
import {
  AddCartRequest,
  AddProductToCartRequest,
  CartResponse,
  CartWithProductsResponse,
  CartActivityResponse,
  CartsRequest,
  CartIdRequest,
  toCartResponse,
  toCartWithProductsResponse,
  toCartActivityResponse,
  DeleteProductFromCartRequest,
  GetCartActivitiesRequest,
  AddCartActivityRequest,
  VerifyCartOwnerRequest,
  VerifyCartAccessRequest,
} from "../../../model/cart-model";
import { nanoid } from "nanoid";
import NotFoundError from "../../../exceptions/not-found-error";
import InvariantError from "../../../exceptions/invariant-error";
import AuthorizationError from "../../../exceptions/authorization-error";
import { CollaborationRepositories } from "../../collaborations/repositories/index";

export class CartRepositories {
  // Done
  static async verifyCartOwner(
    request: VerifyCartOwnerRequest,
  ): Promise<CartResponse> {
    const cart = await prisma.cart.findUnique({
      where: { id: request.id },
    });

    if (!cart) {
      throw new NotFoundError("Cart tidak ditemukan");
    }

    if (cart.ownerId !== request.ownerId) {
      throw new AuthorizationError("Anda tidak berhak mengakses cart ini");
    }

    return toCartResponse(cart);
  }

  // Done
  static async verifyCartAccess(
    request: VerifyCartAccessRequest,
  ): Promise<boolean> {
    const ownerResult = await this.verifyCartOwner({
      id: request.cartId,
      ownerId: request.userId,
    });

    if (ownerResult) {
      return true;
    }

    const collaboratorResult =
      await CollaborationRepositories.verifyCollaborator({
        cartId: request.cartId,
        userId: request.userId,
      });

    return collaboratorResult;
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
  static async addCart(request: AddCartRequest): Promise<CartResponse> {
    const id = `cart-${nanoid(16)}`;

    const cart = await prisma.cart.create({
      data: {
        id,
        ...request,
      },
    });

    return toCartResponse(cart);
  }

  // Done
  static async getCarts(request: CartsRequest): Promise<CartResponse[]> {
    const carts = await prisma.cart.findMany({
      where: {
        OR: [
          // Kondisi 1: user adalah owner
          { ownerId: request.ownerId },
          // Kondisi 2: user adalah kolaborator
          {
            collaborators: {
              some: {
                userId: request.ownerId,
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
      ...toCartResponse(cart),
      ownerUsername: cart.owner.username, // Menambahkan info username
    }));
  }

  // Done
  static async deleteCartById(request: CartIdRequest): Promise<void> {
    const cart = await prisma.cart.delete({
      where: { id: request.id },
    });

    if (!cart) {
      throw new NotFoundError("Cart tidak ditemukan");
    }
  }

  // Done
  static async addProductToCart(
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
      where: { cartId: request.cartId, productId: request.productId },
    });

    if (existingItem) {
      // 3a. Jika sudah ada → update qty (tambahkan)
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { qty: existingItem.qty + request.qty },
      });
    } else {
      const id = `cartItem-${nanoid(17)}`;

      await prisma.cartItem.create({
        data: {
          id,
          ...request,
        },
      });
    }

    await prisma.product.update({
      where: { id: request.productId },
      data: { stock: product.stock - request.qty },
    });
  }

  // Done
  static async getProductsFromCart(
    request: CartIdRequest,
  ): Promise<CartWithProductsResponse> {
    const cart = await prisma.cart.findUnique({
      where: { id: request.id },
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
    request: DeleteProductFromCartRequest,
  ): Promise<void> {
    // Cari item berdasarkan cartId + productId
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: request.cartId,
        productId: request.productId,
      },
    });

    if (!cartItem) {
      throw new NotFoundError("Produk di dalam cart tidak ditemukan");
    }

    if (cartItem.qty > 1) {
      // Jika qty lebih dari 1 → kurangi 1
      await prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { qty: cartItem.qty - 1 },
      });
    } else {
      // Jika qty = 1 → hapus item dari keranjang
      await prisma.cartItem.delete({
        where: { id: cartItem.id },
      });
    }
    // Kembalikan stok produk (+1)
    await prisma.product.update({
      where: { id: request.productId },
      data: { stock: { increment: 1 } },
    });
  }

  // Done
  static async getCartActivities(
    request: GetCartActivitiesRequest,
  ): Promise<CartActivityResponse[]> {
    const activities = await prisma.cartActivity.findMany({
      where: { cartId: request.cartId },
      include: {
        user: {
          select: { username: true },
        },
        product: {
          select: { name: true },
        },
      },
      orderBy: { time: "asc" },
    });

    return activities.map(toCartActivityResponse);
  }
}
