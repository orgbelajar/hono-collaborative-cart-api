import { Hono } from "hono";
import { CartRepositories } from "../repositories/index";
import {
  addCartPayloadSchema,
  addProductToCartPayloadSchema,
  deleteProductFromCartPayloadSchema,
} from "../validator/index";
import { authMiddleware } from "../../../middlewares/auth";
import { User } from "../../../../generated/prisma/client";
import { ApplicationVariables } from "../../../model/app-model";

export const cartController = new Hono<{ Variables: ApplicationVariables }>();

cartController.use(authMiddleware);

cartController.post("/api/cart", async (c) => {
  const user = c.get("user") as User; // from authMiddleware c.set("user", { id: user.id });, example: "user-9pW6MNVi_7wgGI2js"
  const request = addCartPayloadSchema.parse(await c.req.json());

  const response = await CartRepositories.addCart(user, request);

  return c.json(
    {
      status: "success",
      message: "Cart berhasil ditambahkan",
      data: response,
    },
    201,
  );
});

cartController.get("/api/carts", async (c) => {
  const user = c.get("user") as User;
  const response = await CartRepositories.getCarts(user);

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
  const user = c.get("user") as User;

  await CartRepositories.verifyCartOwner({
    cartId,
    ownerId: user.id,
  });
  await CartRepositories.deleteCartById({ cartId });

  return c.json(
    {
      status: "success",
      message: "Cart berhasil dihapus",
    },
    200,
  );
});

// Done
cartController.post("/api/cart/:id/product", async (c) => {
  const request = addProductToCartPayloadSchema.parse(await c.req.json());
  const cartId = c.req.param("id");
  const user = c.get("user") as User;

  await CartRepositories.verifyCartAccess({
    cartId,
    userId: user.id,
  });

  await CartRepositories.addProductToCart(
    cartId,
    user.id,
    user.username,
    request,
  );

  return c.json(
    {
      status: "success",
      message: "Produk berhasil ditambahkan ke cart",
    },
    201,
  );
});

// Done
cartController.get("/api/cart/:id/products", async (c) => {
  const cartId = c.req.param("id");
  const user = c.get("user") as User;

  await CartRepositories.verifyCartAccess({
    cartId,
    userId: user.id,
  });

  const response = await CartRepositories.getProductsFromCart({ cartId });

  return c.json(
    {
      status: "success",
      data: response,
    },
    200,
  );
});

// Done
cartController.delete("/api/carts/:id/products", async (c) => {
  const request = deleteProductFromCartPayloadSchema.parse(await c.req.json());
  const cartId = c.req.param("id");
  const user = c.get("user") as User;

  await CartRepositories.verifyCartAccess({
    cartId,
    userId: user.id,
  });

  await CartRepositories.deleteProductFromCart(user.id, user.username, {
    cartId,
    productId: request.productId,
  });

  return c.json(
    {
      status: "success",
      message: "Produk berhasil dihapus dari cart",
    },
    200,
  );
});

// Done
cartController.get("/api/carts/:id/activities", async (c) => {
  const cartId = c.req.param("id");
  const user = c.get("user") as User;

  await CartRepositories.verifyCartAccess({
    cartId,
    userId: user.id,
  });

  const response = await CartRepositories.getCartActivities({ cartId });

  return c.json(
    {
      status: "success",
      data: response,
    },
    200,
  );
});
