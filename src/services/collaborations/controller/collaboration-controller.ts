import { Hono } from "hono";
import { authMiddleware } from "../../../middlewares/auth";
import type { ApplicationVariables } from "../../../model/app-model";
import CartRepositories from "../../carts/repositories/cart-repositories";
import CollaborationRepositories from "../repositories/collaboration-repositories";
import { collaborationPayloadSchema } from "../validator/schema";

export const collaborationController = new Hono<{
  Variables: ApplicationVariables;
}>();

collaborationController.use(authMiddleware);

// Done
collaborationController.post("/api/collaborations", async (c) => {
  const credential = c.get("user");
  const request = collaborationPayloadSchema.parse(await c.req.json());

  // Hanya owner cart yang berhak menambah kolaborator
  await CartRepositories.verifyCartOwner(request.cartId, credential);

  const response = await CollaborationRepositories.addCollaboration(request);

  return c.json(
    {
      status: "success",
      message: "Pengguna berhasil ditambahkan ke dalam kolaborasi keranjang belanja anda",
      data: response,
    },
    201,
  );
});

// Done
collaborationController.delete("/api/collaborations", async (c) => {
  const credential = c.get("user");
  const request = collaborationPayloadSchema.parse(await c.req.json());

  // Hanya owner cart yang berhak menghapus kolaborator
  await CartRepositories.verifyCartOwner(request.cartId, credential);

  await CollaborationRepositories.deleteCollaboration(request);

  return c.json(
    {
      status: "success",
      message: "Pengguna berhasil dihapus dari kolaborasi keranjang belanja anda",
    },
    200,
  );
});
