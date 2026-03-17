import { Hono } from "hono";
import { authMiddleware } from "../../../middlewares/auth";
import { ApplicationVariables } from "../../../model/app-model";
import { exportOrderPayloadSchema } from "../validator/schema";
import { ExportService } from "../publishers/export-service";
import type { ExportOrderMessage } from "../../../model/export-model";

export const exportController = new Hono<{
  Variables: ApplicationVariables;
}>();

exportController.use(authMiddleware);

exportController.post("/api/export/order/:cartId", async (c) => {
  const request = exportOrderPayloadSchema.parse(await c.req.json());
  const credential = c.get("user");
  const cartId = c.req.param("cartId");

  const message: ExportOrderMessage = {
    cartId: cartId,
    targetEmail: request.targetEmail,
    userId: credential.id,
    username: credential.username,
    requestedAt: new Date().toISOString(),
  };

  await ExportService.sendMessage("export.order", message);

  return c.json(
    {
      status: "success",
      message:
        "Permintaan export laporan pesanan sedang diproses. Laporan pesanan akan dikirim ke email yang diminta.",
    },
    201,
  );
});
