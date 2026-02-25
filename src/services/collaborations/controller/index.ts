import { Hono } from "hono";
import { CollaborationRepositories } from "../repositories/index";
import { CartRepositories } from "../../carts/repositories/index";
import { collaborationPayloadSchema } from "../validator/index";
import { authMiddleware } from "../../../middlewares/auth";

type Variables = {
  user: {
    id: string;
  };
};

export const collaborationController = new Hono<{ Variables: Variables }>();

collaborationController.use(authMiddleware);

collaborationController.post("/api/collaborations", async (c) => {
  const user = c.get("user");
  const request = collaborationPayloadSchema.parse(await c.req.json());

  // Hanya owner cart yang berhak menambah kolaborator
  await CartRepositories.verifyCartOwner(request.cartId, user.id);

  const response = await CollaborationRepositories.addCollaboration(request);

  return c.json(
    {
      status: "success",
      message: "Kolaborasi berhasil ditambahkan",
      data: response,
    },
    201,
  );
});

collaborationController.delete("/api/collaborations", async (c) => {
  const user = c.get("user");
  const request = collaborationPayloadSchema.parse(await c.req.json());

  // Hanya owner cart yang berhak menghapus kolaborator
  await CartRepositories.verifyCartOwner(request.cartId, user.id);

  await CollaborationRepositories.deleteCollaboration(request);

  return c.json(
    {
      status: "success",
      message: "Kolaborasi berhasil dihapus",
    },
    200,
  );
});
