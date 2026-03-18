import { Hono } from "hono";
import { authMiddleware } from "../../../middlewares/auth";
import type { ApplicationVariables } from "../../../model/app-model";
import CartRepositories from "../repositories/cart-repositories";
import {
  addCartPayloadSchema,
  addProductToCartPayloadSchema,
  deleteProductFromCartPayloadSchema,
} from "../validator/schema";

export const cartController = new Hono<{ Variables: ApplicationVariables }>();

cartController.use(authMiddleware);

cartController.post("/api/cart", async (c) => {
  const credential = c.get("user");
  const request = addCartPayloadSchema.parse(await c.req.json());

  const response = await CartRepositories.addCart(credential, request);

  return c.json(
    {
      status: "success",
      message: "Keranjang belanja berhasil ditambahkan",
      data: response,
    },
    201,
  );
});

cartController.get("/api/carts", async (c) => {
  const credential = c.get("user");
  const response = await CartRepositories.getCarts(credential);

  return c.json(
    {
      status: "success",
      data: response,
    },
    200,
  );
});

cartController.delete("/api/cart/:id", async (c) => {
  const cartId = c.req.param("id");
  const credential = c.get("user");

  await CartRepositories.verifyCartOwner(cartId, credential);
  await CartRepositories.deleteCartById(cartId);

  return c.json(
    {
      status: "success",
      message: "Keranjang belanja berhasil dihapus",
    },
    200,
  );
});

// Done
cartController.post("/api/cart/:id/product", async (c) => {
  const request = addProductToCartPayloadSchema.parse(await c.req.json());
  const cartId = c.req.param("id");
  const credential = c.get("user");

  await CartRepositories.verifyCartAccess(cartId, credential);

  await CartRepositories.addProductToCart(cartId, credential, request);

  return c.json(
    {
      status: "success",
      message: "Produk berhasil ditambahkan ke keranjang belanja",
    },
    201,
  );
});

// Done
cartController.get("/api/cart/:id/products", async (c) => {
  const cartId = c.req.param("id");
  const credential = c.get("user");

  await CartRepositories.verifyCartAccess(cartId, credential);

  const response = await CartRepositories.getProductsFromCart(cartId);

  return c.json(
    {
      status: "success",
      data: response,
    },
    200,
  );
});

// Done
cartController.delete("/api/cart/:id/products", async (c) => {
  const request = deleteProductFromCartPayloadSchema.parse(await c.req.json());
  const cartId = c.req.param("id");
  const credential = c.get("user");

  await CartRepositories.verifyCartAccess(cartId, credential);

  await CartRepositories.deleteProductFromCart(cartId, credential, request);

  return c.json(
    {
      status: "success",
      message: "Produk berhasil dihapus dari keranjang belanja",
    },
    200,
  );
});

// Done
cartController.get("/api/cart/:id/activities", async (c) => {
  const cartId = c.req.param("id");
  const credential = c.get("user");

  await CartRepositories.verifyCartAccess(cartId, credential);

  const response = await CartRepositories.getCartActivities(cartId);

  return c.json(
    {
      status: "success",
      data: response,
    },
    200,
  );
});
