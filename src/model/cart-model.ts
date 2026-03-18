import type {
  Cart,
  CartActivity,
  CartItem,
} from "../../generated/prisma/client";

export type AddCartPayload = {
  name: string;
};

export type AddCartResponse = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
};

export type DeleteProductFromCartPayload = {
  productId: string;
};

export type AddCartActivityRequest = {
  productId: string;
  productName: string;
  qty: number;
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
  ownerUsername?: string;
  createdAt: Date;
};

type CartProductItem = {
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
  qty: number;
  time: Date;
};

export function toCartResponse(cart: Cart): CartResponse {
  return {
    id: cart.id,
    name: cart.name,
    createdAt: cart.createdAt,
  };
}

export function toAddCartResponse(cart: Cart): AddCartResponse {
  return {
    id: cart.id,
    name: cart.name,
    ownerId: cart.ownerId,
    createdAt: cart.createdAt,
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
    qty: activity.qty,
    time: activity.time,
  };
}
