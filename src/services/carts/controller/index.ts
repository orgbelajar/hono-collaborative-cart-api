import { Hono } from "hono";
import { CartRepositories } from "../repositories/index";
import {
  addCartPayloadSchema,
  addProductToCartPayloadSchema,
} from "../validator/index";
import { authMiddleware } from "../../../middlewares/auth";

type Variables = {
  user: {
    id: string;
  };
};

export const cartController = new Hono<{ Variables: Variables }>();

cartController.use(authMiddleware);

// --- Cart CRUD ---

cartController.post("/api/carts", async (c) => {
  const user = c.get("user"); // from authMiddleware c.set("user", { id: user.id });, example: "user-9pW6MNVi_7wgGI2js"
  const request = addCartPayloadSchema.parse(await c.req.json());

  const response = await CartRepositories.addCart(user.id, request);

  return c.json(
    {
      status: "success",
      message: "Cart berhasil ditambahkan",
      data: response,
    },
    201,
  );
});

// TODO: implement getCarts
// cartController.get("/api/carts", async (c) => {
//   const user = c.get("user");
//   const response = await CartRepositories.getCarts(user.id);

//   return c.json(
//     {
//       status: "success",
//       data: response,
//     },
//     200,
//   );
// });

cartController.delete("/api/carts/:id", async (c) => {
  const Id = c.req.param("id");
  const user = c.get("user");

  await CartRepositories.verifyCartOwner({
    cartId: Id,
    userId: user.id,
  });
  await CartRepositories.deleteCartById(Id);

  return c.json(
    {
      status: "success",
      message: "Cart berhasil dihapus",
    },
    200,
  );
});

// --- Cart Items ---

cartController.post("/api/carts/:id/products", async (c) => {
  const cartId = c.req.param("id");
  const user = c.get("user");
  const request = addProductToCartPayloadSchema.parse(await c.req.json());

  const response = await CartRepositories.addProductToCart(
    cartId,
    user.id,
    request,
  );

  return c.json(
    {
      status: "success",
      message: "Produk berhasil ditambahkan ke cart",
      data: response,
    },
    201,
  );
});

cartController.get("/api/carts/:id/products", async (c) => {
  const cartId = c.req.param("id");
  const user = c.get("user");

  const response = await CartRepositories.getProductsFromCart(cartId, user.id);

  return c.json(
    {
      status: "success",
      data: response,
    },
    200,
  );
});

cartController.delete("/api/carts/:id/products/:itemId", async (c) => {
  const cartId = c.req.param("id");
  const itemId = c.req.param("itemId");
  const user = c.get("user");

  await CartRepositories.deleteProductFromCart(cartId, itemId, user.id);

  return c.json(
    {
      status: "success",
      message: "Produk berhasil dihapus dari cart",
    },
    200,
  );
});

// --- Cart Activities ---

cartController.get("/api/carts/:id/activities", async (c) => {
  const cartId = c.req.param("id");
  const user = c.get("user");

  const response = await CartRepositories.getCartActivities(cartId, user.id);

  return c.json(
    {
      status: "success",
      data: response,
    },
    200,
  );
});
