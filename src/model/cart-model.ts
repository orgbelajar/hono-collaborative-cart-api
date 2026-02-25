import { Cart, CartItem, CartActivity } from "../../generated/prisma/client";

export type AddCartRequest = {
  name: string;
  ownerId: string;
};

export type AddCartActivityRequest = {
  cartId: string;
  productId: string;
  userId: string;
  action: string;
};

export type GetCartActivitiesRequest = {
  cartId: string;
};

export type AddProductToCartRequest = {
  cartId: string;
  productId: string;
  qty: number;
};

export type DeleteProductFromCartRequest = {
  cartId: string;
  productId: string;
};

export type VerifyCartOwnerRequest = {
  id: string;
  ownerId: string;
};

export type VerifyCartAccessRequest = {
  cartId: string;
  userId: string;
};

export type CartsRequest = {
  ownerId: string;
};

export type CartIdRequest = {
  id: string;
};

export type CartResponse = {
  id: string;
  name: string;
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
  activity: CartActivity & {
    user: { username: string };
    product: { name: string };
  },
): CartActivityResponse {
  return {
    username: activity.user.username,
    productName: activity.product.name,
    action: activity.action,
    time: activity.time,
  };
}
