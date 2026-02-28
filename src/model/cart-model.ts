import { Cart, CartItem, CartActivity } from "../../generated/prisma/client";

export type AddCartPayload = {
  name: string;
};

export type DeleteProductFromCartPayload = {
  productId: string;
};

export type AddCartActivityRequest = {
  productId: string;
  productName: string;
  action: string;
};

export type AddProductToCartRequest = {
  productId: string;
  qty: number;
};

export type DeleteProductFromCartRequest = {
  productId: string;
};

export type CartResponse = {
  id: string;
  name: string;
  // ownerId: string;
  ownerUsername?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CartProductItem = {
  id: string;
  productName: string;
  price: number;
  qty: number;
};

export type CartWithProductsResponse = {
  id: string;
  name: string;
  ownerUsername: string;
  products: CartProductItem[];
};

export type CartActivityResponse = {
  username: string;
  productName: string;
  action: string;
  time: Date;
};

export function toCartResponse(cart: Cart): CartResponse {
  return {
    id: cart.id,
    name: cart.name,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}

export function toCartWithProductsResponse(
  cart: Cart & {
    owner: { username: string };
    items: (CartItem & { product: { name: string; price: number } })[];
  },
): CartWithProductsResponse {
  return {
    id: cart.id,
    name: cart.name,
    ownerUsername: cart.owner.username,
    products: cart.items.map((item) => ({
      id: item.productId,
      productName: item.product.name,
      price: item.product.price,
      qty: item.qty,
    })),
  };
}

export function toCartActivityResponse(
  activity: CartActivity,
): CartActivityResponse {
  return {
    username: activity.username,
    productName: activity.productName,
    action: activity.action,
    time: activity.time,
  };
}
